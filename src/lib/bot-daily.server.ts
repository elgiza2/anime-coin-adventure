// Daily bot reminders + one chat gift per day. Rules mirrored by wall_today_gift / wall_claim_gift.
export const DAILY_GIFT_COINS = 50;
export const SLOT_HOURS_UTC = [8, 14, 20] as const; // 3 reminders a day
export const BATCH = 150; // max messages per run; the scheduler calls again for the rest

const APP_URL = "https://t.me/Mixsaabot?startapp";

/** The latest slot that has started, e.g. "2026-11-17T14". */
export function currentSlot(now = new Date()): { key: string; hour: number } {
  const h = now.getUTCHours();
  const past = SLOT_HOURS_UTC.filter((s) => s <= h);
  const d = new Date(now);
  let hour: number;
  if (past.length) hour = past[past.length - 1]!;
  else { d.setUTCDate(d.getUTCDate() - 1); hour = SLOT_HOURS_UTC[SLOT_HOURS_UTC.length - 1]!; }
  return { key: `${d.toISOString().slice(0, 10)}T${String(hour).padStart(2, "0")}`, hour };
}

const TEXTS: Record<number, string> = {
  8: "<b>🎁 Your daily gift is here, {name}.</b>\n\n<b>Mikasa left you {coins} $ANIME coins.</b>\nTap the button to add them to your account — today only.",
  14: "<b>⚔️ The wall needs you, {name}.</b>\n\n<b>Your heroes have been mining.</b> Collect your coins and push one more level.",
  20: "<b>📖 Tonight's chapter is waiting, {name}.</b>\n\n<b>Your story continues where you left it.</b> Don't lose your streak.",
};

export function slotMessage(hour: number, name: string, giftId: string | null) {
  const text = TEXTS[hour]!.replace("{name}", name).replace("{coins}", String(DAILY_GIFT_COINS));
  const rows: unknown[][] = [];
  if (giftId) rows.push([{ text: `🎁 Claim ${DAILY_GIFT_COINS} coins`, callback_data: `gift:${giftId}`, style: "success" }]);
  rows.push([{ text: "⚔️ Open the game", url: APP_URL, style: "primary" }]);
  return { text, reply_markup: { inline_keyboard: rows } };
}

export async function cronSecret(token: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`wall-cron:${token}`));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

import { createFileRoute } from "@tanstack/react-router";

const APP_URL = "https://t.me/Mixsaabot?startapp";
const COMMUNITY = "https://t.me/micahub";

async function secretFor(token: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`tg-webhook:${token}`));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function startText(name: string) {
  return [
    `<b>⚔️ Welcome, ${name}.</b>`,
    "",
    "<b>Mikasa is calling you to the wall.</b>",
    "",
    "<b>⛏ Mine $ANIME every day</b> — your level sets your daily earnings.",
    "<b>🎴 Mint limited NFT cards</b> — only a few copies are left.",
    "<b>📖 Play the endless anime story</b> — win, lose, and fight again.",
    "<b>💎 $ANIME is listed on Binance.</b>",
    "",
    "<b>Tap below and take your place.</b>",
  ].join("\n");
}

const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env["TELEGRAM_BOT_TOKEN"];
        if (!token) return new Response("not configured", { status: 500 });
        if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== (await secretFor(token))) {
          return new Response("Unauthorized", { status: 401 });
        }
        const update = (await request.json().catch(() => null)) as {
          message?: { chat?: { id?: number }; text?: string; from?: { first_name?: string } };
        } | null;
        const msg = update?.message;
        if (msg?.chat?.id && typeof msg.text === "string" && msg.text.startsWith("/start")) {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: msg.chat.id,
              parse_mode: "HTML",
              text: startText(esc(msg.from?.first_name || "Soldier")),
              reply_markup: {
                inline_keyboard: [
                  [{ text: "⚔️ Open the game", url: APP_URL, style: "primary" }],
                  [
                    { text: "📣 Community", url: COMMUNITY, style: "success" },
                    { text: "💎 $ANIME on Binance", url: "https://www.binance.com/en/trade/ANIME_USDT", style: "danger" },
                  ],
                ],
              },
            }),
          });
        }
        return Response.json({ ok: true });
      },
    },
  },
});

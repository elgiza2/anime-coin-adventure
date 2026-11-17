import { createFileRoute } from "@tanstack/react-router";
import cover from "@/assets/brand/bot-start-cover.jpg?inline";

const APP_URL = "https://t.me/Mixsaabot?startapp";
const GROUP = "https://t.me/micahub";

// Animated custom emoji from the owner's packs (falls back to the plain emoji if Telegram refuses).
const e = (id: string, alt: string) => `<tg-emoji emoji-id="${id}">${alt}</tg-emoji>`;
const E = {
  fire: e("5046769637191058547", "🔥"),
  coin: e("5127453140467058523", "🪙"),
  gem: e("5127459531378394661", "💎"),
  star: e("5409271925014801629", "🌟"),
  gift: e("6032937473162614352", "🎁"),
  news: e("4992560350982309130", "📣"),
  bolt: e("5046752770854487087", "⚡️"),
  ok: e("5406690851533370477", "✅"),
};

async function secretFor(token: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`tg-webhook:${token}`));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function startText(name: string) {
  return [
    `<b>${E.fire} Welcome, ${name}.</b>`,
    "",
    "<b>Mikasa is calling you to the wall.</b>",
    "",
    `<b>${E.coin} Mine $ANIME every day</b> — your level sets your daily earnings.`,
    `<b>${E.gift} Mint limited NFT cards</b> — only a few copies are left.`,
    `<b>${E.bolt} Play the endless anime story</b> — win, lose, and fight again.`,
    `<b>${E.gem} $ANIME is listed on Binance.</b>`,
    "",
    `<b>${E.star} Tap below and take your place.</b>`,
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
          const chatId = msg.chat!.id;
          const reply_markup = {
            inline_keyboard: [
              [{ text: "⚔️ Open the game", url: APP_URL, style: "primary" }],
              [{ text: "👥 Join the group", url: GROUP, style: "success" }],
              [{ text: "💎 $ANIME on Binance", url: "https://www.binance.com/en/trade/ANIME_USDT", style: "danger" }],
            ],
          };
          const api = `https://api.telegram.org/bot${token}`;
          // Upload the photo bytes directly so no public image link is needed.
          const sendPhoto = (caption: string) => {
            const b64 = cover.slice(cover.indexOf(",") + 1);
            const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
            const fd = new FormData();
            fd.append("chat_id", String(chatId));
            fd.append("parse_mode", "HTML");
            fd.append("caption", caption);
            fd.append("reply_markup", JSON.stringify(reply_markup));
            fd.append("photo", new Blob([bytes], { type: "image/jpeg" }), "mikasa.jpg");
            return fetch(`${api}/sendPhoto`, { method: "POST", body: fd });
          };
          const caption = startText(esc(msg.from?.first_name || "Soldier"));
          const plain = caption.replace(/<tg-emoji[^>]*>(.*?)<\/tg-emoji>/g, "$1");
          let res = await sendPhoto(caption);
          if (!res.ok) { console.error("start photo", res.status, await res.text()); res = await sendPhoto(plain); }
          if (!res.ok) {
            console.error("start photo plain", res.status, await res.text());
            // Last resort: text only, so /start always answers.
            await fetch(`${api}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, parse_mode: "HTML", text: plain, reply_markup }),
            });
          }
        }
        return Response.json({ ok: true });
      },
    },
  },
});

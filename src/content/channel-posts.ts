// Channel posts, drafted ahead of time. Nothing here is sent until the owner says "publish".
import { ANIME_EXCHANGES } from "@/lib/anime-exchanges";

export const APP_LINK = "https://t.me/Mixsaabot?startapp";
export const GROUP_LINK = "https://t.me/micahub";
export const COMMUNITY_LINK = "https://t.me/oraien";

type Btn = { text: string; url: string; style?: "primary" | "success" | "danger"; icon_custom_emoji_id?: string };
export type ChannelPost = { day: number; image: string; caption: string; buttons: Btn[][] };

const TOP = ["Binance", "Upbit", "Bybit", "OKX", "Kraken", "Bitget", "KuCoin", "Gate", "MEXC", "HTX", "Crypto.com", "Bithumb", "Bitvavo", "WhiteBIT", "Uniswap (Ethereum)"];
const exchangeRows = (): Btn[][] => {
  const list = TOP.map((n) => ANIME_EXCHANGES.find((e) => e.name === n)).filter((e): e is NonNullable<typeof e> => !!e);
  const rows: Btn[][] = [];
  for (let i = 0; i < list.length; i += 3) rows.push(list.slice(i, i + 3).map((e) => ({ text: e.name.replace(" (Ethereum)", ""), url: e.url, icon_custom_emoji_id: "5127453140467058523" })));
  return rows;
};

export const POST_1: ChannelPost = {
  day: 1,
  image: "post-01.jpg",
  caption: [
    "<b>⚔️ MIKASA HAS ARRIVED</b>",
    "",
    "<b>The wall is open. The war begins today.</b>",
    "",
    "Mikasa is a Telegram game built around <b>$ANIME</b> — a real coin already trading on Binance, Upbit, Bybit, OKX, Kraken and 25+ more exchanges.",
    "",
    "<b>🎮 What you do:</b>",
    "• Train 5 heroes across 1,000 levels",
    "• Play a 30‑chapter anime story where your choices matter",
    "• Mine <b>$ANIME</b> every day — the higher your level, the more you earn",
    "",
    "<b>💎 Why it's different:</b>",
    "• A listed coin, not a promise",
    "• Fair, limited NFT drop — only a few copies left",
    "• Withdrawals open after 30 days of play",
    "",
    "<b>👇 Tap below and claim your place on the wall.</b>",
  ].join("\n"),
  buttons: [
    [{ text: "Play Mikasa", url: APP_LINK, style: "primary", icon_custom_emoji_id: "5046752770854487087" }],
    [{ text: "Group", url: GROUP_LINK, style: "success", icon_custom_emoji_id: "5046769637191058547" }, { text: "Community", url: COMMUNITY_LINK, style: "success", icon_custom_emoji_id: "4992560350982309130" }],
    ...exchangeRows(),
  ],
};

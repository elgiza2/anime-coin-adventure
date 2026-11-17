// App translation: Arabic is the source text; each locale file maps normalized Arabic text -> translation.
// Numbers are replaced by {n} in keys so "5 لعبات" and "3 لعبات" share one entry.
export const LANGS = ["ar", "en", "ru", "es", "pt", "fr", "de", "tr", "id", "vi", "hi", "zh", "ko", "ja", "uk", "fa"] as const;
export type Lang = (typeof LANGS)[number];
export const RTL: Lang[] = ["ar", "fa"];
export const LANG_NAMES: Record<Lang, string> = { ar: "العربية", en: "English", ru: "Русский", es: "Español", pt: "Português", fr: "Français", de: "Deutsch", tr: "Türkçe", id: "Indonesia", vi: "Tiếng Việt", hi: "हिन्दी", zh: "中文", ko: "한국어", ja: "日本語", uk: "Українська", fa: "فارسی" };
const KEY = "wall_lang";

export function pickLang(code: string | null | undefined): Lang {
  const c = (code ?? "").toLowerCase().split(/[-_]/)[0];
  return (LANGS as readonly string[]).includes(c) ? (c as Lang) : "en";
}

export function detectLang(): Lang {
  try { const s = localStorage.getItem(KEY); if (s && (LANGS as readonly string[]).includes(s)) return s as Lang; } catch { /* ignore */ }
  const w = globalThis as unknown as { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { language_code?: string } } } } };
  const tg = w.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  return pickLang(tg ?? (typeof navigator !== "undefined" ? navigator.language : "ar"));
}

export function setLang(l: Lang) {
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  location.reload();
}

const NUM = /[0-9٠-٩][0-9٠-٩,.]*/g;
export function normKey(s: string) { return s.replace(/\s+/g, " ").trim().replace(NUM, "{n}"); }

export function translateText(s: string, dict: Record<string, string>): string | null {
  if (!/[\u0600-\u06FF]/.test(s)) return null;
  const hit = dict[normKey(s)];
  if (!hit) return null;
  const nums = s.match(NUM) ?? [];
  let i = 0;
  const body = hit.replace(/\{n\}/g, () => nums[i++] ?? "");
  const lead = s.match(/^\s*/)![0], trail = s.match(/\s*$/)![0];
  return lead + body + trail;
}

const files = import.meta.glob<{ default: Record<string, string> }>("./locales/*.json");
export async function loadDict(l: Lang): Promise<Record<string, string>> {
  const f = files[`./locales/${l}.json`];
  return f ? (await f()).default : {};
}

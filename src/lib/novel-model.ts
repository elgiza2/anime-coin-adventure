// Interactive anime novel. Ending rewards are mirrored by wall_novel_finish in the DB — change both together.
export type EndingId = "fall" | "escape" | "hero" | "legend";
export const ENDING_COINS: Record<EndingId, number> = { fall: 500, escape: 1500, hero: 3000, legend: 10_000 };
/** The secret (paid) choice needs one Thunder Blade, bought with TON. */
export const BLADE_ITEM = "story_blade";

export type Line = { who: string; text: string };
export type Choice = { label: string; to: string; paid?: boolean };
export type Scene = { image: "dawn" | "forest" | "tunnel" | "vault"; lines: Line[]; choices?: Choice[]; ending?: EndingId };

export const ENDING_TITLE: Record<EndingId, string> = {
  fall: "سقطت… بس اتعلمت", escape: "نجوت بالخريطة", hero: "بطل السور", legend: "أسطورة سيف الرعد",
};

export const SCENES: Record<string, Scene> = {
  start: { image: "dawn", lines: [
    { who: "الراوي", text: "الفجر لسه طالع، والضباب مغطي الأرض تحت السور." },
    { who: "ميكاسا", text: "اصحى! فيه عملاق ضخم ماشي ناحية البوابة الجنوبية." },
    { who: "القائد", text: "محتاجين حد يروح يتصرف حالاً. إنت هتعمل إيه؟" },
  ], choices: [
    { label: "أنزل أواجهه وش لوش", to: "fight" },
    { label: "أتسحب من النفق وأراقبه", to: "tunnel" },
    { label: "أستخدم سيف الرعد", to: "blade", paid: true },
  ] },
  fight: { image: "forest", lines: [
    { who: "الراوي", text: "نزلت الغابة والأرض بتترج تحت رجلك." },
    { who: "ميكاسا", text: "خلي بالك! بيبص عليك. اضرب الرقبة أو اهرب على الشجر!" },
  ], choices: [
    { label: "أضرب الرقبة", to: "hero_end" },
    { label: "أطلع على الشجر", to: "fall_end" },
  ] },
  tunnel: { image: "tunnel", lines: [
    { who: "الراوي", text: "النفق ضلمة، وفيه نقش قديم على الحيطة." },
    { who: "ميكاسا", text: "النقش ده خريطة! بس العملاق سامع خطواتك." },
  ], choices: [
    { label: "آخد الخريطة وأجري", to: "escape_end" },
    { label: "أكمل لآخر النفق", to: "fall_end" },
  ] },
  blade: { image: "vault", lines: [
    { who: "الراوي", text: "السيف نور في إيدك والبرق لف حواليك." },
    { who: "ميكاسا", text: "مستحيل… ده سيف الرعد! بضربة واحدة تخلص عليه." },
  ], choices: [{ label: "أضرب بكل قوتي", to: "legend_end" }] },
  hero_end: { image: "dawn", ending: "hero", lines: [
    { who: "الراوي", text: "ضربة واحدة، والعملاق وقع. الناس فوق السور بتهتف باسمك." },
  ] },
  escape_end: { image: "tunnel", ending: "escape", lines: [
    { who: "القائد", text: "الخريطة دي هتغير الحرب. شغل ذكي يا كشاف." },
  ] },
  fall_end: { image: "forest", ending: "fall", lines: [
    { who: "ميكاسا", text: "مسكتك قبل ما تقع. المرة الجاية فكر قبل ما تتحرك." },
  ] },
  legend_end: { image: "vault", ending: "legend", lines: [
    { who: "الراوي", text: "البرق شق السما والعملاق اختفى. اسمك اتكتب على السور للأبد." },
  ] },
};

/** Endings reachable from a scene (used to prove every path finishes). */
export function reachableEndings(from = "start", seen = new Set<string>()): Set<EndingId> {
  const out = new Set<EndingId>();
  if (seen.has(from)) return out;
  seen.add(from);
  const s = SCENES[from];
  if (!s) return out;
  if (s.ending) out.add(s.ending);
  for (const c of s.choices ?? []) for (const e of reachableEndings(c.to, seen)) out.add(e);
  return out;
}

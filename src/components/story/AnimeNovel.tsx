import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Lock, RotateCcw, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { COIN, formatAmount } from "@/lib/coin";
import { BLADE_ITEM, ENDING_COINS, ENDING_TITLE, SCENES, type Choice, type EndingId } from "@/lib/novel-model";
import { finishNovel, getNovel } from "@/lib/story.functions";
import { checkTonPayment, createTonPayment } from "@/lib/shop.functions";
import { shopErrorMessage } from "@/lib/shop-model";
import { findStoryItem } from "@/lib/story-model";
import { haptic } from "@/lib/telegram";
import { getTonConnect } from "@/lib/ton-connect";
import { cn } from "@/lib/utils";
import dawn from "@/assets/story/chapter-dawn.jpg";
import forest from "@/assets/story/chapter-forest.jpg";
import tunnel from "@/assets/story/chapter-tunnel.jpg";
import vault from "@/assets/story/chapter-vault.jpg";

const ART = { dawn, forest, tunnel, vault };
const EMBERS = Array.from({ length: 14 }, (_, i) => ({ left: `${(i * 37) % 100}%`, delay: `${(i * 0.7) % 6}s`, dur: `${6 + (i % 5)}s` }));

/** Reveals text letter by letter; tap finishes it instantly. */
function useTypewriter(text: string) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(t), v) : v + 1)), 28);
    return () => clearInterval(t);
  }, [text]);
  return { shown: text.slice(0, n), done: n >= text.length, finish: () => setN(text.length) };
}

export function AnimeNovel({ initData }: { initData: string }) {
  const [sceneId, setSceneId] = useState("start");
  const [line, setLine] = useState(0);
  const [busy, setBusy] = useState(false);
  const [won, setWon] = useState<number | null>(null);
  const [path, setPath] = useState<string[]>(["start"]);
  const stateFn = useServerFn(getNovel);
  const finishFn = useServerFn(finishNovel);
  const createFn = useServerFn(createTonPayment);
  const checkFn = useServerFn(checkTonPayment);
  const q = useQuery({ queryKey: ["wall-novel", initData], queryFn: () => stateFn({ data: { initData } }), enabled: !!initData });
  const s = q.data;
  const scene = SCENES[sceneId] ?? SCENES["start"]!;
  const cur = scene.lines[line] ?? scene.lines[0]!;
  const lastLine = line >= scene.lines.length - 1;
  const tw = useTypewriter(cur.text);
  const showChoices = lastLine && tw.done;
  const doneToday = !!s?.ending && won === null;
  const blade = findStoryItem(BLADE_ITEM)!;

  function go(to: string) { setSceneId(to); setLine(0); setPath((p) => (to === "start" ? ["start"] : [...p, to])); }
  function next() { if (!tw.done) tw.finish(); else if (!lastLine) setLine(line + 1); }

  async function buyBlade() {
    if (!initData) { toast("افتح اللعبة من تيليجرام عشان تشتري"); return; }
    setBusy(true);
    try {
      const ui = await getTonConnect();
      if (!ui.connected) { await ui.openModal(); toast("اربط محفظتك وبعدين اشتري"); return; }
      const pay = await createFn({ data: { initData, pack: BLADE_ITEM } });
      await ui.sendTransaction({ validUntil: Math.floor(Date.now() / 1000) + 600, messages: [{ address: pay.address, amount: pay.amount, payload: pay.payload }] });
      toast("تم إرسال الدفعة، جارٍ تأكيدها…");
      for (let i = 0; i < 12; i++) {
        await new Promise((res) => setTimeout(res, 5000));
        try {
          const r = await checkFn({ data: { initData, id: pay.id } });
          if (r.paid) { toast.success("سيف الرعد بقى معاك!"); haptic("success"); await q.refetch(); go("blade"); return; }
        } catch (e) { if (!(e instanceof Error && e.message.includes("not_found_yet"))) throw e; }
      }
      toast("التأكيد لسه موصلش؛ اتحقق من تبويب اللغز");
    } catch (e) { toast.error(shopErrorMessage(e)); }
    finally { setBusy(false); }
  }

  function pick(c: Choice) {
    if (c.paid && (s?.blades ?? 0) < 1) { void buyBlade(); return; }
    go(c.to);
  }

  async function claim(ending: EndingId) {
    if (!initData) { toast("افتح اللعبة من تيليجرام عشان تاخد الجايزة"); return; }
    setBusy(true);
    try { const r = await finishFn({ data: { initData, ending } }); setWon(r.coins); haptic("success"); await q.refetch(); }
    catch (e) { toast.error(shopErrorMessage(e)); }
    finally { setBusy(false); }
  }

  return <section className="absolute inset-0 overflow-hidden">
    <div key={sceneId} className="vn-enter absolute inset-0">
      <img src={ART[scene.image]} alt="" className="vn-bg h-full w-full object-cover" />
    </div>
    <div key={`f-${sceneId}`} className="vn-flash absolute inset-0" />
    <div className="vn-shade absolute inset-0" />
    {EMBERS.map((e, i) => <span key={i} className="vn-ember" style={{ left: e.left, animationDelay: e.delay, animationDuration: e.dur }} />)}

    {/* Progress + inventory */}
    <div className="absolute inset-x-4 top-[calc(max(1rem,env(safe-area-inset-top))+3.5rem)] flex items-center justify-between">
      <div className="flex gap-1.5">{Array.from({ length: 3 }, (_, i) => <span key={i} className={cn("h-1.5 w-8 rounded-full transition-colors duration-500", i < path.length ? "bg-accent" : "bg-foreground/25")} />)}</div>
      <span className="glass flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"><Zap className="size-3.5 text-accent" />{s?.blades ?? 0}</span>
    </div>

    <div className="absolute inset-x-3 bottom-28 space-y-2">
      {doneToday ? (
        <div className="vn-pop glass rounded-3xl p-5 text-center">
          <p className="font-display text-2xl font-extrabold">{ENDING_TITLE[s!.ending as EndingId] ?? "خلصت الحلقة"}</p>
          <p className="mt-1 text-sm text-foreground/80">كسبت {formatAmount(s!.coins)} {COIN.symbol} — الحلقة الجاية بكرة</p>
        </div>
      ) : won !== null && scene.ending ? (
        <div className="vn-pop glass rounded-3xl p-5 text-center">
          <p className="text-xs text-foreground/70">النهاية</p>
          <p className="font-display text-2xl font-extrabold">{ENDING_TITLE[scene.ending]}</p>
          <p className="pass-number mt-2 font-display text-4xl font-extrabold">+{formatAmount(won)}</p>
          <p className="text-sm text-foreground/70">{COIN.symbol}</p>
        </div>
      ) : <>
        <button type="button" onClick={next} className="glass block min-h-32 w-full rounded-3xl p-4 text-right">
          <span key={`${sceneId}-${line}-w`} className="vn-pop mb-2 inline-block rounded-full bg-primary px-3 py-0.5 text-xs font-extrabold text-primary-foreground">{cur.who}</span>
          <p className={cn("font-display text-lg font-bold leading-8", !tw.done && "vn-caret")}>{tw.shown}</p>
          {tw.done && !lastLine && <span className="vn-rise mt-1 flex items-center justify-end gap-1 text-xs text-foreground/70">اضغط للي بعده <ChevronLeft className="size-3.5" /></span>}
        </button>
        {showChoices && scene.choices?.map((c, i) => (
          <Button key={c.to} disabled={busy} onClick={() => pick(c)} style={{ animationDelay: `${i * 90}ms` }}
            className={cn("vn-rise h-auto w-full justify-between rounded-2xl py-3.5", c.paid && "btn-cta")} variant={c.paid ? "default" : "secondary"}>
            <span className="flex items-center gap-2 font-extrabold">{c.paid && <Zap className="size-4" />}{c.label}</span>
            {c.paid && ((s?.blades ?? 0) > 0 ? <span className="text-xs">معاك {s!.blades}</span> : <span dir="ltr" className="flex items-center gap-1 text-xs"><Lock className="size-3" />{blade.ton} TON</span>)}
          </Button>
        ))}
        {showChoices && scene.ending && (
          <div className="vn-rise flex gap-2">
            <Button disabled={busy} onClick={() => claim(scene.ending as EndingId)} className="btn-cta h-14 flex-1 rounded-2xl text-base font-extrabold">
              {ENDING_TITLE[scene.ending]} · خد {formatAmount(ENDING_COINS[scene.ending])}
            </Button>
            <Button variant="secondary" className="h-14 rounded-2xl" aria-label="ابدأ من الأول" onClick={() => go("start")}><RotateCcw className="size-5" /></Button>
          </div>
        )}
      </>}
    </div>
  </section>;
}

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Heart, Lock, PlayCircle, Skull, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { COIN, formatAmount } from "@/lib/coin";
import { AD_PLAYS_MAX, BLADE_ITEM, encounter, MAX_HEARTS, PLAYS_PACK, playsLeft, stepReward, STEPS_PER_CHAPTER, winChance, type Risk } from "@/lib/novel-model";
import { getNovel, novelAdReward, playNovel } from "@/lib/story.functions";
import { checkTonPayment, createTonPayment } from "@/lib/shop.functions";
import { shopErrorMessage } from "@/lib/shop-model";
import { findStoryItem } from "@/lib/story-model";
import { AD_PLACEHOLDER_SECONDS, hasRealAds, showRealAd } from "@/lib/rewarded-ad";
import { haptic } from "@/lib/telegram";
import { getTonConnect } from "@/lib/ton-connect";
import { cn } from "@/lib/utils";
import dawn from "@/assets/story/chapter-dawn.jpg";
import forest from "@/assets/story/chapter-forest.jpg";
import tunnel from "@/assets/story/chapter-tunnel.jpg";
import vault from "@/assets/story/chapter-vault.jpg";

const ART = { dawn, forest, tunnel, vault };
const EMBERS = Array.from({ length: 14 }, (_, i) => ({ left: `${(i * 37) % 100}%`, delay: `${(i * 0.7) % 6}s`, dur: `${6 + (i % 5)}s` }));
type Result = { win: boolean; coins: number; penalty: number; cleared: boolean };

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
  const [line, setLine] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [adLeft, setAdLeft] = useState<number | null>(null);
  const stateFn = useServerFn(getNovel);
  const playFn = useServerFn(playNovel);
  const adFn = useServerFn(novelAdReward);
  const createFn = useServerFn(createTonPayment);
  const checkFn = useServerFn(checkTonPayment);
  const q = useQuery({ queryKey: ["wall-novel", initData], queryFn: () => stateFn({ data: { initData } }), enabled: !!initData });
  const s = q.data ?? { chapter: 1, step: 1, hearts: MAX_HEARTS, playsUsed: 0, adsUsed: 0, bonus: 0, blades: 0, balance: 0, wins: 0, losses: 0 };
  const enc = encounter(s.chapter, s.step);
  const cur = enc.lines[line] ?? enc.lines[0]!;
  const lastLine = line >= enc.lines.length - 1;
  const tw = useTypewriter(cur.text);
  const left = playsLeft(s);
  const outOfPlays = left < 1;
  const blade = findStoryItem(BLADE_ITEM)!;
  const sceneKey = `${s.chapter}-${s.step}`;

  useEffect(() => { setLine(0); }, [sceneKey]);
  useEffect(() => {
    if (adLeft === null) return;
    if (adLeft <= 0) { void grantAd(); return; }
    const t = setTimeout(() => setAdLeft(adLeft - 1), 1000);
    return () => clearTimeout(t);
  }, [adLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  function next() { if (!tw.done) tw.finish(); else if (!lastLine) setLine(line + 1); }

  async function pay(pack: string, okMsg: string) {
    if (!initData) { toast("افتح اللعبة من تيليجرام عشان تشتري"); return false; }
    setBusy(true);
    try {
      const ui = await getTonConnect();
      if (!ui.connected) { await ui.openModal(); toast("اربط محفظتك وبعدين اشتري"); return false; }
      const p = await createFn({ data: { initData, pack } });
      await ui.sendTransaction({ validUntil: Math.floor(Date.now() / 1000) + 600, messages: [{ address: p.address, amount: p.amount, payload: p.payload }] });
      toast("تم إرسال الدفعة، جارٍ تأكيدها…");
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        try {
          const r = await checkFn({ data: { initData, id: p.id } });
          if (r.paid) { toast.success(okMsg); haptic("success"); await q.refetch(); return true; }
        } catch (e) { if (!(e instanceof Error && e.message.includes("not_found_yet"))) throw e; }
      }
      toast("التأكيد لسه موصلش، جرّب كمان شوية");
    } catch (e) { toast.error(shopErrorMessage(e)); }
    finally { setBusy(false); }
    return false;
  }

  async function play(risk: Risk) {
    if (!initData) { toast("افتح اللعبة من تيليجرام عشان تلعب"); return; }
    if (risk === "blade" && s.blades < 1) { await pay(BLADE_ITEM, "سيف الرعد بقى معاك!"); return; }
    setBusy(true);
    try { const r = await playFn({ data: { initData, risk } }); setResult(r); haptic(r.win ? "success" : "error"); }
    catch (e) { toast.error(shopErrorMessage(e)); }
    finally { setBusy(false); }
  }

  async function startAd() {
    if (!initData) { toast("افتح اللعبة من تيليجرام"); return; }
    if (s.adsUsed >= AD_PLAYS_MAX) return;
    if (hasRealAds) { setBusy(true); const ok = await showRealAd(); setBusy(false); if (ok) await grantAd(); else toast("لازم تكمل الإعلان للآخر"); }
    else setAdLeft(AD_PLACEHOLDER_SECONDS);
  }
  async function grantAd() {
    setAdLeft(null);
    try { await adFn({ data: { initData } }); toast.success("+1 لعبة"); await q.refetch(); }
    catch (e) { toast.error(shopErrorMessage(e)); }
  }

  async function continueAfter() { setResult(null); await q.refetch(); }

  const choices: { risk: Risk; label: string }[] = [
    { risk: "safe", label: enc.arc.moves[0] }, { risk: "bold", label: enc.arc.moves[1] }, { risk: "reckless", label: enc.arc.moves[2] },
  ];

  return <section className="absolute inset-0 overflow-hidden">
    <div key={sceneKey} className="absolute inset-0"><img src={ART[enc.arc.art]} alt="" className="vn-bg h-full w-full object-cover" /></div>
    <div key={`f-${sceneKey}`} className="vn-flash absolute inset-0" />
    <div className="vn-shade absolute inset-0" />
    {EMBERS.map((e, i) => <span key={i} className="vn-ember" style={{ left: e.left, animationDelay: e.delay, animationDuration: e.dur }} />)}

    <div className="absolute inset-x-4 top-[calc(max(1rem,env(safe-area-inset-top))+3.5rem)] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="glass flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold">
          {Array.from({ length: MAX_HEARTS }, (_, i) => <Heart key={i} className={cn("size-3.5", i < s.hearts ? "fill-destructive text-destructive" : "text-foreground/30")} />)}
        </span>
        <span className="glass rounded-full px-3 py-1 text-xs font-bold">لعبات: {left}</span>
        <span className="glass flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"><Zap className="size-3.5 text-accent" />{s.blades}</span>
      </div>
      <p className="vn-rise text-center font-display text-sm font-extrabold drop-shadow">{enc.title}</p>
      <div className="flex justify-center gap-1.5">{Array.from({ length: STEPS_PER_CHAPTER }, (_, i) => <span key={i} className={cn("h-1.5 w-8 rounded-full transition-colors duration-500", i < s.step ? "bg-accent" : "bg-foreground/25")} />)}</div>
    </div>

    <div className="absolute inset-x-3 bottom-28 space-y-2">
      {adLeft !== null ? (
        <div className="vn-pop glass rounded-3xl p-6 text-center">
          <p className="text-xs text-foreground/70">إعلان</p>
          <p className="pass-number font-display text-5xl font-extrabold">{adLeft}</p>
          <p className="text-sm text-foreground/80">استنى لحد ما يخلص عشان تاخد لعبة</p>
        </div>
      ) : result ? (
        <div className="vn-pop glass rounded-3xl p-5 text-center">
          {result.win ? <Trophy className="mx-auto size-10 text-accent" /> : <Skull className="mx-auto size-10 text-destructive" />}
          <p className="mt-1 font-display text-2xl font-extrabold">{result.win ? (result.cleared ? "خلصت الفصل!" : "كسبت الجولة") : result.penalty > 0 || s.hearts <= 1 ? "اتهزمت!" : "اتجرحت"}</p>
          {result.win && <p className="pass-number mt-1 font-display text-4xl font-extrabold">+{formatAmount(result.coins)} <span className="text-base">{COIN.symbol}</span></p>}
          {!result.win && (s.hearts <= 1
            ? <p className="mt-1 text-sm text-destructive">خسرت {formatAmount(result.penalty)} {COIN.symbol} والفصل هيبدأ من الأول</p>
            : <p className="mt-1 text-sm text-foreground/80">خسرت قلب — لو القلوب خلصت هتتعاقب</p>)}
          <Button onClick={continueAfter} className="btn-cta mt-4 h-12 w-full rounded-2xl font-extrabold">كمل <ChevronLeft className="size-4" /></Button>
        </div>
      ) : <>
        <button type="button" onClick={next} className="glass block min-h-28 w-full rounded-3xl p-4 text-right">
          <span key={`${sceneKey}-${line}-w`} className="vn-pop mb-2 inline-block rounded-full bg-primary px-3 py-0.5 text-xs font-extrabold text-primary-foreground">{cur.who}</span>
          <p className={cn("font-display text-lg font-bold leading-8", !tw.done && "vn-caret")}>{tw.shown}</p>
          {tw.done && !lastLine && <span className="vn-rise mt-1 flex items-center justify-end gap-1 text-xs text-foreground/70">اضغط للي بعده <ChevronLeft className="size-3.5" /></span>}
        </button>
        {lastLine && tw.done && (outOfPlays ? (
          <div className="vn-rise glass space-y-2 rounded-3xl p-4 text-center">
            <p className="font-display font-extrabold">خلصت لعبات النهارده</p>
            <Button disabled={busy || s.adsUsed >= AD_PLAYS_MAX} onClick={startAd} variant="secondary" className="h-12 w-full rounded-2xl font-extrabold">
              <PlayCircle className="size-5" />اتفرج على إعلان (+1) · {s.adsUsed}/{AD_PLAYS_MAX}
            </Button>
            <Button disabled={busy} onClick={() => pay(PLAYS_PACK.id, `+${PLAYS_PACK.plays} لعبات!`)} className="btn-cta h-12 w-full justify-between rounded-2xl font-extrabold">
              <span>{PLAYS_PACK.plays} لعبات زيادة</span><span dir="ltr" className="text-xs">{PLAYS_PACK.ton} TON</span>
            </Button>
            <p className="text-xs text-foreground/60">اللعبات المجانية بتتجدد كل يوم</p>
          </div>
        ) : <>
          {choices.map((c, i) => (
            <Button key={c.risk} disabled={busy} onClick={() => play(c.risk)} style={{ animationDelay: `${i * 90}ms` }} variant="secondary"
              className="vn-rise h-auto w-full justify-between rounded-2xl py-3">
              <span className="font-extrabold">{c.label}</span>
              <span className="text-[0.7rem] text-foreground/70">{winChance(c.risk, s.chapter)}% · +{formatAmount(stepReward(c.risk, s.chapter, s.step))}</span>
            </Button>
          ))}
          <Button disabled={busy} onClick={() => play("blade")} style={{ animationDelay: "270ms" }} className="btn-cta vn-rise h-auto w-full justify-between rounded-2xl py-3">
            <span className="flex items-center gap-2 font-extrabold"><Zap className="size-4" />سيف الرعد — فوز مضمون</span>
            {s.blades > 0 ? <span className="text-xs">معاك {s.blades}</span> : <span dir="ltr" className="flex items-center gap-1 text-xs"><Lock className="size-3" />{blade.ton} TON</span>}
          </Button>
        </>)}
      </>}
    </div>
  </section>;
}

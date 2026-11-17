import { useState } from "react";
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
import dawn from "@/assets/story/chapter-dawn.jpg";
import forest from "@/assets/story/chapter-forest.jpg";
import tunnel from "@/assets/story/chapter-tunnel.jpg";
import vault from "@/assets/story/chapter-vault.jpg";

const ART = { dawn, forest, tunnel, vault };

export function AnimeNovel({ initData }: { initData: string }) {
  const [sceneId, setSceneId] = useState("start");
  const [line, setLine] = useState(0);
  const [busy, setBusy] = useState(false);
  const [won, setWon] = useState<number | null>(null);
  const stateFn = useServerFn(getNovel);
  const finishFn = useServerFn(finishNovel);
  const createFn = useServerFn(createTonPayment);
  const checkFn = useServerFn(checkTonPayment);
  const q = useQuery({ queryKey: ["wall-novel", initData], queryFn: () => stateFn({ data: { initData } }), enabled: !!initData });
  const s = q.data;
  const scene = SCENES[sceneId] ?? SCENES["start"]!;
  const cur = scene.lines[line] ?? scene.lines[0]!;
  const lastLine = line >= scene.lines.length - 1;
  const doneToday = !!s?.ending;

  function go(to: string) { setSceneId(to); setLine(0); }

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
      toast("التأكيد لسه موصلش؛ اتحقق من متجر الكشاف تحت");
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

  const blade = findStoryItem(BLADE_ITEM)!;

  return <section className="relative z-10 mx-4 mt-4">
    <h2 className="mb-2 font-display text-lg font-extrabold">حلقة النهارده</h2>
    <article className="story-panel relative overflow-hidden rounded-3xl">
      <img key={scene.image} src={ART[scene.image]} alt="" width={768} height={1024} className="story-fade aspect-[4/5] w-full object-cover" />
      <div className="pass-shade absolute inset-0" />
      {doneToday && !won ? (
        <div className="absolute inset-x-3 bottom-3 glass rounded-2xl p-4 text-center">
          <p className="font-display text-lg font-extrabold">{ENDING_TITLE[s!.ending as EndingId] ?? "خلصت الحلقة"}</p>
          <p className="mt-1 text-sm text-foreground/80">كسبت {formatAmount(s!.coins)} {COIN.symbol} — الحلقة الجاية بكرة</p>
        </div>
      ) : (
        <div className="absolute inset-x-3 bottom-3 space-y-2">
          <button type="button" onClick={() => !lastLine && setLine(line + 1)} className="glass block w-full rounded-2xl p-3 text-right">
            <span className="mb-1 inline-block rounded-full bg-primary px-2 py-0.5 text-xs font-extrabold text-primary-foreground">{cur.who}</span>
            <p key={`${sceneId}-${line}`} className="story-fade font-display text-base font-bold leading-7">{cur.text}</p>
            {!lastLine && <span className="mt-1 flex items-center justify-end gap-1 text-xs text-foreground/70">اضغط للي بعده <ChevronLeft className="size-3.5" /></span>}
          </button>
          {lastLine && scene.choices?.map((c) => (
            <Button key={c.to} disabled={busy} onClick={() => pick(c)} className={c.paid ? "btn-cta h-auto w-full justify-between rounded-2xl py-3" : "h-auto w-full justify-between rounded-2xl py-3"} variant={c.paid ? "default" : "secondary"}>
              <span className="flex items-center gap-2 font-extrabold">{c.paid && <Zap className="size-4" />}{c.label}</span>
              {c.paid && ((s?.blades ?? 0) > 0 ? <span className="text-xs">معاك {s!.blades}</span> : <span dir="ltr" className="flex items-center gap-1 text-xs"><Lock className="size-3" />{blade.ton} TON</span>)}
            </Button>
          ))}
          {lastLine && scene.ending && (won !== null ? (
            <div className="glass rounded-2xl p-3 text-center">
              <p className="font-display text-lg font-extrabold">{ENDING_TITLE[scene.ending]}</p>
              <p className="text-sm text-accent">+{formatAmount(won)} {COIN.symbol}</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button disabled={busy} onClick={() => claim(scene.ending as EndingId)} className="btn-cta h-12 flex-1 rounded-2xl font-extrabold">
                خلّص الحلقة وخد {formatAmount(ENDING_COINS[scene.ending])} {COIN.symbol}
              </Button>
              <Button variant="secondary" className="h-12 rounded-2xl" aria-label="ابدأ من الأول" onClick={() => go("start")}><RotateCcw className="size-5" /></Button>
            </div>
          ))}
        </div>
      )}
    </article>
    <p className="mt-2 text-center text-xs text-foreground/70">كل نهاية ليها جايزة، ونهاية سيف الرعد السرية بـ {formatAmount(ENDING_COINS.legend)} {COIN.symbol}. تقدر تجرب مسارات قبل ما تخلّص.</p>
  </section>;
}

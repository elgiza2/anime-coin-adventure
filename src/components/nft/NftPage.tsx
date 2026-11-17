import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AnimatedEmoji } from "@/components/emoji/AnimatedEmoji";
import { findDesign, NFT_DESIGNS, NFT_MINT_TON, RARITY_LABEL, type MintedNft } from "@/lib/nft-model";
import { getMyNfts } from "@/lib/nft.functions";
import { formatPassNumber } from "@/lib/mine-pass-model";
import { checkTonPayment, createTonPayment } from "@/lib/shop.functions";
import { shopErrorMessage } from "@/lib/shop-model";
import { getInitData, haptic } from "@/lib/telegram";
import { getTonConnect } from "@/lib/ton-connect";
import { cn } from "@/lib/utils";
import { NFT_ART, RARITY_TEXT } from "./nft-art";
import { NftIntro, StarField } from "./NftIntro";

function NftCard({ nft, flip }: { nft: MintedNft; flip?: boolean }) {
  const d = findDesign(nft.design);
  return <div className={cn("pass-frame rounded-[1.4rem] p-[2px]", flip && "nft-flip")}>
    <div className="relative aspect-[3/4] overflow-hidden rounded-[1.3rem] bg-background">
      <img src={NFT_ART[d.id]} alt={d.name} width={816} height={816} className="absolute inset-0 size-full object-cover" />
      <div className="pass-shade absolute inset-0" />
      <div className="pass-shine pointer-events-none absolute inset-0" />
      <div dir="ltr" className="absolute inset-x-3 top-3 flex items-center justify-between text-[0.65rem] font-bold uppercase tracking-[0.2em]">
        <span className="text-foreground/85">Wall NFT</span>
        <span className={cn("rounded-full border bg-background/50 px-2 py-0.5 tracking-normal", RARITY_TEXT[d.rarity])}>{RARITY_LABEL[d.rarity]}</span>
      </div>
      <div className="absolute inset-x-3 bottom-3">
        <p className="font-display text-lg font-extrabold">{d.name}</p>
        <p dir="ltr" className="pass-number text-end font-display text-3xl font-extrabold leading-tight">{formatPassNumber(nft.serial)}</p>
      </div>
    </div>
  </div>;
}

function MysteryCard() {
  return <div className="pass-frame nft-float rounded-[1.4rem] p-[2px]">
    <div className="nft-back relative flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-[1.3rem]">
      <div className="pass-shine pointer-events-none absolute inset-0" />
      <AnimatedEmoji name="gem" className="size-20 text-accent" />
      <p className="pass-number mt-3 font-display text-6xl font-extrabold">?</p>
      <p className="mt-2 text-xs text-foreground/70">بطاقة عشوائية من {NFT_DESIGNS.length} تصميمات</p>
    </div>
  </div>;
}

export function NftPage() {
  const qc = useQueryClient();
  const [initData, setInitData] = useState("");
  const [intro, setIntro] = useState(true);
  const [busy, setBusy] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<MintedNft | null>(null);
  useEffect(() => setInitData(getInitData()), []);

  const fetchFn = useServerFn(getMyNfts);
  const createFn = useServerFn(createTonPayment);
  const checkFn = useServerFn(checkTonPayment);
  const mine = useQuery({ queryKey: ["wall-nfts", initData], queryFn: () => fetchFn({ data: { initData } }), enabled: !!initData });
  const pendingId = paymentId ?? mine.data?.pendingId ?? null;

  async function confirm(id: string) {
    const r = await checkFn({ data: { initData, id } });
    if (r.paid) {
      setPaymentId(null);
      if (r.nft) { setRevealed(r.nft); haptic("success"); toast.success(`حصلت على ${findDesign(r.nft.design).name}`); }
      await qc.invalidateQueries({ queryKey: ["wall-nfts"] });
    }
  }
  async function check() {
    if (!pendingId) return;
    setBusy(true);
    try { await confirm(pendingId); } catch (e) { toast.error(shopErrorMessage(e)); } finally { setBusy(false); }
  }
  async function mint() {
    if (!initData) { toast("افتح اللعبة من تيليجرام عشان تعمل Mint"); return; }
    setBusy(true);
    try {
      const ui = await getTonConnect();
      if (!ui.connected) { await ui.openModal(); toast("اربط محفظتك وبعدين اعمل Mint"); return; }
      const pay = await createFn({ data: { initData, pack: "nft_mint" } });
      setPaymentId(pay.id);
      await ui.sendTransaction({ validUntil: Math.floor(Date.now() / 1000) + 600, messages: [{ address: pay.address, amount: pay.amount, payload: pay.payload }] });
      toast("تم إرسال الدفعة، جارٍ تأكيدها…");
      for (let attempt = 0; attempt < 12; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        try { await confirm(pay.id); return; }
        catch (e) { if (!(e instanceof Error && e.message.includes("not_found_yet"))) throw e; }
      }
      toast("التأكيد لسه موصلش؛ تقدر تتحقق من الدفعة من غير ما تدفع تاني");
    } catch (e) { toast.error(shopErrorMessage(e)); }
    finally { setBusy(false); }
  }

  const owned = mine.data?.nfts ?? [];
  return <main className="nft-night relative mx-auto min-h-dvh max-w-md overflow-hidden pb-10">
    {intro && <NftIntro onDone={() => setIntro(false)} />}
    <StarField />
    <header className="relative z-10 flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <Link to="/battle" aria-label="رجوع لساحة الحرب" className="glass inline-flex size-10 items-center justify-center rounded-full"><ChevronRight className="size-5" /></Link>
      <h1 className="font-display text-2xl font-extrabold">NFT الحرب</h1>
    </header>

    {!intro && <section className="nft-card-in relative z-10 mx-auto mt-6 w-full max-w-[17rem] px-2">
      {revealed ? <NftCard key={revealed.serial} nft={revealed} flip /> : <MysteryCard />}
    </section>}

    {!intro && <section className="relative z-10 mt-6 space-y-2 px-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground/80">سعر الـ Mint</span>
        <span dir="ltr" className="font-display text-lg font-extrabold text-accent">{NFT_MINT_TON} TON</span>
      </div>
      <Button className="btn-cta h-12 w-full rounded-2xl text-lg font-extrabold" disabled={busy || (!!initData && mine.isPending)} onClick={mint}>
        {busy ? "جارٍ التحقق…" : revealed ? "Mint تاني" : "Mint"}
      </Button>
      {pendingId && <Button variant="outline" className="w-full" disabled={busy} onClick={check}>تحقق من دفعة سابقة</Button>}
      <div className="flex flex-wrap justify-center gap-2 pt-2 text-[0.7rem]">
        {NFT_DESIGNS.map((d) => <span key={d.id} className={cn("rounded-full border bg-background/40 px-2 py-0.5", RARITY_TEXT[d.rarity])}>{RARITY_LABEL[d.rarity]} {d.weight}%</span>)}
      </div>
    </section>}

    {!intro && owned.length > 0 && <section className="relative z-10 mt-8 px-4">
      <h2 className="mb-3 font-display text-lg font-extrabold">مجموعتي ({owned.length})</h2>
      <div className="grid grid-cols-2 gap-3">
        {owned.map((n) => <NftCard key={n.serial} nft={n} />)}
      </div>
    </section>}
  </main>;
}

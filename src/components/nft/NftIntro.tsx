import { useEffect, useRef } from "react";
import { INTRO_LINE_KO, INTRO_STILL, INTRO_VIDEO } from "./nft-art";

// Deterministic star field so server and browser render the same markup.
const STARS = Array.from({ length: 90 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return { x: r(1) * 100, y: r(2) * 100, s: 1 + r(3) * 2.2, d: r(4) * 2.6 };
});

export function StarField({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
    {STARS.map((s, i) => <span key={i} className="nft-star" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />)}
  </div>;
}

/** Intro: Mikasa speaks, camera rushes from the ground to the sky, settles on the stars, then calls onDone. */
export function NftIntro({ onDone }: { onDone: () => void }) {
  const done = useRef(false);
  const finish = () => { if (!done.current) { done.current = true; window.speechSynthesis?.cancel(); onDone(); } };

  useEffect(() => {
    if (INTRO_VIDEO) return;
    // Fallback voice until the generated clip exists: Korean line, no subtitles.
    const synth = window.speechSynthesis;
    let t: ReturnType<typeof setTimeout> | undefined;
    if (synth) {
      const u = new SpeechSynthesisUtterance(INTRO_LINE_KO);
      u.lang = "ko-KR"; u.pitch = 1.15; u.rate = 0.95;
      const ko = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("ko"));
      if (ko) u.voice = ko;
      t = setTimeout(() => synth.speak(u), 500);
    }
    const end = setTimeout(finish, 8200);
    return () => { clearTimeout(end); if (t) clearTimeout(t); synth?.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="nft-night fixed inset-0 z-50 overflow-hidden">
    {INTRO_VIDEO ? (
      <video src={INTRO_VIDEO} poster={INTRO_STILL} autoPlay playsInline onEnded={finish} onError={finish} className="absolute inset-0 size-full object-cover" />
    ) : <>
      <StarField className="nft-intro-stars" />
      <div className="nft-intro-dusk absolute inset-0" />
      <img src={INTRO_STILL} alt="" width={720} height={1280} className="nft-intro-hero absolute inset-0 size-full object-cover" />
      <div className="nft-intro-speed absolute inset-0" />
    </>}
    <button type="button" onClick={finish} className="glass absolute end-4 top-[max(1rem,env(safe-area-inset-top))] z-10 rounded-full px-4 py-1.5 text-xs font-bold text-foreground/90">تخطي</button>
  </div>;
}

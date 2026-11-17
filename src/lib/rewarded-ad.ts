// Rewarded ad. Uses Adsgram when VITE_ADSGRAM_BLOCK_ID is set; otherwise a 15s placeholder countdown.
type AdsgramCtl = { show: () => Promise<{ done: boolean }> };
declare global { interface Window { Adsgram?: { init: (o: { blockId: string }) => AdsgramCtl } } }

const BLOCK = import.meta.env["VITE_ADSGRAM_BLOCK_ID"] as string | undefined;
export const AD_PLACEHOLDER_SECONDS = 15;
export const hasRealAds = !!BLOCK;

async function loadAdsgram() {
  if (window.Adsgram) return window.Adsgram;
  await new Promise<void>((ok, bad) => {
    const s = document.createElement("script");
    s.src = "https://sad.adsgram.ai/js/sad.min.js";
    s.onload = () => ok(); s.onerror = () => bad(new Error("ad_load"));
    document.head.appendChild(s);
  });
  return window.Adsgram!;
}

/** Resolves true only when the ad was watched to the end. */
export async function showRealAd(): Promise<boolean> {
  const sdk = await loadAdsgram();
  try { return (await sdk.init({ blockId: BLOCK! }).show()).done; } catch { return false; }
}

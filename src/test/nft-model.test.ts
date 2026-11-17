import { describe, expect, it } from "vitest";
import { NFT_DESIGNS, NFT_MINT_NANO, NFT_MINT_TON, rollDesign } from "@/lib/nft-model";
import { toNano } from "@/lib/shop-model";

describe("NFT mint", () => {
  it("each mint costs 5 TON", () => {
    expect(NFT_MINT_TON).toBe(5);
    expect(toNano(NFT_MINT_TON)).toBe(5_000_000_000n);
    expect(NFT_MINT_NANO).toBe(5_000_000_000n);
  });
  it("random pick covers every design with weights adding to 100%", () => {
    expect(NFT_DESIGNS.reduce((s, d) => s + d.weight, 0)).toBe(100);
    expect(rollDesign(0)).toBe(1);
    expect(rollDesign(0.49)).toBe(1);
    expect(rollDesign(0.5)).toBe(2);
    expect(rollDesign(0.79)).toBe(2);
    expect(rollDesign(0.8)).toBe(3);
    expect(rollDesign(0.94)).toBe(3);
    expect(rollDesign(0.95)).toBe(4);
    expect(rollDesign(0.9999)).toBe(4);
  });
});

// NFT mint rules. Price and weights are mirrored by wall_confirm_payment / wall_nft_roll in the DB.
export const NFT_MINT_TON = 5;
export const NFT_MINT_NANO = 5_000_000_000n;

export type NftRarity = "common" | "rare" | "epic" | "legendary";
export type NftDesign = { id: 1 | 2 | 3 | 4; name: string; rarity: NftRarity; weight: number };

/** Weights are percentages; they must add up to 100. */
export const NFT_DESIGNS: NftDesign[] = [
  { id: 1, name: "أجنحة الحرية", rarity: "common", weight: 50 },
  { id: 2, name: "كشّاف السماء", rarity: "rare", weight: 30 },
  { id: 3, name: "عملاق القمر الأحمر", rarity: "epic", weight: 15 },
  { id: 4, name: "القلب الذهبي", rarity: "legendary", weight: 5 },
];

export const RARITY_LABEL: Record<NftRarity, string> = { common: "عادي", rare: "نادر", epic: "أسطوري", legendary: "خرافي" };

/** Same mapping as wall_nft_roll: r in [0,1) picks a design by cumulative weight. */
export function rollDesign(r: number): NftDesign["id"] {
  let acc = 0;
  for (const d of NFT_DESIGNS) {
    acc += d.weight;
    if (r < acc / 100) return d.id;
  }
  return 4;
}

export function findDesign(id: number): NftDesign {
  return NFT_DESIGNS.find((d) => d.id === id) ?? NFT_DESIGNS[0]!;
}

export type MintedNft = { serial: number; design: number; mintedAt: string };

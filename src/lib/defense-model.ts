// Wall Defense rules. Mirrored by wall_defense_load / wall_defense_play / wall_confirm_payment in the DB — change both together.
export const MAX_FREE_RUNS = 3;
export const RUN_REGEN_HOURS = 8;
export const DEFENSE_SECONDS = 60;
export const DEFENSE_LIVES = 3;
/** Highest coin payout the server accepts for one run, whatever the player scores. */
export const DEFENSE_CAP = 15_000;

export type RunPackId = "runs_3";
export const RUN_PACKS: { id: RunPackId; ton: number; runs: number; tag?: string }[] = [
  { id: "runs_3", ton: 0.5, runs: 3, tag: "3 محاولات" },
];
export function findRunPack(id: string) {
  return RUN_PACKS.find((p) => p.id === id);
}

export type TitanKind = "scout" | "brute" | "colossus";
/** taps = presses needed, coins = value when it falls, speed = field height per second. */
export const TITANS: Record<TitanKind, { taps: number; coins: number; speed: number }> = {
  scout: { taps: 1, coins: 200, speed: 0.22 },
  brute: { taps: 2, coins: 500, speed: 0.14 },
  colossus: { taps: 4, coins: 1500, speed: 0.09 },
};

/** Free runs regained since `at`: +1 per 8 hours, never above the free cap. Paid runs above the cap are kept. */
export function regenRuns(runs: number, at: Date, now: Date): number {
  if (runs >= MAX_FREE_RUNS) return runs;
  const hours = Math.floor((now.getTime() - at.getTime()) / 3_600_000 / RUN_REGEN_HOURS);
  return Math.min(MAX_FREE_RUNS, runs + Math.max(0, hours));
}

/** Milliseconds before the next titan appears; the field speeds up as the run goes on. */
export function spawnDelay(elapsedSec: number): number {
  return Math.max(550, 1200 - elapsedSec * 11);
}

/** Which titan appears at `elapsedSec` for a random draw `r` in [0,1). Heavier titans join later. */
export function pickTitan(elapsedSec: number, r: number): TitanKind {
  const scoutShare = elapsedSec < 15 ? 0.75 : elapsedSec < 35 ? 0.55 : 0.4;
  const bruteShare = elapsedSec < 15 ? 0.95 : elapsedSec < 35 ? 0.85 : 0.75;
  return r < scoutShare ? "scout" : r < bruteShare ? "brute" : "colossus";
}

/** Coins the server credits for a finished run: never negative, never above the cap. */
export function defenseCoins(score: number): number {
  return Math.min(Math.max(Math.round(score || 0), 0), DEFENSE_CAP);
}

export type DefenseState = { runs: number; runsAt: string; best: number; plays: number; pot: number; pendingId: string | null };
export type DefenseResult = { coins: number; runs: number; best: number };

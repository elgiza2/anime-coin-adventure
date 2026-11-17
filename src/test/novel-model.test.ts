import { describe, expect, it } from "vitest";
import { ENDING_COINS, reachableEndings, SCENES } from "@/lib/novel-model";

describe("anime novel", () => {
  it("pays 500 / 1500 / 3000 and 10000 for the paid legend ending", () => {
    expect(ENDING_COINS).toEqual({ fall: 500, escape: 1500, hero: 3000, legend: 10_000 });
  });
  it("every ending is reachable from the start", () => {
    expect([...reachableEndings()].sort()).toEqual(["escape", "fall", "hero", "legend"]);
  });
  it("the legend ending is only behind the paid choice", () => {
    const free = SCENES["start"]!.choices!.filter((c) => !c.paid).map((c) => c.to);
    const freeEnds = new Set(free.flatMap((t) => [...reachableEndings(t)]));
    expect(freeEnds.has("legend")).toBe(false);
  });
});

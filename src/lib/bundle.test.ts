import { describe, expect, it } from "vitest";
import {
  emptyBundle,
  firstIncomplete,
  handoff,
  needsDesign,
  qtyFitsWho,
  reachableStep,
  savingFor,
  stepsFor,
  totalCents,
  unitCents,
  unitsIn,
  type Bundle,
} from "./bundle";
import { BUNDLES } from "./cafe-offer";
import { perTrioCents } from "./packs";

const bundle = (over: Partial<Bundle> = {}): Bundle => ({ ...emptyBundle, ...over });

describe("units", () => {
  it("counts a pack as its own size", () => {
    expect(unitsIn({ kind: "pack", packSize: 200 })).toBe(200);
  });

  it("counts a case as a thousand cups", () => {
    expect(unitsIn({ kind: "case", cases: 3 })).toBe(3000);
  });
});

describe("café pricing", () => {
  it("takes the set price straight off the café sheet", () => {
    for (const oz of [8, 12, 16] as const) {
      const qty = { kind: "case", cases: 1 } as const;
      expect(unitCents(oz, "all", qty)).toBe(BUNDLES[oz].all);
      expect(unitCents(oz, "cupSleeve", qty)).toBe(BUNDLES[oz].cupSleeve);
      expect(unitCents(oz, "cupLid", qty)).toBe(BUNDLES[oz].cupLid);
    }
  });

  it("multiplies out to whole cents over a case", () => {
    // 8oz set is 27¢; a case of 1,000 is $270.
    expect(totalCents(8, "all", { kind: "case", cases: 1 })).toBe(27_000);
    expect(totalCents(16, "all", { kind: "case", cases: 2 })).toBe(31 * 2000);
  });
});

describe("consumer pricing", () => {
  it("prices the full set at the pack's trio price", () => {
    for (const packSize of [100, 200, 500] as const) {
      for (const oz of [8, 12, 16] as const) {
        expect(unitCents(oz, "all", { kind: "pack", packSize })).toBe(perTrioCents(packSize, oz));
      }
    }
  });

  it("drops a part by what that part costs inside a set, not à la carte", () => {
    const qty = { kind: "pack", packSize: 500 } as const;
    const set = unitCents(8, "all", qty);
    // Inside a set the lid is 2¢ and the sleeve 4¢ — the same deltas the café sheet implies.
    expect(set - unitCents(8, "cupSleeve", qty)).toBe(2);
    expect(set - unitCents(8, "cupLid", qty)).toBe(4);
  });

  it("keeps every consumer price above the café set for the same size", () => {
    for (const packSize of [100, 200, 500] as const) {
      for (const oz of [8, 12, 16] as const) {
        expect(unitCents(oz, "all", { kind: "pack", packSize })).toBeGreaterThan(BUNDLES[oz].all);
      }
    }
  });

  it("totals a pack exactly, with no float drift", () => {
    expect(totalCents(8, "all", { kind: "pack", packSize: 500 })).toBe(47 * 500);
  });
});

describe("who it is for", () => {
  it("offers a person packs and a café cases, and never the other way round", () => {
    expect(qtyFitsWho("self", { kind: "pack", packSize: 100 })).toBe(true);
    expect(qtyFitsWho("self", { kind: "case", cases: 1 })).toBe(false);
    expect(qtyFitsWho("cafe", { kind: "case", cases: 1 })).toBe(true);
    expect(qtyFitsWho("cafe", { kind: "pack", packSize: 500 })).toBe(false);
  });

  it("asks who before anything else, so no price is shown to the wrong buyer", () => {
    expect(firstIncomplete(emptyBundle)).toBe("who");
    expect(stepsFor(emptyBundle)[0].id).toBe("who");
    expect(reachableStep(emptyBundle, "quantity")).toBe("who");
  });
});

describe("contents priced before a quantity exists", () => {
  it("states the saving, which is the same at every quantity and on both price lists", () => {
    expect(savingFor("all")).toBe(0);
    for (const parts of ["cupSleeve", "cupLid"] as const) {
      const saving = savingFor(parts);
      for (const oz of [8, 12, 16] as const) {
        for (const qty of [
          { kind: "pack", packSize: 100 },
          { kind: "pack", packSize: 500 },
          { kind: "case", cases: 1 },
        ] as const) {
          expect(unitCents(oz, "all", qty) - unitCents(oz, parts, qty)).toBe(saving);
        }
      }
    }
  });
});

describe("steps", () => {
  it("sends an empty bundle to the first step", () => {
    expect(firstIncomplete(emptyBundle)).toBe("who");
  });

  it("asks contents before quantity, so the quantity step can price what was chosen", () => {
    const order = stepsFor(emptyBundle).map((s) => s.id);
    expect(order.indexOf("parts")).toBeLessThan(order.indexOf("quantity"));
  });

  it("walks forward as answers arrive", () => {
    expect(firstIncomplete(bundle({ who: "self" }))).toBe("size");
    expect(firstIncomplete(bundle({ who: "self", oz: 12 }))).toBe("parts");
    expect(firstIncomplete(bundle({ who: "self", oz: 12, parts: "all" }))).toBe("quantity");
  });

  it("separates accepting the design step from having drawn anything", () => {
    const b = bundle({ who: "self", oz: 12, qty: { kind: "pack", packSize: 100 }, parts: "all" });
    // Accepting the plain sleeve is enough to move on; artwork is optional.
    expect(firstIncomplete({ ...b, designed: true, artwork: false })).toBe("review");
    expect(reachableStep({ ...b, designed: true, artwork: false }, "review")).toBe("review");
  });

  it("marks the design step optional so the rail can say so", () => {
    const design = stepsFor(emptyBundle).find((s) => s.id === "design");
    expect(design?.optional).toBe(true);
    // Nothing else claims to be skippable.
    expect(stepsFor(emptyBundle).filter((s) => s.optional)).toHaveLength(1);
  });

  it("asks for a design when the bundle has a sleeve in it", () => {
    const b = bundle({ who: "self", oz: 12, qty: { kind: "pack", packSize: 100 }, parts: "all" });
    expect(needsDesign(b)).toBe(true);
    expect(firstIncomplete(b)).toBe("design");
    expect(firstIncomplete({ ...b, designed: true })).toBe("review");
  });

  it("skips the design step entirely for a bundle with no sleeve", () => {
    const b = bundle({ who: "self", oz: 12, qty: { kind: "pack", packSize: 100 }, parts: "cupLid" });
    expect(needsDesign(b)).toBe(false);
    expect(stepsFor(b).map((s) => s.id)).not.toContain("design");
    expect(firstIncomplete(b)).toBe("review");
  });

  it("will not let a deep link jump past an unanswered step", () => {
    expect(reachableStep(emptyBundle, "review")).toBe("who");
    expect(reachableStep(bundle({ who: "self", oz: 8 }), "quantity")).toBe("parts");
  });

  it("lets you go back to a step you have already answered", () => {
    const b = bundle({
      who: "self",
      oz: 8,
      qty: { kind: "pack", packSize: 100 },
      parts: "all",
      designed: true,
    });
    expect(reachableStep(b, "who")).toBe("who");
    expect(reachableStep(b, "size")).toBe("size");
    expect(reachableStep(b, "quantity")).toBe("quantity");
  });

  it("clamps a design step that this bundle does not have", () => {
    const b = bundle({ who: "self", oz: 8, qty: { kind: "pack", packSize: 100 }, parts: "cupLid" });
    expect(reachableStep(b, "design")).toBe("review");
  });
});

describe("handoff", () => {
  it("has nothing to hand off until the bundle is answered", () => {
    expect(handoff(emptyBundle)).toBeNull();
  });

  it("maps a full-set pack onto the existing pack SKU", () => {
    const h = handoff(bundle({ who: "self", oz: 12, qty: { kind: "pack", packSize: 200 }, parts: "all" }));
    expect(h).toEqual({ kind: "cart", slug: "pack-200-12oz", qty: 1 });
  });

  it("maps full-set cases onto the case SKU, one line per case", () => {
    const h = handoff(bundle({ who: "cafe", oz: 16, qty: { kind: "case", cases: 4 }, parts: "all" }));
    expect(h).toEqual({ kind: "cart", slug: "16oz-pha-cup", qty: 4 });
  });

  it("sends a partial bundle to a quote rather than inventing a SKU", () => {
    for (const parts of ["cupSleeve", "cupLid"] as const) {
      const h = handoff(bundle({ who: "self", oz: 8, qty: { kind: "pack", packSize: 100 }, parts }));
      expect(h?.kind).toBe("quote");
    }
  });
});

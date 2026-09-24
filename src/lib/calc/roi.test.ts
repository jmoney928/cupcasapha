import { describe, expect, it } from "vitest";
import { ACCEPTANCE, annualCups, calculateRoi, roiSentence, WEEKS_PER_YEAR } from "./roi";
import { formatCad, toCents } from "./money";

/** The spec's worked example: 250 cups/day, 7 days, $0.14 → $0.22 cup, $5.75 drink, +$0.15. */
const base = {
  cupsPerDay: 250,
  daysOpenPerWeek: 7,
  currentCupCostCents: 14,
  cupcasaCupCostCents: 22,
  drinkPriceCents: 575,
  priceIncreaseCents: 15,
};

describe("toCents", () => {
  it.each([
    [5.75, 575],
    ["5.75", 575],
    ["$5.75", 575],
    [0.14, 14],
    [0, 0],
    [0.145, 15], // rounds to the nearest cent
  ])("converts %p → %i", (input, expected) => {
    expect(toCents(input)).toBe(expected);
  });

  it("rejects non-numbers rather than silently yielding 0", () => {
    expect(() => toCents("abc")).toThrow(TypeError);
    expect(() => toCents(NaN)).toThrow(TypeError);
  });
});

describe("annualCups", () => {
  it("multiplies daily volume by days open and 52 weeks", () => {
    expect(annualCups(250, 7)).toBe(250 * 7 * WEEKS_PER_YEAR);
    expect(annualCups(250, 7)).toBe(91_000);
  });

  it("handles a café open 5 days", () => {
    expect(annualCups(300, 5)).toBe(78_000);
  });

  it("clamps days open to a real week", () => {
    expect(annualCups(100, 9)).toBe(annualCups(100, 7));
    expect(annualCups(100, -2)).toBe(0);
  });

  it("is zero at zero volume", () => {
    expect(annualCups(0, 7)).toBe(0);
  });
});

describe("calculateRoi", () => {
  it("computes the spec's worked example at the measured acceptance rate", () => {
    const r = calculateRoi(base);
    expect(r.annualCups).toBe(91_000);
    // 91,000 × (22¢ − 14¢) = $7,280 more on cups
    expect(r.addedCupCostCents).toBe(91_000 * 8);
    // 91,000 × 15¢ × 0.98 = $13,377
    expect(r.addedRevenueCents).toBe(Math.round(91_000 * 15 * 0.98));
    expect(r.netGainCents).toBe(r.addedRevenueCents - r.addedCupCostCents);
    expect(r.isNetLoss).toBe(false);
    expect(formatCad(r.netGainCents)).toBe("$6,097");
  });

  it("never models acceptance above the measured figure", () => {
    const optimistic = calculateRoi({ ...base, acceptance: 1 });
    expect(optimistic.acceptance).toBe(ACCEPTANCE.measured);
    expect(optimistic.addedRevenueCents).toBe(calculateRoi(base).addedRevenueCents);
  });

  it("the conservative toggle lowers revenue but not cost", () => {
    const measured = calculateRoi(base);
    const conservative = calculateRoi({ ...base, acceptance: ACCEPTANCE.conservative });
    expect(conservative.addedRevenueCents).toBeLessThan(measured.addedRevenueCents);
    expect(conservative.addedCupCostCents).toBe(measured.addedCupCostCents);
    expect(conservative.netGainCents).toBeLessThan(measured.netGainCents);
  });

  it("zero volume yields zeros and no loss flag", () => {
    const r = calculateRoi({ ...base, cupsPerDay: 0 });
    expect(r.annualCups).toBe(0);
    expect(r.addedCupCostCents).toBe(0);
    expect(r.addedRevenueCents).toBe(0);
    expect(r.netGainCents).toBe(0);
    expect(r.isNetLoss).toBe(false);
  });

  it("a café already paying more than us shows a saving, not a cost", () => {
    const r = calculateRoi({ ...base, currentCupCostCents: 30 });
    expect(r.addedCupCostCents).toBeLessThan(0);
    expect(r.netGainCents).toBeGreaterThan(r.addedRevenueCents);
    expect(r.isNetLoss).toBe(false);
  });

  it("flags the honest loss when a cheap cup meets no price increase", () => {
    const r = calculateRoi({ ...base, currentCupCostCents: 8, priceIncreaseCents: 0 });
    expect(r.addedRevenueCents).toBe(0);
    expect(r.addedCupCostCents).toBe(91_000 * 14);
    expect(r.netGainCents).toBe(-91_000 * 14);
    expect(r.isNetLoss).toBe(true);
  });

  it("does not fudge the arithmetic to avoid a loss", () => {
    const r = calculateRoi({ ...base, currentCupCostCents: 5, priceIncreaseCents: 10 });
    // 91,000 × 10¢ × 0.98 = 891,800 revenue; 91,000 × 17¢ = 1,547,000 cost
    expect(r.netGainCents).toBe(891_800 - 1_547_000);
    expect(r.netGainCents).toBeLessThan(0);
  });

  it("breaks even exactly when the increase offsets the cup delta", () => {
    // delta 8¢; an increase of 8¢/0.98 ≈ 8.163¢ is needed to offset it
    const r = calculateRoi({ ...base, priceIncreaseCents: 8 / ACCEPTANCE.measured });
    expect(Math.abs(r.netGainCents)).toBeLessThanOrEqual(1);
  });

  it("per-cup figures line up with the annual totals", () => {
    const r = calculateRoi(base);
    expect(r.perCup.newDrinkPriceCents).toBe(590);
    expect(r.perCup.marginChangeCents).toBeCloseTo(15 * 0.98 - 8, 6);
    expect(r.perCup.marginChangeCents * r.annualCups).toBeCloseTo(r.netGainCents, 0);
  });

  it("scales linearly with volume", () => {
    const a = calculateRoi(base);
    const b = calculateRoi({ ...base, cupsPerDay: 500 });
    expect(b.netGainCents).toBe(a.netGainCents * 2);
  });

  it("returns whole cents, never fractions", () => {
    const r = calculateRoi({ ...base, cupsPerDay: 137, acceptance: 0.9 });
    for (const v of [r.addedCupCostCents, r.addedRevenueCents, r.netGainCents]) {
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe("roiSentence", () => {
  it("leads with the cost, then the gain", () => {
    const s = roiSentence(calculateRoi(base), formatCad);
    expect(s).toBe("Switching costs you $7,280 more in cups and earns you $13,377 more in revenue. You keep $6,097.");
  });

  it("states a loss plainly", () => {
    const s = roiSentence(calculateRoi({ ...base, currentCupCostCents: 8, priceIncreaseCents: 0 }), formatCad);
    expect(s).toContain("down over a year");
  });

  it("says 'saves' when their cup already costs more", () => {
    const s = roiSentence(calculateRoi({ ...base, currentCupCostCents: 30 }), formatCad);
    expect(s).toContain("saves you");
  });

  it("prompts rather than showing zeros at no volume", () => {
    expect(roiSentence(calculateRoi({ ...base, cupsPerDay: 0 }), formatCad)).toContain("Enter your daily cup volume");
  });
});

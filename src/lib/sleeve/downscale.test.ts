import { describe, expect, it } from "vitest";
import { MAX_EDGE_PX, PRINT_DPI, dataUrlBytes, targetSize } from "./downscale";
import { SLEEVE_DIELINES } from "./dielines";

describe("MAX_EDGE_PX", () => {
  it("is the widest sleeve at press resolution", () => {
    const widest = Math.max(...Object.values(SLEEVE_DIELINES).map((d) => d.arcTop));
    const needed = Math.ceil((widest / 25.4) * PRINT_DPI);
    // Every dieline must be printable at 300dpi within the cap; none should need more.
    expect(MAX_EDGE_PX).toBeGreaterThanOrEqual(needed);
  });
});

describe("targetSize", () => {
  it("leaves a small picture alone", () => {
    expect(targetSize(800, 600)).toEqual({ width: 800, height: 600, scaled: false });
  });

  it("never upscales", () => {
    const { width, scaled } = targetSize(100, 100);
    expect(width).toBe(100);
    expect(scaled).toBe(false);
  });

  it("brings a phone photo down to the longest edge", () => {
    const { width, height, scaled } = targetSize(4032, 3024);
    expect(scaled).toBe(true);
    expect(Math.max(width, height)).toBe(MAX_EDGE_PX);
  });

  it("keeps the aspect ratio", () => {
    const { width, height } = targetSize(4000, 1000);
    expect(width / height).toBeCloseTo(4, 1);
  });

  it("scales on the long edge whichever way the picture is turned", () => {
    const landscape = targetSize(6000, 2000);
    const portrait = targetSize(2000, 6000);
    expect(landscape.width).toBe(MAX_EDGE_PX);
    expect(portrait.height).toBe(MAX_EDGE_PX);
  });

  it("never rounds a dimension away to nothing", () => {
    const { width, height } = targetSize(20000, 3);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });

  it("copes with a zero-sized image rather than dividing by it", () => {
    expect(targetSize(0, 0)).toEqual({ width: 0, height: 0, scaled: false });
  });
});

describe("dataUrlBytes", () => {
  it("measures the decoded payload, not the base64 text", () => {
    // "AAAA" decodes to three bytes.
    expect(dataUrlBytes("data:image/png;base64,AAAA")).toBe(3);
  });

  it("accounts for padding", () => {
    expect(dataUrlBytes("data:image/png;base64,AAA=")).toBe(2);
    expect(dataUrlBytes("data:image/png;base64,AA==")).toBe(1);
  });

  it("handles a non-base64 data URL", () => {
    expect(dataUrlBytes("data:image/svg+xml,<svg/>")).toBe(6);
  });

  it("is roughly three quarters of the string, as base64 is", () => {
    const body = "A".repeat(4000);
    expect(dataUrlBytes(`data:image/jpeg;base64,${body}`)).toBe(3000);
  });
});

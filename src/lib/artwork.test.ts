import { describe, expect, it } from "vitest";
import { MAX_ARTWORK_BYTES, buildArtwork, describeDoc, sanitiseArtwork } from "./artwork";
import { emptyDoc, newShape, newText } from "./sleeve/doc";
import type { SleeveDoc } from "./sleeve/doc";

const doc = (over: Partial<SleeveDoc> = {}): SleeveDoc => ({ ...emptyDoc(12), ...over });

describe("describeDoc", () => {
  it("names the stock", () => {
    expect(describeDoc(doc({ background: "#f4f1ea", elements: [] }))).toContain("White stock");
    expect(describeDoc(doc({ background: "#a9855f", elements: [] }))).toContain("Kraft brown stock");
  });

  it("quotes the text on the sleeve", () => {
    const d = doc({ elements: [newText(12, { id: "a", text: "Blue Heron Coffee" })] });
    expect(describeDoc(d)).toContain("“Blue Heron Coffee”");
  });

  it("counts uploads and shapes rather than dumping them", () => {
    const d = doc({
      elements: [newShape(12, "rect"), newShape(12, "ellipse")],
    });
    const out = describeDoc(d);
    expect(out).toContain("2 shapes");
    // A description is for reading, so no data URLs may leak into it.
    expect(out).not.toContain("data:");
  });

  it("mentions a background picture without embedding it", () => {
    const d = doc({ backgroundImage: "data:image/png;base64,AAAA", elements: [] });
    expect(describeDoc(d)).toContain("uploaded background picture");
    expect(describeDoc(d)).not.toContain("base64");
  });

  it("names a pattern but stays quiet about a plain sleeve", () => {
    expect(describeDoc(doc({ pattern: "dots", elements: [] }))).toContain("Dots background");
    expect(describeDoc(doc({ pattern: "none", elements: [] }))).not.toContain("background");
  });
});

describe("buildArtwork", () => {
  it("keeps a file that fits", () => {
    const a = buildArtwork("pack-100-12oz", 12, "White stock", "<svg/>");
    expect(a.svg).toBe("<svg/>");
    expect(a.omitted).toBeUndefined();
  });

  it("drops a file that would not survive the request, and says so", () => {
    const huge = "<svg>" + "x".repeat(MAX_ARTWORK_BYTES + 1);
    const a = buildArtwork("pack-100-12oz", 12, "White stock", huge);
    expect(a.svg).toBeNull();
    expect(a.omitted).toBe("too-large");
    // The summary still travels, so the order is not silent about having had artwork.
    expect(a.summary).toBe("White stock");
  });
});

describe("sanitiseArtwork", () => {
  it("ignores anything that is not a list", () => {
    expect(sanitiseArtwork(null)).toEqual([]);
    expect(sanitiseArtwork("pack-100-8oz")).toEqual([]);
    expect(sanitiseArtwork({ slug: "x" })).toEqual([]);
  });

  it("requires a slug", () => {
    expect(sanitiseArtwork([{ svg: "<svg/>" }])).toEqual([]);
  });

  it("refuses anything that is not an SVG", () => {
    const [a] = sanitiseArtwork([
      { slug: "pack-100-8oz", svg: "<script>alert(1)</script>", summary: "x" },
    ]);
    expect(a.svg).toBeNull();
    // Not "too-large" — it was refused for what it is, and the email should say so.
    expect(a.omitted).toBe("unreadable");
  });

  it("caps an oversized file rather than passing it on", () => {
    const [a] = sanitiseArtwork([
      { slug: "pack-100-8oz", svg: "<svg" + "x".repeat(MAX_ARTWORK_BYTES), summary: "x" },
    ]);
    expect(a.svg).toBeNull();
    expect(a.omitted).toBe("too-large");
  });

  it("trims a summary so it cannot blow Stripe's metadata limit", () => {
    const [a] = sanitiseArtwork([{ slug: "pack-100-8oz", summary: "y".repeat(5000) }]);
    expect(a.summary.length).toBeLessThanOrEqual(400);
  });

  it("keeps a well-formed record", () => {
    const [a] = sanitiseArtwork([
      { slug: "pack-500-16oz", oz: 16, summary: "Kraft brown stock", svg: "<svg/>" },
    ]);
    expect(a).toEqual({ slug: "pack-500-16oz", oz: 16, summary: "Kraft brown stock", svg: "<svg/>" });
  });
});

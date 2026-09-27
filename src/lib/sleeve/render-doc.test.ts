import { describe, expect, it } from "vitest";
import { SLEEVE_SIZES, sleeveDieline } from "./dielines";
import { layout } from "./geometry";

const layoutFor = (size: 8 | 12 | 16) => layout(sleeveDieline(size));
import { add, centreOf, duplicate, emptyDoc, newShape, newText, remove, reorder, resize, update } from "./doc";
import type { SleeveDoc, TextElement } from "./doc";
import { elementBounds, estimateWidth, insideSafeArea, renderDoc, sleeveFileName, wrapLines } from "./render-doc";

const doc = (over: Partial<SleeveDoc> = {}): SleeveDoc => ({ ...emptyDoc(12), ...over });
const text = (over: Partial<TextElement> = {}) => newText(12, over);

describe("renderDoc", () => {
  it.each(SLEEVE_SIZES)("%ioz declares its true size in millimetres", (size) => {
    const svg = renderDoc(emptyDoc(size));
    const l = layout(sleeveDieline(size));
    expect(svg).toContain(`width="${Number(l.width.toFixed(3))}mm"`);
    expect(svg).toContain(`viewBox="0 0 ${Number(l.width.toFixed(3))} ${Number(l.height.toFixed(3))}"`);
  });

  it.each(SLEEVE_SIZES)("%ioz emits no NaN", (size) => {
    const d = add(emptyDoc(size), newShape(size, "ellipse"));
    expect(renderDoc(d, { guides: true })).not.toMatch(/NaN|Infinity|undefined/);
  });

  it("clips artwork to the bleed so nothing can print past the trim", () => {
    expect(renderDoc(doc())).toContain("clip-path=");
  });

  it("escapes text that would otherwise break the XML", () => {
    const svg = renderDoc(doc({ elements: [text({ text: 'Bean & "Co" <hq>' })] }));
    expect(svg).toContain("Bean &amp; &quot;Co&quot; &lt;hq&gt;");
    expect(svg).not.toContain("<hq>");
  });

  it("refuses a colour it cannot vouch for, rather than writing it into the file", () => {
    const svg = renderDoc(doc({ background: 'red" onload="alert(1)', elements: [text({ fill: "#fff" })] }));
    expect(svg).not.toContain("onload");
    expect(svg).toContain('fill="#1a1a1a"');
    expect(svg).toContain('fill="#fff"');
  });

  it("drops an image that is not self-contained", () => {
    for (const bad of ["https://example.com/logo.png", "javascript:alert(1)", "data:text/html;base64,AAAA"]) {
      const svg = renderDoc(doc({ elements: [{ ...text(), kind: "image", href: bad, width: 10, height: 10 } as never] }));
      expect(svg).not.toContain("<image");
      expect(svg).not.toContain(bad);
    }
  });

  it("draws guides only when asked", () => {
    expect(renderDoc(doc(), { guides: true })).toContain("stroke-dasharray");
    expect(renderDoc(doc(), { guides: false })).not.toContain("stroke-dasharray");
  });

  it("gives each render its own path ids, so two previews never collide", () => {
    const curved = doc({ elements: [text({ curve: 40 })] });
    expect(renderDoc(curved, { idPrefix: "a" })).toContain('id="a-');
    expect(renderDoc(curved, { idPrefix: "b" })).toContain('id="b-');
  });

  it("puts every line of curved text on its own arc", () => {
    const svg = renderDoc(doc({ elements: [text({ text: "one\ntwo\nthree", curve: 40 })] }));
    expect(svg.match(/<textPath/g)).toHaveLength(3);
    expect(svg.match(/<path id=/g)).toHaveLength(3);
  });

  it("names the download after the first line of text", () => {
    expect(sleeveFileName(doc({ size: 16, elements: [text({ text: "Bean & Co\nVictoria" })] }))).toBe(
      "cupcasa-sleeve-16oz-bean-co.svg"
    );
    expect(sleeveFileName(doc({ elements: [] }))).toBe("cupcasa-sleeve-12oz-artwork.svg");
  });
});

describe("document operations", () => {
  it("adds, updates and removes", () => {
    let d = emptyDoc(12);
    const id = d.elements[0].id;
    d = update(d, id, { opacity: 0.5 });
    expect(d.elements[0].opacity).toBe(0.5);
    d = remove(d, id);
    expect(d.elements).toHaveLength(0);
  });

  it("duplicates with a new id, offset so the copy is visible", () => {
    const base = emptyDoc(12);
    const { doc: next, id } = duplicate(base, base.elements[0].id);
    expect(next.elements).toHaveLength(2);
    expect(id).not.toBe(base.elements[0].id);
    expect(next.elements[1].x).toBeGreaterThan(next.elements[0].x);
  });

  it("reorders within the paint order", () => {
    let d = emptyDoc(12);
    d = add(d, newShape(12, "rect"));
    const [first, second] = d.elements.map((e) => e.id);
    expect(reorder(d, first, "front").elements.map((e) => e.id)).toEqual([second, first]);
    expect(reorder(d, second, "back").elements.map((e) => e.id)).toEqual([second, first]);
  });

  /* Without this a design jumps off the band the moment someone tries another size. */
  it("carries the design across when the size changes", () => {
    const d = emptyDoc(12);
    const moved = resize(d, 16);
    const delta = { x: centreOf(16).x - centreOf(12).x, y: centreOf(16).y - centreOf(12).y };
    expect(moved.size).toBe(16);
    expect(moved.elements[0].x).toBeCloseTo(d.elements[0].x + delta.x, 6);
    expect(moved.elements[0].y).toBeCloseTo(d.elements[0].y + delta.y, 6);
  });

  it("leaves the document alone when the size is unchanged", () => {
    const d = emptyDoc(12);
    expect(resize(d, 12)).toBe(d);
  });
});

describe("bounds", () => {
  it("grows with the number of lines", () => {
    const one = elementBounds(text({ text: "a" }), estimateWidth);
    const three = elementBounds(text({ text: "a\nb\nc" }), estimateWidth);
    expect(three.height).toBeCloseTo(one.height * 3, 6);
  });

  it("reports the box, so the wrap width is what you grab", () => {
    expect(elementBounds(text({ text: "i", width: 90 }), estimateWidth).width).toBe(90);
  });

  it("grows past the box only when a single word overhangs it", () => {
    const el = text({ text: "Supercalifragilistic", width: 5, fontSize: 10 });
    expect(elementBounds(el, estimateWidth).width).toBeCloseTo(estimateWidth("Supercalifragilistic", el), 6);
  });
});

describe("word wrap", () => {
  const long = "Inner Harbour Coffee Roasters of Victoria British Columbia";

  it("breaks a long line to the box and keeps every word", () => {
    const el = text({ text: long, width: 60, fontSize: 8 });
    const ls = wrapLines(el, estimateWidth);
    expect(ls.length).toBeGreaterThan(1);
    expect(ls.join(" ").split(/\s+/)).toEqual(long.split(/\s+/));
  });

  it("never exceeds the box unless a single word does", () => {
    const el = text({ text: long, width: 60, fontSize: 8 });
    for (const line of wrapLines(el, estimateWidth)) {
      if (line.split(/\s+/).length > 1) expect(estimateWidth(line, el)).toBeLessThanOrEqual(60);
    }
  });

  it("lets a word wider than the box overhang rather than breaking it mid-word", () => {
    const el = text({ text: "Supercalifragilistic", width: 5, fontSize: 10 });
    expect(wrapLines(el, estimateWidth)).toEqual(["Supercalifragilistic"]);
  });

  it("keeps typed breaks as hard breaks", () => {
    const el = text({ text: "one\ntwo", width: 400 });
    expect(wrapLines(el, estimateWidth)).toEqual(["one", "two"]);
  });

  it("preserves a blank line", () => {
    expect(wrapLines(text({ text: "a\n\nb", width: 400 }), estimateWidth)).toEqual(["a", "", "b"]);
  });

  it("rewraps when the box narrows", () => {
    const wide = wrapLines(text({ text: long, width: 400, fontSize: 8 }), estimateWidth);
    const narrow = wrapLines(text({ text: long, width: 40, fontSize: 8 }), estimateWidth);
    expect(narrow.length).toBeGreaterThan(wide.length);
  });

  it("renders one arc per wrapped line", () => {
    const el = text({ text: long, width: 60, fontSize: 8 });
    const svg = renderDoc(doc({ elements: [el] }));
    expect(svg.match(/<textPath/g)).toHaveLength(wrapLines(el, estimateWidth).length);
  });

  it("curves every wrapped line, not just the typed ones", () => {
    const el = text({ text: long, width: 60, fontSize: 8, curve: 40 });
    const svg = renderDoc(doc({ elements: [el] }));
    expect(svg.match(/<textPath/g)).toHaveLength(wrapLines(el, estimateWidth).length);
  });

  it("aligns against the ends of the arc the box spans", () => {
    const left = renderDoc(doc({ elements: [text({ text: "hi", width: 100, align: "left" })] }));
    const right = renderDoc(doc({ elements: [text({ text: "hi", width: 100, align: "right" })] }));
    expect(left).toContain('startOffset="0%"');
    expect(left).toContain('text-anchor="start"');
    expect(right).toContain('startOffset="100%"');
    expect(right).toContain('text-anchor="end"');
  });
});

describe("safe area", () => {
  it("accepts a modest block in the middle of the band", () => {
    const d = emptyDoc(12);
    expect(insideSafeArea(d, d.elements[0], estimateWidth)).toBe(true);
  });

  it("rejects a block that has wrapped taller than the band", () => {
    const el = text({ text: "Inner Harbour Coffee Roasters of Victoria British Columbia", width: 60, fontSize: 11 });
    expect(insideSafeArea(doc({ elements: [el] }), el, estimateWidth)).toBe(false);
  });

  it("rejects something dragged off the end of the sleeve", () => {
    const el = text({ text: "hi", width: 20, fontSize: 6, x: 5 });
    expect(insideSafeArea(doc({ elements: [el] }), el, estimateWidth)).toBe(false);
  });

  it("rejects something pushed past the glue lap", () => {
    const l = layoutFor(12);
    const el = text({ text: "hi", width: 20, fontSize: 6, x: l.width - 8 });
    expect(insideSafeArea(doc({ elements: [el] }), el, estimateWidth)).toBe(false);
  });
});


/** Radii of the arcs text is set on — the paths the textPaths point at, not the sleeve outline. */
const textArcRadii = (svg: string) =>
  [...svg.matchAll(/<path id="[^"]*-l\d+" d="M [-\d.]+ [-\d.]+ A ([\d.]+)/g)].map((m) => Number(m[1]));

const arcRadius = (svg: string) => textArcRadii(svg)[0];

/** Radii of the ring design, taken from its own group so the outline is not counted. */
const ringRadii = (svg: string) => {
  const group = /<g fill="none" stroke="[^"]*" stroke-opacity="0\.16"[^>]*>([\s\S]*?)<\/g>/.exec(svg);
  return group ? [...group[1].matchAll(/A ([\d.]+)/g)].map((m) => Number(m[1])) : [];
};

describe("text follows the band", () => {
  /*
   * The whole point of a sector: constant radius on the sheet is constant height on the cup. Text
   * off that arc slopes away once the sleeve is wrapped, which is exactly what looked wrong in the
   * cup preview.
   */
  it.each(SLEEVE_SIZES)("%ioz sets text on an arc struck from the dieline's own centre", (size) => {
    const l = layoutFor(size);
    const el = newText(size, { text: "Level", curve: 0 });
    const svg = renderDoc({ ...emptyDoc(size), elements: [el] });
    const expected = Math.hypot(el.x - l.cx, el.y - l.cy);
    expect(arcRadius(svg)).toBeCloseTo(expected, 1);
  });

  it("moves the arc with the element, so height on the cup tracks position", () => {
    const l = layoutFor(12);
    const base = newText(12, { curve: 0 });
    const higher = { ...base, y: base.y - 10 };
    const lower = { ...base, y: base.y + 10 };
    /* The centre is below the sheet, so higher up means further from it. */
    expect(arcRadius(renderDoc({ ...emptyDoc(12), elements: [higher] }))).toBeGreaterThan(
      arcRadius(renderDoc({ ...emptyDoc(12), elements: [lower] }))
    );
    expect(arcRadius(renderDoc({ ...emptyDoc(12), elements: [lower] }))).toBeLessThan(
      Math.hypot(base.x - l.cx, base.y - l.cy) + 0.001
    );
  });

  it("bends tighter or flatter than the band without ever inverting", () => {
    const flat = arcRadius(renderDoc({ ...emptyDoc(12), elements: [newText(12, { curve: -100 })] }));
    const natural = arcRadius(renderDoc({ ...emptyDoc(12), elements: [newText(12, { curve: 0 })] }));
    const tight = arcRadius(renderDoc({ ...emptyDoc(12), elements: [newText(12, { curve: 100 })] }));
    expect(flat).toBeGreaterThan(natural);
    expect(tight).toBeLessThan(natural);
    expect(tight).toBeGreaterThan(0);
  });

  it("stacks lines at falling radii, so they read as lines down the cup", () => {
    const svg = renderDoc({ ...emptyDoc(12), elements: [newText(12, { text: "one\ntwo\nthree", width: 400 })] });
    const radii = textArcRadii(svg);
    expect(radii).toHaveLength(3);
    expect(radii[0]).toBeGreaterThan(radii[1]);
    expect(radii[1]).toBeGreaterThan(radii[2]);
  });
});

describe("background designs", () => {
  it("draws nothing when plain", () => {
    expect(renderDoc(doc({ pattern: "none" }))).not.toContain("<pattern");
  });

  it.each(["stripes", "dots", "sprigs"] as const)("%s tiles the sleeve", (pattern) => {
    const svg = renderDoc(doc({ pattern }));
    expect(svg).toContain("<pattern");
    expect(svg).toContain("fill=\"url(#");
  });

  it("strikes rings from the same centre as the text, so they wrap level too", () => {
    const svg = renderDoc(doc({ pattern: "rings" }));
    const l = layoutFor(12);
    const d = sleeveDieline(12);
    const radii = ringRadii(svg);
    expect(radii.length).toBeGreaterThan(5);
    for (const r of radii) {
      expect(r).toBeGreaterThanOrEqual(d.innerRadius);
      expect(r).toBeLessThanOrEqual(d.outerRadius);
    }
    expect(l.cx).toBeGreaterThan(0);
  });

  it("keeps every design inside the sleeve", () => {
    for (const pattern of ["rings", "stripes", "dots", "sprigs", "rule"] as const) {
      expect(renderDoc(doc({ pattern }))).toContain("clip-path=");
    }
  });
});

describe("image recolour", () => {
  const img = (tint: string) => ({
    ...newText(12), kind: "image" as const, href: "data:image/png;base64,AAAA",
    width: 20, height: 20, tint,
  });

  it("leaves the file alone when asked for as uploaded", () => {
    const svg = renderDoc(doc({ elements: [img("none") as never] }));
    expect(svg).toContain("<image");
    expect(svg).not.toContain("feColorMatrix");
  });

  it("carries one copy of the picture however many slices it is cut into", () => {
    const svg = renderDoc(doc({ elements: [img("none") as never] }));
    expect(svg.match(/href="data:image\/png/g)).toHaveLength(1);
  });

  it("replaces every colour and keeps the alpha", () => {
    const svg = renderDoc(doc({ elements: [img("#e8735a") as never] }));
    expect(svg).toContain("feColorMatrix");
    /* Last row passes alpha straight through; the colour rows are constants. */
    expect(svg).toMatch(/values="0 0 0 0 [\d.]+ 0 0 0 0 [\d.]+ 0 0 0 0 [\d.]+ 0 0 0 1 0"/);
  });

  it("refuses a colour it cannot vouch for", () => {
    const svg = renderDoc(doc({ elements: [img('red" onload="x') as never] }));
    expect(svg).not.toContain("onload");
    expect(svg).not.toContain("feColorMatrix");
  });
});

describe("uploaded background", () => {
  const PNG = "data:image/png;base64,AAAA";

  it("draws nothing when none is set", () => {
    expect(renderDoc(doc({ backgroundImage: null }))).not.toContain("<image");
  });

  it("covers the whole sheet rather than stretching to fit", () => {
    const svg = renderDoc(doc({ backgroundImage: PNG }));
    const l = layoutFor(12);
    expect(svg).toContain('preserveAspectRatio="xMidYMid slice"');
    expect(svg).toContain(`width="${Number(l.width.toFixed(3))}"`);
    expect(svg).toContain(`height="${Number(l.height.toFixed(3))}"`);
  });

  it("is clipped, so a picture cannot print past the trim", () => {
    const svg = renderDoc(doc({ backgroundImage: PNG }));
    const clip = svg.indexOf("clip-path=");
    expect(clip).toBeGreaterThan(-1);
    expect(svg.indexOf("<image")).toBeGreaterThan(clip);
  });

  it("sits under the artwork, not over it", () => {
    const svg = renderDoc(doc({ backgroundImage: PNG, elements: [text({ text: "Over" })] }));
    expect(svg.indexOf("<image")).toBeLessThan(svg.indexOf("Over"));
  });

  it("keeps the stock colour underneath, so dimming shows it through", () => {
    const svg = renderDoc(doc({ backgroundImage: PNG, background: "#a9855f", backgroundImageOpacity: 0.4 }));
    expect(svg.indexOf('fill="#a9855f"')).toBeLessThan(svg.indexOf("<image"));
    expect(svg).toContain('opacity="0.4"');
  });

  it("refuses anything that is not a self-contained image", () => {
    for (const bad of ["https://example.com/bg.jpg", "data:text/html;base64,AAAA", "javascript:alert(1)"]) {
      const svg = renderDoc(doc({ backgroundImage: bad }));
      expect(svg).not.toContain("<image");
      expect(svg).not.toContain(bad);
    }
  });

  it("never fades the picture away entirely", () => {
    expect(renderDoc(doc({ backgroundImage: PNG, backgroundImageOpacity: 0 }))).toContain('opacity="0.05"');
  });
});

describe("placed images", () => {
  const placed = (over: Record<string, unknown> = {}) => ({
    ...newText(12), kind: "image" as const, href: "data:image/png;base64,AAAA",
    width: 40, height: 20, tint: "none", warped: null, ...over,
  });

  it("draws the bent picture where the bake says it goes", () => {
    const warped = { href: "data:image/png;base64,BBBB", x: 10, y: 20, width: 50, height: 30 };
    const svg = renderDoc(doc({ elements: [placed({ warped }) as never] }));
    expect(svg).toContain('href="data:image/png;base64,BBBB"');
    expect(svg).toContain('x="10" y="20" width="50" height="30"');
    /* One ordinary image — nothing downstream has to honour a pile of clip paths. */
    expect(svg).not.toContain("<clipPath id=\"s-img");
    expect(svg.match(/<image/g)).toHaveLength(1);
  });

  it("places the original flat if nothing has baked it yet", () => {
    const svg = renderDoc(doc({ elements: [placed() as never] }));
    expect(svg).toContain('href="data:image/png;base64,AAAA"');
    expect(svg).toContain("<image");
  });

  it("refuses a baked picture that is not a self-contained image", () => {
    const warped = { href: "https://example.com/x.png", x: 0, y: 0, width: 10, height: 10 };
    const svg = renderDoc(doc({ elements: [placed({ warped }) as never] }));
    expect(svg).not.toContain("https://example.com");
  });

  it("still recolours, once, for the whole picture", () => {
    const svg = renderDoc(doc({ elements: [placed({ tint: "#e8735a" }) as never] }));
    expect(svg.match(/feColorMatrix/g)).toHaveLength(1);
  });
});

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

  it("renders one tspan per wrapped line", () => {
    const svg = renderDoc(doc({ elements: [text({ text: long, width: 60, fontSize: 8 })] }));
    const expected = wrapLines(text({ text: long, width: 60, fontSize: 8 }), estimateWidth).length;
    expect(svg.match(/<tspan/g)).toHaveLength(expected);
  });

  it("curves every wrapped line, not just the typed ones", () => {
    const el = text({ text: long, width: 60, fontSize: 8, curve: 40 });
    const svg = renderDoc(doc({ elements: [el] }));
    expect(svg.match(/<textPath/g)).toHaveLength(wrapLines(el, estimateWidth).length);
  });

  it("aligns against the edges of the box", () => {
    const left = renderDoc(doc({ elements: [text({ text: "hi", width: 100, align: "left" })] }));
    const right = renderDoc(doc({ elements: [text({ text: "hi", width: 100, align: "right" })] }));
    expect(left).toContain('text-anchor="start"');
    expect(right).toContain('text-anchor="end"');
    /* 100mm box, so the two anchors sit 100mm apart. */
    const x = (s: string) => Number(/<tspan x="([-\d.]+)"/.exec(s)![1]);
    expect(x(right) - x(left)).toBeCloseTo(100, 1);
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

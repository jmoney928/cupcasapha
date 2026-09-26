import { describe, expect, it } from "vitest";
import { SLEEVE_SIZES, sleeveDieline } from "./dielines";
import { layout } from "./geometry";
import { add, centreOf, duplicate, emptyDoc, newShape, newText, remove, reorder, resize, update } from "./doc";
import type { SleeveDoc, TextElement } from "./doc";
import { elementBounds, estimateWidth, renderDoc, sleeveFileName } from "./render-doc";

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

  it("takes the widest line", () => {
    const b = elementBounds(text({ text: "i\nwiiiiiiiiide" }), estimateWidth);
    expect(b.width).toBeCloseTo(estimateWidth("wiiiiiiiiide", text()), 6);
  });
});

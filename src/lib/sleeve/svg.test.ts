import { describe, expect, it } from "vitest";
import { SLEEVE_SIZES, sleeveDieline } from "./dielines";
import { layout } from "./geometry";
import { DEFAULT_DESIGN, renderSleeveSvg, sleeveFileName, type SleeveDesign } from "./svg";

const design = (over: Partial<SleeveDesign> = {}): SleeveDesign => ({ ...DEFAULT_DESIGN, ...over });

describe("renderSleeveSvg", () => {
  it.each(SLEEVE_SIZES)("%ioz declares its true size in millimetres", (size) => {
    const svg = renderSleeveSvg(design({ size }));
    const l = layout(sleeveDieline(size));
    expect(svg).toContain(`width="${Number(l.width.toFixed(3))}mm"`);
    expect(svg).toContain(`height="${Number(l.height.toFixed(3))}mm"`);
    /* viewBox in the same units, so one unit is one millimetre. */
    expect(svg).toContain(`viewBox="0 0 ${Number(l.width.toFixed(3))} ${Number(l.height.toFixed(3))}"`);
  });

  it.each(SLEEVE_SIZES)("%ioz emits no NaN", (size) => {
    expect(renderSleeveSvg(design({ size, tagline: "Since 2019", logo: null }))).not.toMatch(/NaN|Infinity|undefined/);
  });

  it("escapes text that would otherwise break the XML", () => {
    const svg = renderSleeveSvg(design({ businessName: 'Bean & "Co" <hq>' }));
    expect(svg).toContain("Bean &amp; &quot;Co&quot; &lt;hq&gt;");
    expect(svg).not.toContain('<hq>');
  });

  it("refuses a colour it cannot vouch for, rather than writing it into the file", () => {
    const svg = renderSleeveSvg(design({ background: 'red" onload="alert(1)', ink: "#fff" }));
    expect(svg).not.toContain("onload");
    expect(svg).toContain(DEFAULT_DESIGN.background);
    expect(svg).toContain('fill="#fff"');
  });

  it("draws guides only when asked", () => {
    expect(renderSleeveSvg(design(), { guides: true })).toContain("stroke-dasharray");
    expect(renderSleeveSvg(design(), { guides: false })).not.toContain("stroke-dasharray");
  });

  it("places a logo instead of the name when one is given", () => {
    const withLogo = renderSleeveSvg(design({ logo: "data:image/png;base64,AAAA", businessName: "Bean" }));
    expect(withLogo).toContain("<image");
    expect(withLogo).not.toContain(">Bean<");
  });

  it("keeps the tagline out of the file when it is blank", () => {
    expect(renderSleeveSvg(design({ tagline: "   " }))).not.toContain("tagline-path");
    expect(renderSleeveSvg(design({ tagline: "Good coffee" }))).toContain("tagline-path");
  });

  it("names the download after the café and the size", () => {
    expect(sleeveFileName(design({ size: 16, businessName: "Bean & Co" }))).toBe("cupcasa-sleeve-16oz-bean-co.svg");
    expect(sleeveFileName(design({ businessName: "  " }))).toBe("cupcasa-sleeve-12oz-artwork.svg");
  });
});

describe("logo handling", () => {
  it("drops anything that is not a self-contained image", () => {
    for (const bad of ["https://example.com/logo.png", "javascript:alert(1)", "data:text/html;base64,AAAA"]) {
      const svg = renderSleeveSvg(design({ logo: bad, businessName: "Bean" }));
      expect(svg).not.toContain("<image");
      expect(svg).not.toContain(bad);
      /* and it falls back to the name rather than rendering an empty sleeve */
      expect(svg).toContain("Bean");
    }
  });
});

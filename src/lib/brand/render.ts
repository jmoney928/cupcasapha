import "server-only";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import type { ReactElement } from "react";
import { brandFonts } from "./fonts";

/** JSX → SVG → PNG. No headless browser, per docs/SPEC.md. */
export async function renderPng(element: ReactElement, width: number, height: number): Promise<Buffer> {
  const fonts = await brandFonts();
  if (fonts.length === 0) throw new Error("Could not load the fonts needed to render artwork.");
  const svg = await satori(element, { width, height, fonts });
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: width } });
  return Buffer.from(resvg.render().asPng());
}

export async function renderSvg(element: ReactElement, width: number, height: number): Promise<string> {
  const fonts = await brandFonts();
  return satori(element, { width, height, fonts });
}

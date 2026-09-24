import { NextResponse } from "next/server";
import { analyzeLogo } from "@/lib/brand/analyze";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "application/pdf"];

/** Upload a logo, get back a palette, a print-readiness verdict and a mono version. */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const file = form.get("logo");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a logo file." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "That file is over 8MB. Try exporting it smaller." }, { status: 400 });
  if (file.type && !ACCEPTED.includes(file.type)) {
    return NextResponse.json({ error: "Use a PNG, JPG, SVG or PDF." }, { status: 400 });
  }

  try {
    const analysis = await analyzeLogo(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json(analysis);
  } catch (e) {
    console.error("logo analyze failed", (e as Error).message);
    return NextResponse.json({ error: "We couldn't read that file. Try a PNG or an SVG." }, { status: 422 });
  }
}

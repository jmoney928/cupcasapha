/**
 * Fitting an uploaded picture to what a sleeve can actually print.
 *
 * A photo off a phone is four thousand pixels wide and several megabytes. The widest sleeve we
 * make is 268 mm of print, which at 300 dpi is about 3,165 pixels — so most of that file is
 * detail no press will ever lay down, carried through the editor, embedded as base64 in the
 * artwork, and mailed to us at a third again its size.
 *
 * Everything here runs in the browser on the way in. Nothing is uploaded, which is the same
 * promise the editor has always made.
 */

/** The largest print dimension across the three dielines, in mm — 8oz has the widest band. */
const WIDEST_PRINT_MM = 268;
const MM_PER_INCH = 25.4;
/** Press resolution. Beyond this a sleeve gains nothing. */
export const PRINT_DPI = 300;

/** Longest edge worth keeping: the widest sleeve at press resolution. */
export const MAX_EDGE_PX = Math.ceil((WIDEST_PRINT_MM / MM_PER_INCH) * PRINT_DPI);

/**
 * What one picture may weigh once encoded. Comfortably under the 3MB the whole sleeve has to
 * fit inside, with room for a second picture and the artwork around them.
 */
export const TARGET_BYTES = 1_200_000;

/** What the editor will now accept, knowing it is about to shrink it. */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

/** The scaled size, never larger than the original — upscaling invents detail that is not there. */
export function targetSize(
  w: number,
  h: number,
  maxEdge: number = MAX_EDGE_PX
): { width: number; height: number; scaled: boolean } {
  const longest = Math.max(w, h);
  if (longest <= maxEdge || longest === 0) return { width: w, height: h, scaled: false };
  const k = maxEdge / longest;
  return { width: Math.max(1, Math.round(w * k)), height: Math.max(1, Math.round(h * k)), scaled: true };
}

/** Bytes a data URL actually costs on the wire, without materialising the decoded buffer. */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return dataUrl.length;
  const body = dataUrl.length - comma - 1;
  if (!dataUrl.slice(0, comma).includes("base64")) return body;
  const padding = dataUrl.endsWith("==") ? 2 : dataUrl.endsWith("=") ? 1 : 0;
  return Math.floor((body * 3) / 4) - padding;
}

export type FitResult = {
  dataUrl: string;
  /** Natural aspect ratio, so a caller need not measure the image a second time. */
  aspect: number;
  /** What happened, for a line of reassurance under the upload button. */
  note: string | null;
};

/* ------------------------------------------------------------------ browser only */

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode failed"));
    img.src = src;
  });

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });

/** True if any pixel is not fully opaque, which decides whether JPEG is safe to use. */
function hasTransparency(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  try {
    const { data } = ctx.getImageData(0, 0, w, h);
    for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
    return false;
  } catch {
    // If the pixels cannot be read, assume alpha and keep PNG — wrongly flattening a logo
    // onto black is far worse than a larger file.
    return true;
  }
}

const kb = (n: number) => `${Math.round(n / 1024).toLocaleString()} KB`;

/**
 * Reads a picked image and hands back a data URL sized for print.
 *
 * SVG is left exactly as it is: it is already vector, already small, and rasterising it would
 * throw away the one format that prints perfectly at any size.
 */
export async function fitForPrint(file: File): Promise<FitResult> {
  const original = await readAsDataUrl(file);

  if (file.type === "image/svg+xml") {
    let aspect = 1;
    try {
      const img = await loadImage(original);
      if (img.naturalWidth && img.naturalHeight) aspect = img.naturalWidth / img.naturalHeight;
    } catch {}
    return { dataUrl: original, aspect, note: null };
  }

  const img = await loadImage(original);
  const w = img.naturalWidth || 1;
  const h = img.naturalHeight || 1;
  const aspect = w / h;
  const fit = targetSize(w, h);
  const startBytes = dataUrlBytes(original);

  // Already modest and no bigger than the press can use: leave it alone rather than
  // re-encode it and lose a generation for nothing.
  if (!fit.scaled && startBytes <= TARGET_BYTES) {
    return { dataUrl: original, aspect, note: null };
  }

  const canvas = document.createElement("canvas");
  canvas.width = fit.width;
  canvas.height = fit.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { dataUrl: original, aspect, note: null };

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, fit.width, fit.height);

  const transparent = hasTransparency(ctx, fit.width, fit.height);

  let out: string;
  if (transparent) {
    out = canvas.toDataURL("image/png");
    // A big photo saved as PNG is enormous. If keeping alpha costs too much, step the
    // dimensions down rather than flatten it onto a colour that is not there.
    let guard = 0;
    let cur = canvas;
    while (dataUrlBytes(out) > TARGET_BYTES && guard < 4) {
      const next = document.createElement("canvas");
      next.width = Math.max(1, Math.round(cur.width * 0.75));
      next.height = Math.max(1, Math.round(cur.height * 0.75));
      const nctx = next.getContext("2d");
      if (!nctx) break;
      nctx.imageSmoothingEnabled = true;
      nctx.imageSmoothingQuality = "high";
      nctx.drawImage(cur, 0, 0, next.width, next.height);
      out = next.toDataURL("image/png");
      cur = next;
      guard += 1;
    }
  } else {
    let quality = 0.86;
    out = canvas.toDataURL("image/jpeg", quality);
    let guard = 0;
    while (dataUrlBytes(out) > TARGET_BYTES && guard < 4) {
      quality -= 0.12;
      out = canvas.toDataURL("image/jpeg", Math.max(0.4, quality));
      guard += 1;
    }
  }

  // If re-encoding somehow made it worse, keep whichever is smaller.
  if (dataUrlBytes(out) >= startBytes && !fit.scaled) {
    return { dataUrl: original, aspect, note: null };
  }

  const endBytes = dataUrlBytes(out);
  const note =
    endBytes < startBytes
      ? `Resized for print — ${kb(startBytes)} down to ${kb(endBytes)}${
          fit.scaled ? `, ${fit.width}×${fit.height}px at ${PRINT_DPI}dpi` : ""
        }.`
      : null;

  return { dataUrl: out, aspect, note };
}

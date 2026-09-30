/**
 * Carrying a sleeve from the standalone designer into the bundle builder.
 *
 * Somebody who has just spent ten minutes on /sleeve should not have to draw it again to order
 * it. The document is handed over in memory first: a client navigation from /sleeve to /shop keeps
 * the JS heap alive, so the whole thing — images, background photo and all — survives untouched.
 *
 * sessionStorage is only the backstop for a hard reload, and it is allowed to fail. A sleeve with
 * a photo behind it runs to megabytes and will blow the quota; when that happens the design is
 * still carried by the in-memory copy, and the button must not break either way.
 */
import { resize, type SleeveDoc } from "./doc";
import type { CupSize } from "./dielines";

const KEY = "cupcasa-sleeve-handoff";

let held: SleeveDoc | null = null;

/** Put a design aside for the builder to pick up. */
export function stashSleeve(doc: SleeveDoc): void {
  held = doc;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(doc));
  } catch {
    /* Over quota — the in-memory copy still carries it through a client navigation. */
  }
}

/** True if there is a design waiting, without consuming it. */
export function hasStashedSleeve(): boolean {
  if (held) return true;
  try {
    return sessionStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export function clearStashedSleeve(): void {
  held = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

/**
 * Take the waiting design, resized to the size the bundle settled on. Taking it clears it, so
 * going back to the design step later edits what is already there rather than starting over.
 */
export function takeSleeve(size: CupSize): SleeveDoc | null {
  const doc = held ?? readStored();
  clearStashedSleeve();
  if (!doc) return null;
  return resize(doc, size);
}

function readStored(): SleeveDoc | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return looksLikeDoc(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Storage is not a trusted source — a doc that is not a doc would crash the renderer. */
function looksLikeDoc(v: unknown): v is SleeveDoc {
  if (typeof v !== "object" || v === null) return false;
  const d = v as Partial<SleeveDoc>;
  return (
    (d.size === 8 || d.size === 12 || d.size === 16) &&
    typeof d.background === "string" &&
    Array.isArray(d.elements) &&
    d.elements.every((e) => typeof e === "object" && e !== null && typeof e.id === "string")
  );
}

import "server-only";
import QRCode from "qrcode";
import { bestSdsUrl, formatDate, reviewDueDate, sdsProduct } from "./sds";
import type { BinderItem } from "@/lib/pdf/worksafe-binder";

export type BinderSelection = { productId: string; location?: string };

/** Turns the café's picks into binder rows, generating a QR per linkable sheet. */
export async function buildBinderItems(selections: BinderSelection[]): Promise<BinderItem[]> {
  const items = await Promise.all(
    selections.map(async ({ productId, location }): Promise<BinderItem | null> => {
      const product = sdsProduct(productId);
      if (!product) return null;
      const url = bestSdsUrl(product);
      let qrDataUrl: string | null = null;
      if (url) {
        try {
          qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 220, errorCorrectionLevel: "M" });
        } catch {
          qrDataUrl = null; // a missing code must never stop the binder generating
        }
      }
      return { product, location: (location ?? "").trim() || product.typicalLocation, qrDataUrl, url };
    }),
  );
  return items.filter((i): i is BinderItem => i !== null);
}

export const binderDates = (now = new Date()) => ({
  generatedOn: formatDate(now),
  reviewDueOn: formatDate(reviewDueDate(now)),
});

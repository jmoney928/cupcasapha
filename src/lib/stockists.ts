/**
 * Cafés and shops pouring cupcasa cups. Static for launch; the portal database can feed this later
 * (cafés that opt in via Settings) without changing the page.
 *
 * lat/lng: look up once (e.g. from Google Maps "share" link or geocoder). sizes: which cups they use.
 */
export type Stockist = {
  id: string;
  name: string;
  type: "cafe" | "restaurant" | "grocery" | "other";
  address: string;
  city: string;
  province: string;     // 2-letter, e.g. "ON"
  postal: string;       // "M4K 1P3"
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  instagram?: string;   // handle without @
  hours?: string;       // short free text, e.g. "Mon–Fri 7–5, Sat 8–4"
  sizes: Array<8 | 12 | 16>;
  featured?: boolean;   // shows in the "featured cafés" row
  since?: string;       // "2026-11"
};

// ---- SAMPLE DATA — replace before launch ------------------------------------------------------
export const stockists: Stockist[] = [
  { id: "northside", name: "Northside Roasters", type: "cafe", address: "412 Danforth Ave", city: "Toronto", province: "ON", postal: "M4K 1P3", lat: 43.6776, lng: -79.3520, instagram: "northsideroasters", hours: "Mon–Fri 7–6, Sat–Sun 8–5", sizes: [8, 12, 16], featured: true, since: "2026-11" },
  { id: "kensington", name: "Kensington Grind", type: "cafe", address: "68 Kensington Ave", city: "Toronto", province: "ON", postal: "M5T 2K1", lat: 43.6543, lng: -79.4004, hours: "Daily 7–7", sizes: [12, 16], since: "2026-11" },
  { id: "leslieville", name: "Salt & Steam", type: "cafe", address: "1100 Queen St E", city: "Toronto", province: "ON", postal: "M4M 1K8", lat: 43.6620, lng: -79.3345, sizes: [8, 12], since: "2026-12" },
  { id: "bloom-van", name: "Bloom Café", type: "cafe", address: "2210 Main St", city: "Vancouver", province: "BC", postal: "V5T 3C8", lat: 49.2650, lng: -123.1008, instagram: "bloomcafevan", hours: "Daily 7–5", sizes: [12, 16], featured: true, since: "2026-11" },
  { id: "common-grounds", name: "Common Grounds", type: "cafe", address: "88 Bank St", city: "Ottawa", province: "ON", postal: "K1P 5N2", lat: 45.4201, lng: -75.6973, hours: "Mon–Sat 7–6", sizes: [8, 12, 16], featured: true, since: "2026-11" },
  { id: "mile-end", name: "Café Mile End", type: "cafe", address: "5288 Boul. Saint-Laurent", city: "Montréal", province: "QC", postal: "H2T 1S1", lat: 45.5232, lng: -73.5959, sizes: [12], since: "2026-12" },
];
// -----------------------------------------------------------------------------------------------

/** Great-circle distance in km. */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export const directionsUrl = (s: Stockist) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${s.name}, ${s.address}, ${s.city}, ${s.province} ${s.postal}`)}`;

export const typeLabel: Record<Stockist["type"], string> = { cafe: "Café", restaurant: "Restaurant", grocery: "Grocery", other: "Shop" };

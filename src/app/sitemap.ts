import type { MetadataRoute } from "next";

const BASE = "https://cupcasa.com";

/**
 * Every indexable page, by hand rather than by filesystem walk — the route group makes a walk
 * awkward, and a page added without a deliberate decision about its priority probably should
 * not be in the sitemap yet anyway. /launch is left out on purpose: it is an outreach landing
 * page that is sent, not found. /checkout and the APIs are disallowed in robots.ts.
 */
const PAGES: Array<{ path: string; priority: number }> = [
  { path: "/", priority: 1 },
  { path: "/shop", priority: 0.9 },
  { path: "/wholesale", priority: 0.9 },
  { path: "/sleeve", priority: 0.8 },
  { path: "/why-pha", priority: 0.7 },
  { path: "/sustainability", priority: 0.7 },
  { path: "/calculator", priority: 0.6 },
  { path: "/os", priority: 0.6 },
  { path: "/about", priority: 0.5 },
  { path: "/contact", priority: 0.5 },
  { path: "/howitworks", priority: 0.4 },
  { path: "/privacy", priority: 0.1 },
  { path: "/terms", priority: 0.1 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({
    url: `${BASE}${p.path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: p.priority,
  }));
}

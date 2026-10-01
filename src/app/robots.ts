import type { MetadataRoute } from "next";

/**
 * Until this file existed the site served a 404 for robots.txt — crawlers assume everything is
 * allowed, but with no sitemap they find pages only by following links, and anything unlinked
 * (or temporarily firewalled, as the whole site once was) falls out of the index quietly.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing behind these is a page: API routes, and the post-payment landing.
      disallow: ["/api/", "/checkout/"],
    },
    sitemap: "https://cupcasa.com/sitemap.xml",
  };
}

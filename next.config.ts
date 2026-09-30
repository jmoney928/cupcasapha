import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // QR codes point at /howitworks; catch hand-typed variants.
      { source: "/how-it-works", destination: "/howitworks", permanent: true },
      { source: "/howitworks/", destination: "/howitworks", permanent: true },
      { source: "/for-cafes", destination: "/launch", permanent: true },
      { source: "/cafes", destination: "/launch", permanent: true },
      // The three product pages became the bundle builder. Land each on the builder with its
      // own size already chosen, so an old link still means what it meant.
      { source: "/shop/8oz-pha-cup", destination: "/shop?size=8", permanent: true },
      { source: "/shop/12oz-pha-cup", destination: "/shop?size=12", permanent: true },
      { source: "/shop/16oz-pha-cup", destination: "/shop?size=16", permanent: true },
      // Cup Casa OS tools live in the portal, not on the public site.
      { source: "/compliance", destination: "/os", permanent: false },
      { source: "/brand", destination: "/os", permanent: false },
    ];
  },
};

export default nextConfig;

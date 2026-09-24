import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native modules Turbopack cannot bundle; they load at runtime on the Node runtime instead.
  serverExternalPackages: ["@resvg/resvg-js", "sharp", "satori"],
  async redirects() {
    return [
      // QR codes point at /howitworks; catch hand-typed variants.
      { source: "/how-it-works", destination: "/howitworks", permanent: true },
      { source: "/howitworks/", destination: "/howitworks", permanent: true },
      { source: "/for-cafes", destination: "/launch", permanent: true },
      { source: "/cafes", destination: "/launch", permanent: true },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // QR codes point at /howitworks; catch hand-typed variants.
      { source: "/how-it-works", destination: "/howitworks", permanent: true },
      { source: "/howitworks/", destination: "/howitworks", permanent: true },
      { source: "/cafes", destination: "/for-cafes", permanent: true },
      { source: "/launch", destination: "/for-cafes", permanent: true },
    ];
  },
};

export default nextConfig;

import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cupcasa.com"),
  title: {
    default: "cupcasa — Home-Compostable PHA Cups",
    template: "%s · cupcasa",
  },
  description:
    "Paper cups with a PHA lining certified home compostable by DIN CERTCO (9R0050). No PE, no PLA, no microplastics. Made for every drink, made to disappear.",
  keywords: [
    "compostable coffee cups",
    "PHA cups",
    "compostable cups",
    "custom coffee cups",
    "home compostable cups",
    "eco cups",
  ],
  openGraph: {
    title: "cupcasa — Made for every drink. Made to disappear.",
    description:
      "PHA-lined paper cups — lining certified home compostable (DIN CERTCO 9R0050). No PE, no PLA, no microplastics.",
    type: "website",
    url: "https://cupcasa.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}

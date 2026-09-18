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
    "Fully compostable PHA cups for hot and cold drinks — plant-based, plastic-free, and certified to break down at home and in the ocean. Made for every drink, made to disappear.",
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
      "Fully compostable PHA cups. Plant-based, plastic-free, certified to return to nature.",
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

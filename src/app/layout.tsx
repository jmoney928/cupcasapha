import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartProvider } from "@/components/cart-context";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cups.cupcasa.com"),
  title: {
    default: "cupcasa — Fully PHA Compostable Cups, Unbranded",
    template: "%s · cupcasa cups",
  },
  description:
    "Marine-degradable, home & industrial compostable PHA cups. Blank, unbranded, and built to make your café look as good as it does good. Buy online or order wholesale by the case.",
  keywords: [
    "PHA cups",
    "compostable cups",
    "marine degradable",
    "unbranded cups",
    "wholesale compostable cups",
    "plastic-free cups",
  ],
  openGraph: {
    title: "cupcasa — Fully PHA Compostable Cups",
    description:
      "Marine-degradable, compostable PHA cups. Blank & unbranded. Buy online or wholesale.",
    type: "website",
    url: "https://cups.cupcasa.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>
        <CartProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}

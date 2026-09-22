import type { Metadata } from "next";
import { Source_Serif_4, Lato } from "next/font/google";

const serif = Source_Serif_4({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-serif", display: "swap" });
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-lato", display: "swap" });

export const metadata: Metadata = {
  title: "For Cafés",
  description:
    "The first certified home-compostable, microplastic-free coffee cup in Canada. 98% of Victoria coffee drinkers surveyed said they'd pay more for it. Become a launch café.",
  alternates: { canonical: "https://cupcasa.com/for-cafes" },
  openGraph: {
    title: "98% of coffee drinkers said they'd pay more for this cup. | Cup Casa",
    description: "Certified home-compostable, microplastic-free cups. Become a Victoria launch café.",
    url: "https://cupcasa.com/for-cafes",
  },
};

/** Standalone sales page: its own fonts and styling, no shop header or cart. */
export default function ForCafesLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${serif.variable} ${lato.variable}`}>{children}</div>;
}

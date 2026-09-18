import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/brand";

export const metadata: Metadata = {
  title: "How this cup works",
  description:
    "You just scanned a cupcasa cup. It's made from PHA — plant-based, plastic-free, and certified to compost at home. Here's what to do with it when you're done.",
  alternates: { canonical: "https://cupcasa.com/howitworks" },
  openGraph: {
    title: "This cup is made to disappear",
    description: "Plant-based PHA, no plastic lining, certified home compostable. Here's what to do with it.",
    url: "https://cupcasa.com/howitworks",
  },
};

/** Light chrome for QR-code visitors: no deposit banner, no cart, just the brand and a slim footer. */
export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="section-pad py-4 flex items-center justify-between">
        <Link href="/" aria-label="cupcasa home"><Logo className="h-6 w-auto" priority /></Link>
        <Link href="/shop" className="text-xs font-bold text-espresso/60 hover:text-espresso">Run a café? →</Link>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="section-pad py-8 border-t border-espresso/10 text-xs text-espresso/50">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/" className="hover:text-espresso">cupcasa.com</Link>
          <Link href="/sustainability" className="hover:text-espresso">Certifications</Link>
          <Link href="/why-pha" className="hover:text-espresso">Why PHA</Link>
          <Link href="/wholesale" className="hover:text-espresso">Wholesale</Link>
          <Link href="/privacy" className="hover:text-espresso">Privacy</Link>
        </div>
        <p className="mt-3">© {new Date().getFullYear()} cupcasa · Made in Canada</p>
      </footer>
    </div>
  );
}

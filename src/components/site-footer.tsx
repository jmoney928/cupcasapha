import Link from "next/link";
import { Mail } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";
import { Logo, Mark, Particles } from "@/components/brand";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const cols = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "Order cups" },
      { href: "/shop/8oz-pha-cup", label: "8oz" },
      { href: "/shop/12oz-pha-cup", label: "12oz" },
      { href: "/shop/16oz-pha-cup", label: "16oz" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/why-pha", label: "The material" },
      { href: "/sustainability", label: "Sustainability" },
      { href: "/about", label: "About cupcasa" },
    ],
  },
  {
    title: "Business",
    links: [
      { href: "/wholesale", label: "Custom & wholesale" },
      { href: "/wholesale#samples", label: "Request samples" },
      { href: "/contact", label: "Contact us" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-espresso text-cream/75 mt-24">
      <div className="section-pad py-16">
        {/* newsletter */}
        <div className="pb-12 mb-12 border-b border-cream/10 grid lg:grid-cols-2 gap-6 lg:items-center">
          <div>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-cream tracking-tight">
              A better circle for every cup.
            </h3>
            <p className="text-cream/60 mt-2 max-w-md">
              Drops, design tips and the occasional offer. No spam — just the good stuff.
            </p>
          </div>
          <NewsletterForm />
        </div>

        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo variant="white" className="h-7 w-auto mb-5" />
            <p className="max-w-xs text-cream/60 leading-relaxed">
              Custom-printed, fully compostable PHA cups. Printed to be seen —
              made to disappear.
            </p>
            <div className="flex gap-3 mt-6">
              <a href="https://instagram.com/cup_casa" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-coral transition-colors"
                aria-label="cupcasa on Instagram">
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a href="mailto:hello@cupcasa.com"
                className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-coral transition-colors"
                aria-label="Email cupcasa">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-bold text-cream mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="hover:text-coral transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-cream/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-cream/50">
          <div className="flex items-center gap-3">
            <Mark variant="white" className="h-6 w-auto" />
            <span>© {new Date().getFullYear()} Cup Casa Inc.</span>
            <Particles className="w-8 h-4 text-coral/70 hidden sm:block" />
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-cream">Privacy</Link>
            <Link href="/terms" className="hover:text-cream">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

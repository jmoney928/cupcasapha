import Link from "next/link";
import Image from "next/image";
import { Leaf, Mail } from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
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
      { href: "/shop", label: "All cups" },
      { href: "/shop/8oz-pha-cup", label: "8oz cup" },
      { href: "/shop/12oz-pha-cup", label: "12oz cup" },
      { href: "/shop/16oz-pha-cup", label: "16oz double wall" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/why-pha", label: "Why PHA" },
      { href: "/sustainability", label: "Sustainability" },
      { href: "/about", label: "About cupcasa" },
    ],
  },
  {
    title: "Business",
    links: [
      { href: "/wholesale", label: "Wholesale & bulk" },
      { href: "/wholesale#samples", label: "Request samples" },
      { href: "/contact", label: "Contact us" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-espresso text-cream/80 mt-24">
      <div className="section-pad py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/brand/cupcasa-wordmark.png"
              alt="cupcasa"
              width={180}
              height={68}
              className="h-12 w-auto mb-5 brightness-0 invert"
            />
            <p className="max-w-xs text-cream/70 leading-relaxed">
              Fully PHA, fully blank, fully compostable cups. Made from plants —
              made to disappear (the good way).
            </p>
            <div className="flex gap-3 mt-6">
              <a
                href="https://instagram.com/cup_casa"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-leaf transition-colors"
                aria-label="cupcasa on Instagram"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a
                href="mailto:cupcasaadmin@gmail.com"
                className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-leaf transition-colors"
                aria-label="Email cupcasa"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="font-display font-bold text-cream mb-4">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="hover:text-leaf-bright transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-cream/15 flex flex-col sm:flex-row justify-between gap-4 text-sm text-cream/60">
          <p className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-leaf-bright" />© {new Date().getFullYear()} cupcasa.
            A subsite of cupcasa.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-cream">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-cream">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

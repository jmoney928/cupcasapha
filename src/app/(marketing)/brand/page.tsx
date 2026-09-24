import type { Metadata } from "next";
import { Palette, Printer, Share2, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui";
import { BrandKit } from "@/components/brand/brand-kit";

export const metadata: Metadata = {
  title: "Free brand kit for cafés",
  description:
    "Upload your logo and get print-ready signage, window decals, till cards and Instagram posts announcing your switch to home-compostable cups. Free from Cup Casa.",
  alternates: { canonical: "https://cupcasa.com/brand" },
  openGraph: {
    title: "Your logo, on everything — free",
    description: "Signage, decals, till cards and social posts, generated from your logo in about a minute.",
    url: "https://cupcasa.com/brand",
  },
};

const outputs = [
  { icon: Share2, title: "Instagram set", text: "A \"we've switched\" post, a certification post and a story, sized and ready to publish." },
  { icon: Printer, title: "Print-ready signage", text: "A-frame poster, window decal and a tent-fold till card — at trim, with bleed and crop marks." },
  { icon: Palette, title: "Your colours, pulled from your logo", text: "We extract a palette and offer it. You pick; nothing is imposed." },
  { icon: Sparkles, title: "A single-colour version", text: "Generated automatically, because it's what the cheapest printing needs and most cafés don't have one." },
];

export default function BrandPage() {
  return (
    <>
      <section className="section-pad pt-12 pb-8">
        <div className="max-w-3xl">
          <span className="label-caps text-coral">Free for cafés</span>
          <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl mt-4 leading-[1]">
            Your logo. <span className="text-coral">On everything.</span>
          </h1>
          <p className="text-lg text-espresso/70 mt-5">
            Upload your logo, pick a colour and a template, and get the whole set: signage for the shop, a window
            decal, a till card and the social posts announcing your switch. About a minute, no design skills, no
            account, no charge.
          </p>
        </div>
      </section>

      <section className="section-pad pb-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {outputs.map((o, i) => (
            <Reveal key={o.title} delay={i * 70}>
              <div className="h-full rounded-3xl border border-espresso/10 bg-white/70 p-5">
                <o.icon className="h-6 w-6 text-coral" strokeWidth={1.6} />
                <h2 className="font-display text-lg font-extrabold mt-3">{o.title}</h2>
                <p className="text-sm text-espresso/65 mt-1">{o.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-pad pb-14">
        <BrandKit />
      </section>
    </>
  );
}

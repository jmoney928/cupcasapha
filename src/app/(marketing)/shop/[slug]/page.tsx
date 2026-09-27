import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Leaf,
  Check,
  Sprout,
  Ban,
  Leaf as LeafIcon,
  PackageCheck,
} from "lucide-react";
import { products, getProduct } from "@/lib/products";
import { PackPicker } from "@/components/pack-picker";
import { Button, Eyebrow } from "@/components/ui";
import { CertBadge } from "@/components/cert-badge";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Not found" };
  return {
    title: product.name,
    description: product.description,
  };
}

const bg: Record<string, string> = {
  coral: "bg-coral-soft/40",
  caramel: "bg-caramel-light/40",
  leaf: "bg-leaf-bright/30",
};

const lifecycle = [
  { icon: Sprout, label: "Home compostable" },
  { icon: LeafIcon, label: "PHA lining" },
  { icon: Ban, label: "No PE · no PLA" },
];

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const others = products.filter((p) => p.slug !== slug);

  return (
    <>
      <section className="section-pad pt-8 pb-16">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-espresso/60 hover:text-espresso font-semibold mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to shop
        </Link>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* visual */}
          <div className="relative rounded-[2.5rem] overflow-hidden min-h-[380px] lg:min-h-[460px]">
            <span className="absolute top-6 left-6 z-10 bg-espresso text-cream text-sm font-bold px-4 py-1.5 rounded-full">
              Home compostable
            </span>
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          {/* details */}
          <div>
            <Eyebrow color="leaf">
              <Leaf className="w-4 h-4" /> {product.shortName}
            </Eyebrow>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mt-4">
              {product.name}
            </h1>
            <p className="text-lg text-espresso/70 mt-4">{product.description}</p>

            <div className="flex flex-wrap gap-2 mt-5">
              {lifecycle.map((l) => (
                <span
                  key={l.label}
                  className="inline-flex items-center gap-2 bg-leaf/15 text-[#3f7d28] rounded-full px-4 py-1.5 text-sm font-bold"
                >
                  <l.icon className="w-4 h-4" /> {l.label}
                </span>
              ))}
            </div>

            <div className="mt-4"><CertBadge size="sm" /></div>

            <div className="my-7 h-px bg-caramel/20" />

            <PackPicker oz={product.oz as 8 | 12 | 16} />

            <div className="flex items-center gap-2 text-sm text-espresso/60 mt-4">
              <PackageCheck className="w-4 h-4 text-leaf" />
              Every set is a cup, a custom-printed sleeve and a lid ·{" "}
              <Link href="/sleeve" className="underline font-semibold">
                Design your sleeve
              </Link>
            </div>

            <div className="mt-6">
              <h3 className="font-display font-bold mb-2">Best for</h3>
              <ul className="flex flex-wrap gap-2">
                {product.bestFor.map((b) => (
                  <li
                    key={b}
                    className="flex items-center gap-1.5 text-sm bg-white/60 border border-caramel/20 rounded-full px-3 py-1.5"
                  >
                    <Check className="w-4 h-4 text-leaf" /> {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* what a set actually is — the three pieces, photographed */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold">What&apos;s in a set</h2>
          <p className="text-espresso/65 mt-2 max-w-xl">
            Every pack is these three, in equal numbers. Buy one pack and you have everything you
            need to serve a drink.
          </p>
          <div className="grid sm:grid-cols-3 gap-5 mt-6">
            {[
              {
                src: product.image,
                alt: `${product.name}, blank`,
                title: `The ${product.size} cup`,
                text: "Paper with a PHA lining. Single wall, blank, certified home compostable.",
                fit: "object-cover",
              },
              {
                src: "/products/sleeve-printed.jpg",
                alt: "A kraft corrugated cup sleeve printed with the cupcasa wordmark",
                title: "A custom sleeve",
                /* Our own mark is on the sample, so say so rather than let it read as theirs. */
                text: "Corrugated kraft, printed here on our own press — ours shown, yours on the pack. No minimum, no setup fee.",
                fit: "object-cover",
              },
              {
                src: "/products/lid.png",
                alt: "A white moulded bagasse sip lid",
                title: "A bagasse lid",
                text: "Moulded sugarcane fibre, not plastic. One lid fits all three cup sizes.",
                fit: "object-contain",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl bg-white/60 border border-caramel/20 overflow-hidden">
                <div className="relative aspect-[4/3] bg-white">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className={item.fit}
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold">{item.title}</h3>
                  <p className="text-sm text-espresso/70 mt-1">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* specs */}
        <div className="mt-14 grid md:grid-cols-2 gap-x-12 gap-y-3 max-w-3xl">
          <h2 className="font-display text-2xl font-bold md:col-span-2 mb-2">
            Specifications
          </h2>
          {product.specs.map((s) => (
            <div
              key={s.label}
              className="flex justify-between gap-4 py-3 border-b border-caramel/20"
            >
              <span className="text-espresso/60 font-semibold">{s.label}</span>
              <span className="font-semibold text-right">{s.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* other products */}
      <section className="section-pad py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl font-bold">More sizes</h2>
          <Button href="/shop" variant="dark" size="sm">
            Shop all
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {others.map((p) => (
            <Link
              key={p.slug}
              href={`/shop/${p.slug}`}
              className={`flex items-center gap-6 rounded-3xl ${bg[p.accent]} p-4 hover:shadow-lg transition-shadow`}
            >
              <div className="relative w-28 h-24 shrink-0 rounded-2xl overflow-hidden">
                <Image src={p.image} alt={p.name} fill sizes="120px" className="object-cover" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">{p.name}</h3>
                <p className="text-espresso/70 text-sm">{p.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

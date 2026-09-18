import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Leaf,
  Check,
  Waves,
  Sprout,
  Factory,
  PackageCheck,
} from "lucide-react";
import { products, getProduct } from "@/lib/products";
import { AddToCart } from "@/components/add-to-cart";
import { Button, Eyebrow } from "@/components/ui";

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
  { icon: Sprout, label: "Home compost" },
  { icon: Factory, label: "Industrial" },
  { icon: Waves, label: "Marine" },
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
            {product.doubleWall && (
              <span className="absolute top-6 left-6 z-10 bg-espresso text-cream text-sm font-bold px-4 py-1.5 rounded-full">
                Double wall
              </span>
            )}
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

            <div className="my-7 h-px bg-caramel/20" />

            <AddToCart product={product} />

            <div className="flex items-center gap-2 text-sm text-espresso/60 mt-4">
              <PackageCheck className="w-4 h-4 text-leaf" />
              Sold by the case of {product.caseCount.toLocaleString()} ·{" "}
              <Link href="/wholesale" className="underline font-semibold">
                Need a pallet? Get wholesale pricing
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

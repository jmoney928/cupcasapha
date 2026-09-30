import type { Metadata } from "next";
import { Mail, MessageCircle, Building2 } from "lucide-react";
import { Eyebrow } from "@/components/ui";
import { LeadForm } from "@/components/lead-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about PHA cups, orders or wholesale? Get in touch with the cupcasa team.",
};

const faqs = [
  {
    q: "How are the cups sold?",
    a: "In packs of 100, 200 or 500 — each one a cup, a custom-printed sleeve and a lid. Cafés buy by the case of 1,000, as a set or by the part; see the café page.",
  },
  {
    q: "Are the cups really blank?",
    a: "The cup itself ships blank. Your branding goes on the sleeve, printed here with no minimum — or on the cup itself at 100,000 cups and up.",
  },
  {
    q: "Can I try them before I order?",
    a: "Yes. Cafés that have not ordered from us before get 100 cups, 100 lids and 100 custom-printed sleeves free — a hundred complete servings. Ask on the café page.",
  },
  {
    q: "Where do you ship?",
    a: "Across the US and Canada. For other regions, get in touch and we'll see what we can do.",
  },
];

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ bundle?: string }>;
}) {
  /*
   * A partial bundle cannot be bought online, so the builder sends it here with what was built
   * in the link. Reading it back means nobody has to retype a bundle they just put together.
   */
  const { bundle } = await searchParams;
  const built = typeof bundle === "string" ? bundle.slice(0, 200).trim() : "";
  const defaults = built
    ? { message: `I'd like a price for: ${built}.\n\n` }
    : undefined;

  return (
    <>
      <section className="section-pad pt-12 pb-10 relative overflow-hidden">
        <div className="absolute -top-10 left-1/3 w-96 h-96 rounded-full bg-leaf-bright/15 blur-3xl" />
        <div className="relative max-w-2xl">
          <Eyebrow color="coral">
            <MessageCircle className="w-4 h-4" /> Say hello
          </Eyebrow>
          <h1 className="font-display text-5xl sm:text-6xl font-bold mt-5">
            Let&apos;s talk cups.
          </h1>
          <p className="text-lg text-espresso/70 mt-4">
            Whether it&apos;s a product question or a pallet-sized order, we&apos;re happy to help.
          </p>
        </div>
      </section>

      <section className="section-pad pb-16 grid lg:grid-cols-[1fr_1.3fr] gap-10 items-start">
        <div className="space-y-4">
          <a
            href="mailto:hello@cupcasa.com"
            className="flex items-center gap-4 rounded-3xl bg-white/70 border border-caramel/20 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 rounded-2xl bg-coral/15 flex items-center justify-center">
              <Mail className="w-6 h-6 text-coral" />
            </div>
            <div>
              <p className="font-display font-bold">Email us</p>
              <p className="text-espresso/70 text-sm">hello@cupcasa.com</p>
            </div>
          </a>
          <a
            href="/wholesale"
            className="flex items-center gap-4 rounded-3xl bg-white/70 border border-caramel/20 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 rounded-2xl bg-leaf/15 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-leaf" />
            </div>
            <div>
              <p className="font-display font-bold">Wholesale & bulk</p>
              <p className="text-espresso/70 text-sm">Get a quote + free samples</p>
            </div>
          </a>

          <div className="rounded-3xl bg-espresso text-cream p-6">
            <h3 className="font-display font-bold text-lg mb-4">Quick answers</h3>
            <div className="space-y-4">
              {faqs.map((f) => (
                <div key={f.q}>
                  <p className="font-semibold text-leaf-bright">{f.q}</p>
                  <p className="text-cream/70 text-sm mt-1">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <LeadForm
          type="contact"
          submitLabel="Send message"
          defaults={defaults}
          fields={[
            { name: "name", label: "Your name", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            { name: "company", label: "Business (optional)" },
            { name: "message", label: "How can we help?", type: "textarea", required: true },
          ]}
        />
      </section>
    </>
  );
}

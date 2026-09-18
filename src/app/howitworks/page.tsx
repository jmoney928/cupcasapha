import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sprout, Recycle, Leaf, Coffee, CupSoda, XCircle, CheckCircle2, Trash2 } from "lucide-react";
import { Button, Reveal } from "@/components/ui";
import { Particles, Speckle } from "@/components/brand";
import { NewsletterForm } from "@/components/newsletter-form";
import { CertBadge } from "@/components/cert-badge";
import { CERT, certVerifyUrl } from "@/lib/certs";

const dispose = [
  {
    icon: Sprout,
    title: "Home compost",
    tag: "Best",
    text: "Toss it in — lid, cup and all. It's certified to break down in a backyard compost, no industrial facility needed.",
  },
  {
    icon: Recycle,
    title: "Green bin / organics",
    tag: "Good",
    text: "Most municipal organics programs accept certified home-compostable cups. If your city's list says no, use the next option.",
  },
  {
    icon: Trash2,
    title: "Garbage, if you must",
    tag: "Last resort",
    text: "It still won't outlive you like a plastic-lined cup. But compost is where it's designed to go.",
  },
];

const lifecycle = [
  { icon: Leaf, label: "Grown", text: "Microbes turn plant oils into PHA" },
  { icon: CupSoda, label: "Made", text: "Formed into a double-wall cup" },
  { icon: Coffee, label: "Used", text: "Hot or cold, no sleeve needed" },
  { icon: "particles" as const, label: "Returns", text: "Microbes eat it back into soil" },
];

const compare = [
  { name: "Regular paper cup", lining: "Polyethylene (PE) plastic lining", home: false, industrial: false, clean: false, note: "Ends up in landfill — the plastic film makes it hard to recycle or compost." },
  { name: "“Compostable” PLA cup", lining: "Corn-plastic (PLA) lining", home: false, industrial: true, clean: false, note: "Only breaks down in hot industrial composters, which most places don’t have." },
  { name: "This cup (PHA)", lining: "Paper with a PHA lining — no PE, no PLA", home: true, industrial: true, clean: true, note: "Lining certified home compostable by DIN CERTCO. Microbes eat the lining; nothing plastic is left.", highlight: true },
];

const faqs = [
  { q: "What is PHA?", a: "Polyhydroxyalkanoate. It's a material that microbes naturally make and store as energy, produced today by fermenting plant oils. Because it's something nature already makes, nature already knows how to take it apart." },
  { q: "Is it safe to drink from?", a: "Yes. It’s food-safe. The lining is PHA, not polyethylene or PLA, so there’s no conventional plastic in contact with your drink." },
  { q: "Can I put it in the recycling instead?", a: "Please don't. Cups of any kind contaminate paper recycling. Compost or green bin is the right home for this one." },
  { q: "How long does it take to break down?", a: "Certified home-compost conditions: months, not centuries. Exact time depends on heat, moisture and how active your compost is." },
  { q: "Why do you say “certified”?", a: "DIN CERTCO, an independent certifier in the TÜV Rheinland group, tested the PHA lining material and issued certificate 9R0050 for home and garden compostability (plus 9K0239 for industrial composting). The numbers are public, so you can check them on the register rather than take our word for it." },
  { q: "Can I get these for my café?", a: "Yes. Cups are sold by the case of 1,000, and wholesale pricing is available for volume." },
];

export default function HowItWorksPage() {
  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="section-pad pt-6 pb-12 sm:pt-12">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="label-caps text-coral">Scanned from the bottom of your cup? 👋</span>
            <h1 className="font-display text-5xl sm:text-6xl xl:text-7xl mt-4">
              You’re holding a cup
              <br />
              <span className="text-coral">made to disappear.</span>
            </h1>
            <p className="text-lg text-espresso/70 mt-5 max-w-md">
              No PE. No PLA. No microplastics. It’s a paper cup lined with PHA, a material
              microbes make from plants, and the lining is certified to compost right in a
              backyard bin.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Button href="#done" variant="primary" size="lg">
                What do I do with it? <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
            <div className="mt-6"><CertBadge /></div>
            <p className="flex items-center gap-2 text-sm text-espresso/50 mt-4">
              <Particles className="w-6 h-4 text-coral" />
              Made for every drink. Made to disappear.
            </p>
          </div>
          <Reveal>
            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3] lg:aspect-square shadow-[0_30px_60px_rgba(26,26,26,0.15)]">
              <Image
                src="/rebrand/hand-cup.png"
                alt="A hand holding a cupcasa PHA cup"
                fill
                priority
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- WHEN YOU'RE DONE ---------------- */}
      <section id="done" className="section-pad py-6 scroll-mt-6">
        <div className="rounded-[2.5rem] bg-espresso text-cream p-7 sm:p-12">
          <span className="label-caps text-coral">When you’re done</span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold mt-3 text-cream">
            Compost it. Seriously.
          </h2>
          <p className="text-cream/60 mt-3 max-w-xl">
            Here’s where this cup should go, best option first. Lid included.
          </p>
          <ol className="grid sm:grid-cols-3 gap-4 mt-8">
            {dispose.map((d, i) => (
              <li key={d.title} className="rounded-3xl bg-cream/5 border border-cream/10 p-5">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-coral/20 flex items-center justify-center">
                    <d.icon className="w-6 h-6 text-coral" strokeWidth={1.6} />
                  </div>
                  <span className={`label-caps ${i === 0 ? "text-leaf-bright" : i === 1 ? "text-sky" : "text-cream/40"}`}>{d.tag}</span>
                </div>
                <h3 className="font-display text-xl font-extrabold mt-4">{i + 1}. {d.title}</h3>
                <p className="text-cream/65 text-sm mt-2 leading-relaxed">{d.text}</p>
              </li>
            ))}
          </ol>
          <p className="flex items-start gap-2 text-sm text-cream/60 mt-6">
            <XCircle className="w-5 h-5 text-coral shrink-0" />
            <span><b className="text-cream">Not the blue bin.</b> Cups contaminate paper recycling, this one included.</span>
          </p>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="section-pad py-16">
        <Reveal>
          <span className="label-caps text-coral">How it works</span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold mt-3">
            Nature made it. Nature takes it back.
          </h2>
          <p className="text-espresso/65 mt-3 max-w-xl">
            PHA is what certain microbes make to store energy, the way we store fat.
            We grow it from plant oils, shape it into a cup, and when you’re done
            the same kind of microbes eat it again.
          </p>
        </Reveal>
        <ol className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
          {lifecycle.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <li className="rounded-3xl bg-white/70 border border-caramel/20 p-5 h-full">
                <div className="w-12 h-12 rounded-full border-2 border-espresso/12 flex items-center justify-center text-espresso">
                  {s.icon === "particles" ? <Particles className="w-8 h-5 text-coral" /> : <s.icon className="w-6 h-6" strokeWidth={1.6} />}
                </div>
                <div className="label-caps text-espresso/60 mt-4">{i + 1} · {s.label}</div>
                <p className="text-sm text-espresso/75 mt-1">{s.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ---------------- COMPARISON ---------------- */}
      <section className="section-pad py-6">
        <Reveal>
          <span className="label-caps text-coral">Not all “green” cups are equal</span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold mt-3">
            Why this one’s different.
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {compare.map((c) => (
            <div
              key={c.name}
              className={`rounded-3xl p-6 border ${c.highlight ? "bg-leaf text-cream border-leaf" : "bg-white/70 border-caramel/20"}`}
            >
              <h3 className="font-display text-xl font-extrabold">{c.name}</h3>
              <p className={`text-sm mt-1 ${c.highlight ? "text-cream/70" : "text-espresso/60"}`}>{c.lining}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {[["Home compost", c.home], ["Industrial compost", c.industrial], ["No microplastics left behind", c.clean]].map(([label, ok]) => (
                  <li key={String(label)} className="flex items-center gap-2">
                    {ok ? <CheckCircle2 className={`w-5 h-5 ${c.highlight ? "text-cream" : "text-leaf"}`} /> : <XCircle className="w-5 h-5 text-coral/70" />}
                    <span className={ok ? "" : c.highlight ? "text-cream/60" : "text-espresso/50 line-through"}>{label}</span>
                  </li>
                ))}
              </ul>
              <p className={`text-sm mt-4 ${c.highlight ? "text-cream/80" : "text-espresso/65"}`}>{c.note}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-espresso/50 mt-4 max-w-2xl">
          PHA lining certified home compostable by DIN CERTCO (TÜV Rheinland group), certificate{" "}
          <a href={certVerifyUrl} target="_blank" rel="noopener noreferrer" className="underline">{CERT.number}</a>. Verify it on the public register.
        </p>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="section-pad py-16">
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold">Questions people ask</h2>
        <div className="mt-6 divide-y divide-espresso/10 border-y border-espresso/10">
          {faqs.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-lg font-bold list-none">
                {f.q}
                <span className="text-coral transition-transform group-open:rotate-45 text-2xl leading-none" aria-hidden>+</span>
              </summary>
              <p className="text-espresso/70 mt-3 max-w-2xl leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------------- CAFÉ CTA ---------------- */}
      <section className="section-pad py-6">
        <div className="relative rounded-[2.5rem] bg-coral text-white overflow-hidden p-7 sm:p-12">
          <Speckle className="absolute bottom-0 right-0 w-1/2 h-2/3 text-white/25" />
          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold leading-[0.98]">
                Like the cup?
                <br />
                Tell your café.
              </h2>
              <p className="text-white/85 text-lg mt-4 max-w-md">
                Every café that switches keeps thousands of plastic-lined cups out of
                landfill a year. If you run one, we’ll send free samples.
              </p>
              <div className="flex flex-wrap gap-3 mt-7">
                <Button href="/shop" variant="cream" size="lg">
                  Get these cups <ArrowRight className="w-5 h-5" />
                </Button>
                <Button href="/wholesale" variant="dark" size="lg">
                  Free samples
                </Button>
              </div>
            </div>
            <div className="rounded-3xl bg-white/15 backdrop-blur p-6">
              <h3 className="font-display text-xl font-extrabold">Follow the cup</h3>
              <p className="text-white/80 text-sm mt-1 mb-4">Occasional updates on where cupcasa cups turn up next. No spam.</p>
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>

      <p className="section-pad pt-4 pb-10 text-center text-xs text-espresso/40">
        Thanks for scanning. Now go enjoy your drink. <Link href="/sustainability" className="underline">Read the certification →</Link>
      </p>
    </>
  );
}

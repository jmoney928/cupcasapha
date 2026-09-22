import Link from "next/link";
import { Logo } from "@/components/brand";
import s from "./for-cafes.module.css";

const EMAIL = "hello@cupcasa.com";
const PHONE_1 = { display: "250 986 9693", tel: "+12509869693" };
const PHONE_2 = { display: "778 676 4188", tel: "+17786764188" };
const IG = "https://instagram.com/cup_casa";
const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent("Launch café")}`;

export default function ForCafesPage() {
  return (
    <div className={s.page}>
      <div className={s.wrap}>
        <div className={s.topbar}>
          <Link href="/" aria-label="cupcasa home"><Logo className="h-6 w-auto" priority /></Link>
          <a href="#contact">Talk to Jack or Sulli →</a>
        </div>
      </div>

      {/* HERO */}
      <section className={s.hero}>
        <div className={s.wrap}>
          <div className={s.eyebrow}>For cafés · Made to disappear</div>
          <h1>98% of coffee drinkers said they’d pay more for this cup.<span className={s.accent}>Most cafés can’t offer it yet.</span></h1>
          <p className={s.lede}>Cup Casa is a Victoria company bringing the first certified home-compostable, microplastic-free coffee cup to Canada. We hold the exclusive Canadian rights, our first container lands in November, and we’re choosing a small group of launch cafés to serve it first.</p>
          <div className={s.ctas}>
            <a className={`${s.btn} ${s.btnCoral}`} href="#contact">Become a launch café</a>
            <a className={`${s.btn} ${s.btnGhost}`} href="#pricing">See pricing</a>
          </div>
          <div className={s.stats}>
            <div className={s.stat}><b>98%</b><span>of the 167 Victoria coffee drinkers we surveyed said they’d pay 15¢ more per coffee for this cup.</span></div>
            <div className={s.stat}><b>1st</b><span>and only cup in Canada with these certifications. Launch cafés get it before anyone else.</span></div>
            <div className={s.stat}><b>20–24¢</b><span>per cup, about what most cafés are already paying for PLA.</span></div>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section>
        <div className={s.wrap}>
          <div className={s.eyebrow}>What your café gets out of this</div>
          <h2>Your customers already want this cup. Right now almost nobody can give it to them.</h2>
          <div className={s.split}>
            <div className={s.numList}>
              <div className={s.numItem}><div className={s.n}>1</div><div><h3>It’s the best cup you can buy.</h3><p>Paper with a PHA lining instead of plastic, and no PFAS. It’s certified home-compostable by TÜV Rheinland and leaves no microplastics behind. There’s no other cup in Canada with these certifications, so serving it puts your name next to the highest-quality cup in the country.</p></div></div>
              <div className={s.numItem}><div className={s.n}>2</div><div><h3>Your customers told us they’ll pay for it.</h3><p>We spent a few days on Victoria’s Inner Harbour asking 167 coffee drinkers if they’d pay 15¢ more for a cup with no microplastics that composts at home. 98% said yes.</p></div></div>
              <div className={s.numItem}><div className={s.n}>3</div><div><h3>Being first is worth something.</h3><p>When your stamp is on a cup nobody else in town has, customers feel good buying from you and they talk about it. That’s a real reason to pick your café over the one down the street, and it only works for the cafés that get in early.</p></div></div>
              <div className={s.numItem}><div className={s.n}>4</div><div><h3>It costs about the same as what you’re using now.</h3><p>20 to 24 cents each depending on size, in line with what most cafés pay for PLA. The difference is this one actually composts.</p></div></div>
            </div>
            <div>
              <div className={s.chartLabel}>Would pay $0.15 more per coffee</div>
              <div className={s.bars} role="img" aria-label="Survey results: 87% would pay more for no microplastics, 90% for home compostable, 98% for both">
                <div className={s.bar}><b>87%</b><div style={{ height: "66%" }} /></div>
                <div className={s.bar}><b>90%</b><div style={{ height: "70%" }} /></div>
                <div className={`${s.bar} ${s.barHi}`}><b>98%</b><div style={{ height: "80%" }} /></div>
              </div>
              <div className={s.barLabels}><span>No microplastics</span><span>Home compostable</span><span>Both</span></div>
              <p className={s.note}>167 coffee drinkers, street survey, Victoria Inner Harbour, summer 2026. Interview videos on <a href={IG} target="_blank" rel="noopener noreferrer">@cup_casa</a>.</p>
              <div className={s.pull}>We asked 167 people if they’d pay 15¢ more for this cup. 163 said yes.</div>
            </div>
          </div>

          <div className={s.callout}>
            <h3>About the “compostable” cups most cafés are using now</h3>
            <p>PLA cups only break down at 65°C over 30-plus days in an industrial facility, and the CRD doesn’t accept them in the organics program. They get pulled out at the sorting line and sent to landfill, and they can’t be recycled either because PLA contaminates the plastic stream. The City of Victoria’s own takeout guide says as much. A lot of cafés paid extra for PLA to do the right thing, and it ended up in the same place as a regular plastic-lined cup.</p>
            <p>Our cup breaks down in a backyard bin, a worm bin, or your in-store compost. It doesn’t need a facility the CRD doesn’t have.</p>
          </div>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section>
        <div className={s.wrap}>
          <div className={s.eyebrow}>What we do for you</div>
          <h2>We bring customers to you and we handle the reordering.</h2>
          <p className={s.lede}>We’re not trying to be another line in your distributor order. The cafés that launch with us get marketing, exposure, and two founders who deal with everything personally.</p>
          <div className={s.split}>
            <div className={s.numList}>
              <div className={s.numItem}><div className={s.n}>1</div><div><h3>We advertise and send people to your café.</h3><p>We run paid ads on Instagram and Facebook that bring people to cupcasa.com, where a store locator shows every café serving the cup. When someone wants a coffee in one, they check the map, find you, and come in. You’re on that map from the day we launch.</p></div></div>
              <div className={s.numItem}><div className={s.n}>2</div><div><h3>We announce you and give you the signage.</h3><p>Every founding café gets announced on our Instagram with your name and location. We also give you an A-frame and a till sign with a short explanation and a QR code, so customers understand the cup without your staff having to explain it.</p></div></div>
              <div className={s.numItem}><div className={s.n}>3</div><div><h3>Reordering will be a text message.</h3><p>We’re building a resupply system for early 2027. You’ll get a text when you’re running low with an approve button and a no button. Tap approve, the next case gets charged to your card on file and we deliver it.</p></div></div>
              <div className={s.numItem}><div className={s.n}>4</div><div><h3>You’re dealing with us directly.</h3><p>Cup Casa is Jack Hill and Sulli Bryan, and we’re based in Victoria. We deliver to your café ourselves. If there’s ever a problem with a case, you call one of us and we sort it out the same day.</p></div></div>
              <div className={s.numItem}><div className={s.n}>5</div><div><h3>We hold the exclusive rights for Canada.</h3><p>Nobody else can bring this certified cup into the country. The first container is limited. Once the cafés around you have it, being on the list won’t set you apart anymore. Getting in now is what does.</p></div></div>
            </div>
            <div className={s.compare}>
              <h3>How the cup compares</h3>
              <table>
                <thead><tr><th></th><th>PE / PLA</th><th>Cup Casa</th></tr></thead>
                <tbody>
                  <tr><td>Lining</td><td>Plastic (PE or PLA)</td><td>PHA</td></tr>
                  <tr><td>Microplastics</td><td>Yes</td><td>Zero</td></tr>
                  <tr><td>Home compost</td><td>No</td><td>Certified</td></tr>
                  <tr><td>Recyclable</td><td>No</td><td>Compost it</td></tr>
                  <tr><td>PFAS</td><td>Often</td><td>None</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* OFFER */}
      <section id="pricing">
        <div className={s.wrap}>
          <div className={s.eyebrow}>The offer</div>
          <h2>Be one of the first cafés serving it.</h2>
          <p className={s.lede}>We’re placing the first container with a small group of launch cafés. Spots are limited to what’s on the boat.</p>
          <div className={s.pricing}>
            <div>
              <div className={s.priceRow}><div className={s.size}><b>8oz</b> <span>· The Espresso</span></div><div className={s.case}>$100 / case of 500</div><div className={s.per}>20¢</div></div>
              <div className={s.priceRow}><div className={s.size}><b>12oz</b> <span>· The Everyday</span></div><div className={s.case}>$110 / case of 500</div><div className={s.per}>22¢</div></div>
              <div className={s.priceRow}><div className={s.size}><b>16oz</b> <span>· The Big One</span></div><div className={s.case}>$120 / case of 500</div><div className={s.per}>24¢</div></div>
              <p className={s.note}>Prices in CAD before tax. We deliver to your café.</p>
            </div>
            <div>
              <div className={s.eyebrow}>What launch cafés get</div>
              <ul className={s.perks}>
                <li>Launch pricing held for 12 months</li>
                <li>First-container allocation</li>
                <li>Store-locator listing on cupcasa.com from day one</li>
                <li>Launch announcement on @cup_casa</li>
                <li>Free A-frame and till signage with QR code</li>
                <li>First access to the resupply system when it’s ready</li>
              </ul>
            </div>
          </div>

          <div className={s.eyebrow} style={{ marginTop: 64 }}>How it works</div>
          <div className={s.steps}>
            <div className={s.step}><h4>1. Meet</h4><p>15 minutes at your café, whenever works for you.</p></div>
            <div className={s.step}><h4>2. Sample</h4><p>We bring cups and lids for you to hold, fill, and try.</p></div>
            <div className={s.step}><h4>3. Reserve</h4><p>A $100 deposit holds your first case and comes off your order.</p></div>
            <div className={s.step}><h4>4. Receive</h4><p>Cups land in November and we deliver them to you.</p></div>
          </div>
          <div className={s.ctas}>
            <a className={`${s.btn} ${s.btnCoral}`} href="#contact">Become a launch café</a>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <div className={s.contact} id="contact">
        <div className={`${s.wrap} ${s.inner}`}>
          <div>
            <h2>Give us a call or an email.</h2>
            <p>Ask for Jack or Sulli. We’ll come to you.</p>
            <div className={s.ctas}>
              <a className={`${s.btn} ${s.btnCoral}`} href={mailto}>Email us</a>
              <a className={`${s.btn} ${s.btnGhost}`} href={`tel:${PHONE_1.tel}`}>Call {PHONE_1.display}</a>
            </div>
          </div>
          <div className={s.details}>
            <a className={s.mail} href={mailto}>{EMAIL}</a><br />
            <a href={`tel:${PHONE_1.tel}`}>{PHONE_1.display}</a> · <a href={`tel:${PHONE_2.tel}`}>{PHONE_2.display}</a><br />
            <a href={IG} target="_blank" rel="noopener noreferrer">@cup_casa</a>
          </div>
        </div>
      </div>

      <div className={s.wrap}>
        <p className={s.fine}>Cup Casa Inc., Victoria, BC. Cups are paper with a PHA (polyhydroxyalkanoate) lining. Home compostability certified by TÜV Rheinland; certification documents available on request. Survey: 167 respondents, Victoria Inner Harbour, summer 2026. “Landfill” outcomes for PE and PLA cups describe current Capital Regional District organics and recycling program acceptance, which may change. The resupply system is in development and early 2027 is a target date.</p>
      </div>
    </div>
  );
}

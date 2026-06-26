import type { Metadata } from "next";
import { LegalShell, Clause, List } from "@/components/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Cup Casa Inc. (cupcasa) collects, uses, discloses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      updated="June 25, 2026"
      intro={
        <>
          <p>
            Cup Casa Inc. (&quot;<strong>cupcasa</strong>,&quot; &quot;we,&quot; &quot;us,&quot; or
            &quot;our&quot;) respects your privacy and is committed to protecting the personal
            information you share with us. This Privacy Policy explains what we collect when you
            visit <strong>cups.cupcasa.com</strong> (the &quot;Site&quot;), place an order, or
            contact us, how we use it, and the choices you have.
          </p>
          <p>
            We handle personal information in accordance with Canada&apos;s{" "}
            <em>Personal Information Protection and Electronic Documents Act</em> (PIPEDA) and any
            applicable provincial privacy laws.
          </p>
        </>
      }
    >
      <Clause n={1} title="Information we collect">
        <p>We collect personal information in the following ways:</p>
        <p className="font-semibold text-espresso">Information you give us</p>
        <List
          items={[
            "Contact and account details — your name, email address, phone number, and business name.",
            "Order details — shipping and billing addresses, the products you order, and order history.",
            "Form submissions — information you provide through our wholesale-quote, sample-request, and contact forms, including any message content.",
            "Communications — records of your correspondence with us by email or form.",
          ]}
        />
        <p className="font-semibold text-espresso">Payment information</p>
        <p>
          Payments are processed by our payment provider, Stripe. Your full card number is entered
          directly with Stripe and is <strong>not stored on our servers</strong>. We may receive
          limited transaction details (such as confirmation of payment, the last four digits of your
          card, and billing postal code).
        </p>
        <p className="font-semibold text-espresso">Information collected automatically</p>
        <List
          items={[
            "Device and usage data — IP address, browser type, pages viewed, and referring pages.",
            "Cookies and similar technologies — used to keep your shopping cart working, remember preferences, and understand Site usage.",
          ]}
        />
      </Clause>

      <Clause n={2} title="How we use your information">
        <p>We use personal information to:</p>
        <List
          items={[
            "Process, fulfill, and ship your orders, and provide order confirmations and updates.",
            "Respond to wholesale quotes, sample requests, and other enquiries.",
            "Provide customer service and handle returns or issues.",
            "Operate, maintain, secure, and improve the Site.",
            "Send you transactional messages and, where you have consented, marketing communications.",
            "Comply with our legal and regulatory obligations and enforce our terms.",
          ]}
        />
      </Clause>

      <Clause n={3} title="Consent">
        <p>
          We collect, use, and disclose your personal information with your consent, except where
          permitted or required by law. By providing your information and using the Site, you consent
          to the handling of your information as described in this Policy. You may withdraw your
          consent at any time (see &quot;Your choices and rights&quot; below), subject to legal or
          contractual restrictions and reasonable notice — note that withdrawing consent may prevent
          us from providing certain products or services.
        </p>
      </Clause>

      <Clause n={4} title="How we share your information">
        <p>
          We do not sell your personal information. We share it only as needed to run our business,
          including with:
        </p>
        <List
          items={[
            "Service providers — payment processing (Stripe), website hosting and infrastructure (Vercel), shipping and logistics carriers, email/communications and CRM tools, and analytics providers — who may only use it to perform services for us.",
            "Professional advisors — such as accountants and lawyers, where reasonably necessary.",
            "Legal and safety — when required by law, court order, or to protect our rights, customers, or the public.",
            "Business transfers — in connection with a merger, acquisition, financing, or sale of assets, your information may be transferred as part of that transaction.",
          ]}
        />
      </Clause>

      <Clause n={5} title="International transfers">
        <p>
          Some of our service providers (including Stripe and our hosting provider) may store or
          process your personal information outside of Canada, including in the United States. While
          your information is in another jurisdiction, it may be subject to that jurisdiction&apos;s
          laws, including lawful access by courts and government authorities. We take reasonable steps
          to ensure your information receives a comparable level of protection.
        </p>
      </Clause>

      <Clause n={6} title="Cookies">
        <p>
          We use cookies and similar technologies to operate the cart and checkout, remember your
          preferences, and measure Site performance. You can control cookies through your browser
          settings; disabling some cookies may affect how parts of the Site function.
        </p>
      </Clause>

      <Clause n={7} title="Data retention">
        <p>
          We keep personal information only as long as necessary for the purposes described in this
          Policy, or as required to meet legal, accounting, tax, and reporting obligations. When it is
          no longer needed, we securely delete or anonymize it.
        </p>
      </Clause>

      <Clause n={8} title="Safeguards">
        <p>
          We use appropriate physical, organizational, and technological safeguards to protect your
          personal information against loss, theft, and unauthorized access, disclosure, or use. No
          method of transmission or storage is completely secure, so we cannot guarantee absolute
          security.
        </p>
      </Clause>

      <Clause n={9} title="Your choices and rights">
        <p>Subject to applicable law, you may:</p>
        <List
          items={[
            "Access the personal information we hold about you and request a copy.",
            "Request correction of inaccurate or incomplete information.",
            "Withdraw consent to certain uses, including unsubscribing from marketing emails at any time via the link in each message.",
            "Ask questions or make a complaint about how we handle your information.",
          ]}
        />
        <p>
          To exercise any of these rights, contact our Privacy Officer using the details below. We may
          need to verify your identity before responding.
        </p>
      </Clause>

      <Clause n={10} title="Children's privacy">
        <p>
          The Site is intended for businesses and adults who have reached the age of majority in their
          province or territory. We do not knowingly collect personal information from children. If you
          believe a child has provided us information, please contact us and we will delete it.
        </p>
      </Clause>

      <Clause n={11} title="Third-party links">
        <p>
          The Site may link to third-party websites or services we do not control. This Policy does not
          apply to those sites; please review their privacy policies.
        </p>
      </Clause>

      <Clause n={12} title="Changes to this Policy">
        <p>
          We may update this Policy from time to time. We will post the revised version here with an
          updated &quot;Last updated&quot; date, and material changes will take effect when posted.
        </p>
      </Clause>

      <Clause n={13} title="Contact us">
        <p>
          If you have questions, requests, or concerns about your personal information, contact our
          Privacy Officer:
        </p>
        <List
          items={[
            <>Cup Casa Inc. — Privacy Officer</>,
            <>Email: <a className="text-coral font-semibold underline" href="mailto:hello@cupcasa.com">hello@cupcasa.com</a></>,
          ]}
        />
        <p>
          If you are not satisfied with our response, you may contact the Office of the Privacy
          Commissioner of Canada at{" "}
          <a className="text-coral font-semibold underline" href="https://www.priv.gc.ca" target="_blank" rel="noopener noreferrer">
            priv.gc.ca
          </a>
          , and/or your applicable provincial privacy regulator.
        </p>
      </Clause>
    </LegalShell>
  );
}

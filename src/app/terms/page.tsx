import type { Metadata } from "next";
import { LegalShell, Clause, List } from "@/components/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing your use of cups.cupcasa.com and your purchase of cupcasa PHA cups from Cup Casa Inc.",
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      updated="June 25, 2026"
      intro={
        <>
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of{" "}
            <strong>cups.cupcasa.com</strong> (the &quot;Site&quot;) and your purchase of products
            from Cup Casa Inc. (&quot;<strong>cupcasa</strong>,&quot; &quot;we,&quot; &quot;us,&quot;
            or &quot;our&quot;). By using the Site or placing an order, you agree to these Terms. If you
            do not agree, please do not use the Site.
          </p>
        </>
      }
    >
      <Clause n={1} title="Who we are">
        <p>
          The Site is operated by Cup Casa Inc., trading as cupcasa. You can reach us at{" "}
          <a className="text-coral font-semibold underline" href="mailto:hello@cupcasa.com">
            hello@cupcasa.com
          </a>
          .
        </p>
      </Clause>

      <Clause n={2} title="Eligibility">
        <p>
          You must have reached the age of majority in your province or territory and be able to form a
          binding contract to purchase from us. By ordering, you represent that you meet these
          requirements and that the information you provide is accurate and complete.
        </p>
      </Clause>

      <Clause n={3} title="Products">
        <List
          items={[
            "Our cups are made from PHA (polyhydroxyalkanoate) and are supplied blank and unbranded.",
            "Cups are sold by the case of 1,000 units unless otherwise stated.",
            "We work to display products accurately, but colours, finishes, and dimensions may vary slightly, and your screen may not reflect exact appearance.",
            "Product availability is not guaranteed and may change without notice.",
          ]}
        />
      </Clause>

      <Clause n={4} title="Compostability and environmental claims">
        <p>
          Our cups are designed to break down in home, industrial, and marine environments. However,
          composting and biodegradation outcomes depend on real-world conditions and on local
          collection and processing infrastructure, which varies by region. Environmental statements
          describe the material&apos;s designed end-of-life behaviour and are not a guarantee of a
          specific result in every disposal scenario. Please follow your local composting and waste
          guidelines.
        </p>
      </Clause>

      <Clause n={5} title="Pricing and taxes">
        <List
          items={[
            "Prices are shown on the Site and at checkout in the currency indicated there.",
            "We try to keep pricing accurate, but prices, fees, and availability may change at any time before you place an order.",
            "Applicable taxes and shipping charges are calculated and shown at checkout.",
            "If a product is listed at an incorrect price due to an obvious error, we may cancel the order and refund any amount paid.",
          ]}
        />
      </Clause>

      <Clause n={6} title="Orders and acceptance">
        <p>
          Your order is an offer to purchase. A confirmation message acknowledges that we received your
          order; a contract is formed only when we accept it. We may refuse or cancel any order at our
          discretion — including for suspected fraud, pricing errors, or stock limitations — and will
          refund any payment taken for a cancelled order.
        </p>
      </Clause>

      <Clause n={7} title="Payment">
        <p>
          Payments are processed securely by Stripe. By providing payment information, you authorize us
          (through Stripe) to charge the total order amount, including taxes and shipping. You are
          responsible for ensuring your payment details are valid and accurate.
        </p>
      </Clause>

      <Clause n={8} title="Shipping and delivery">
        <List
          items={[
            "We currently ship within Canada and the United States. For other regions, please contact us.",
            "Delivery times are estimates and are not guaranteed; delays may occur due to carriers, customs, or events beyond our control.",
            "Risk of loss and title pass to you upon delivery to the carrier, unless otherwise required by law.",
            "Please inspect your order on arrival and notify us promptly of any damage or shortage.",
          ]}
        />
      </Clause>

      <Clause n={9} title="Wholesale and bulk orders">
        <p>
          Wholesale pricing, tiers, and quotes are indicative until confirmed by us in writing. Bulk
          orders may be subject to minimum order quantities, separate freight terms, lead times, and a
          specific quote or agreement, which will govern in the event of any conflict with these Terms.
        </p>
      </Clause>

      <Clause n={10} title="Returns and refunds">
        <p>
          If your order arrives damaged, defective, or incorrect, contact us at{" "}
          <a className="text-coral font-semibold underline" href="mailto:hello@cupcasa.com">
            hello@cupcasa.com
          </a>{" "}
          within 14 days of delivery with your order number and
          photos, and we will arrange a replacement or refund as appropriate. Because cups are food-
          contact products supplied by the case, we may be unable to accept returns of opened cases for
          reasons other than a defect, except where required by law.
        </p>
      </Clause>

      <Clause n={11} title="Acceptable use">
        <p>You agree not to:</p>
        <List
          items={[
            "Use the Site for any unlawful, fraudulent, or harmful purpose.",
            "Interfere with or disrupt the Site, its security, or its underlying infrastructure.",
            "Attempt to gain unauthorized access to any part of the Site or other users' data.",
            "Copy, scrape, or resell Site content except as expressly permitted.",
          ]}
        />
      </Clause>

      <Clause n={12} title="Intellectual property">
        <p>
          The Site and its content — including the cupcasa name and logo, text, graphics, and design —
          are owned by or licensed to Cup Casa Inc. and are protected by intellectual-property laws.
          You may not use them without our prior written permission, except to view and use the Site as
          intended.
        </p>
      </Clause>

      <Clause n={13} title="Disclaimers">
        <p>
          Except as expressly stated and to the fullest extent permitted by law, the Site and products
          are provided &quot;as is&quot; and &quot;as available,&quot; and we disclaim all implied
          warranties, including merchantability and fitness for a particular purpose. Nothing in these
          Terms limits any rights you have under applicable consumer-protection law that cannot lawfully
          be excluded.
        </p>
      </Clause>

      <Clause n={14} title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, Cup Casa Inc. and its directors, officers, employees,
          and suppliers will not be liable for any indirect, incidental, special, consequential, or
          punitive damages, or for lost profits or data, arising from your use of the Site or products.
          Our total liability for any claim relating to a product or order will not exceed the amount you
          paid for that order. Some jurisdictions do not allow certain limitations, so some of these may
          not apply to you.
        </p>
      </Clause>

      <Clause n={15} title="Indemnification">
        <p>
          You agree to indemnify and hold harmless Cup Casa Inc. from any claims, losses, liabilities,
          and expenses (including reasonable legal fees) arising out of your breach of these Terms or your
          misuse of the Site or products.
        </p>
      </Clause>

      <Clause n={16} title="Governing law">
        <p>
          These Terms are governed by the laws of the Province of British Columbia and the federal
          laws of Canada applicable there,
          without regard to conflict-of-laws rules. You agree to the exclusive jurisdiction of the courts
          located in that province for any dispute, subject to any non-waivable rights you have under
          applicable law.
        </p>
      </Clause>

      <Clause n={17} title="Changes to these Terms">
        <p>
          We may update these Terms from time to time. The version posted here with the current
          &quot;Last updated&quot; date applies to your use of the Site and to new orders. Continued use
          after changes are posted means you accept the updated Terms.
        </p>
      </Clause>

      <Clause n={18} title="General">
        <List
          items={[
            "If any provision of these Terms is found unenforceable, the remaining provisions stay in effect.",
            "Our failure to enforce a provision is not a waiver of it.",
            "These Terms, together with any order confirmation or wholesale agreement, are the entire agreement between you and us regarding the Site and your purchases.",
          ]}
        />
      </Clause>

      <Clause n={19} title="Contact">
        <p>
          Questions about these Terms? Email{" "}
          <a className="text-coral font-semibold underline" href="mailto:hello@cupcasa.com">
            hello@cupcasa.com
          </a>
          .
        </p>
      </Clause>
    </LegalShell>
  );
}

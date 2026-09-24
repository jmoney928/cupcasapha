import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as s, pdfColors as c } from "./theme";
import { DocFooter, Bullet } from "./doc-parts";
import { APPROVED_CLAIMS, CLAIMS_TO_AVOID, SUBSTANTIATION } from "@/lib/compliance/claims";
import { CERT, MATERIAL_CLAIM } from "@/lib/certs";

export type ClaimsKitProps = { cafeName: string; preparedBy: string; generatedOn: string };

/** What a café may say about our cup, what it may not, and the substantiation behind it. */
export function ClaimsKitPdf({ cafeName, preparedBy, generatedOn }: ClaimsKitProps) {
  const title = "Claims & greenwashing kit";
  return (
    <Document title={`${title} — ${cafeName}`} author="Cup Casa Inc.">
      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>Cup Casa · Compliance Center</Text>
        <Text style={s.h1}>What you can say about this cup</Text>
        <Text style={s.muted}>{`${cafeName} · prepared for ${preparedBy} · ${generatedOn}`}</Text>
        <View style={s.divider} />

        <View style={s.callout}>
          <Text style={s.h3}>The one rule worth remembering</Text>
          <Text>
            Our certificate covers <Text style={s.bold}>the cup</Text>. It does not cover your café. Claims about your
            waste stream, your other packaging or your operation need their own basis — and if one is challenged, the
            certificate will not answer it.
          </Text>
        </View>

        <Text style={s.h2}>Say this</Text>
        <Text style={[s.p, s.muted]}>Every line below is a claim our certification supports.</Text>

        <View style={s.good}>
          <Text style={s.h3}>On a menu or a cup sleeve</Text>
          {APPROVED_CLAIMS.menuLine.map((t) => <Bullet key={t}>{t}</Bullet>)}
        </View>
        <View style={s.good}>
          <Text style={s.h3}>On a chalkboard or a till card</Text>
          {APPROVED_CLAIMS.chalkboard.map((t) => <Bullet key={t}>{t}</Bullet>)}
        </View>
        <View style={s.good}>
          <Text style={s.h3}>On your website or an About page</Text>
          {APPROVED_CLAIMS.website.map((t) => <Text key={t} style={{ marginBottom: 4 }}>{t}</Text>)}
        </View>

        <DocFooter title={title} cafeName={cafeName} generatedOn={generatedOn} kind="claims" />
      </Page>

      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>Section 2</Text>
        <Text style={s.h2}>Don&apos;t say this</Text>
        <Text style={[s.p, s.muted]}>
          Each of these is a claim a café makes in good faith and cannot back. The replacement says the same thing in a
          way that survives a challenge.
        </Text>
        {CLAIMS_TO_AVOID.map((w) => (
          <View key={w.avoid} style={[s.card, { marginBottom: 9 }]} wrap={false}>
            <Text style={[s.h3, { color: c.coral }]}>{w.avoid}</Text>
            <Text style={{ marginBottom: 4 }}>{w.why}</Text>
            <Text><Text style={s.bold}>Instead: </Text>{w.insteadSay}</Text>
          </View>
        ))}
        <DocFooter title={title} cafeName={cafeName} generatedOn={generatedOn} kind="claims" />
      </Page>

      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>Section 3</Text>
        <Text style={s.h2}>Substantiation</Text>
        <Text style={[s.p, s.muted]}>
          Hand this page to anyone — a customer, a procurement officer, an inspector — who asks what backs the claim.
        </Text>

        <View style={s.rowHead}><Text style={[s.th, { flex: 1 }]}>What</Text><Text style={[s.th, { flex: 2 }]}>Detail</Text></View>
        {[
          ["Certificate", SUBSTANTIATION.certificate],
          ["Issued by", SUBSTANTIATION.issuer],
          ["Covers", SUBSTANTIATION.scope],
          ["Material", MATERIAL_CLAIM],
          ["Certificate number", CERT.number],
        ].map(([k, v]) => (
          <View key={k} style={s.row} wrap={false}>
            <Text style={[s.bold, { flex: 1, paddingRight: 8 }]}>{k}</Text>
            <Text style={{ flex: 2 }}>{v}</Text>
          </View>
        ))}

        <Text style={[s.h3, { marginTop: 16 }]}>What it does not cover</Text>
        {SUBSTANTIATION.doesNotCover.map((t) => <Bullet key={t}>{t}</Bullet>)}

        <View style={[s.callout, { marginTop: 14 }]}>
          <Text style={s.h3}>The legal basis</Text>
          <Text>{SUBSTANTIATION.legalBasis}</Text>
          <Text style={[s.muted, { marginTop: 6, fontSize: 8 }]}>
            {`${SUBSTANTIATION.regulator.label} — ${SUBSTANTIATION.regulator.url}`}
          </Text>
        </View>

        <Text style={[s.muted, { fontSize: 8, marginTop: 10 }]}>
          Certificate documents are available from Cup Casa on request: hello@cupcasa.com
        </Text>
        <DocFooter title={title} cafeName={cafeName} generatedOn={generatedOn} kind="claims" />
      </Page>
    </Document>
  );
}

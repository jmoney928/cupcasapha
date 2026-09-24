import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { RoiResult } from "@/lib/calc/roi";
import { formatCad, formatCadPrecise } from "@/lib/calc/money";
import { SURVEY } from "@/lib/calc/survey";

const c = { ink: "#2b1d14", text: "#3a2e26", muted: "#6f625a", coral: "#e8735c", gold: "#a8753f", line: "#d9cec2", tint: "#f5efe6" };

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 36, paddingHorizontal: 48, fontSize: 10, color: c.text, fontFamily: "Helvetica" },
  eyebrow: { fontSize: 8, letterSpacing: 1.6, color: c.gold, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 8 },
  h1: { fontSize: 22, color: c.ink, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  meta: { fontSize: 9, color: c.muted, marginBottom: 16 },
  heroBox: { backgroundColor: c.tint, borderLeft: `3 solid ${c.coral}`, padding: 16, marginBottom: 16 },
  heroLabel: { fontSize: 9, color: c.muted, marginBottom: 4 },
  hero: { fontSize: 30, color: c.ink, fontFamily: "Helvetica-Bold" },
  sentence: { fontSize: 11, color: c.ink, marginTop: 10, lineHeight: 1.45 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottom: `0.5 solid ${c.line}` },
  rowHead: { flexDirection: "row", justifyContent: "space-between", paddingBottom: 6, borderBottom: `1 solid ${c.ink}` },
  th: { fontSize: 8, letterSpacing: 1.2, color: c.muted, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  cell: { fontSize: 10 },
  cellStrong: { fontSize: 10, color: c.ink, fontFamily: "Helvetica-Bold" },
  col: { width: "33%" },
  colRight: { width: "33%", textAlign: "right" },
  h2: { fontSize: 12, color: c.ink, fontFamily: "Helvetica-Bold", marginTop: 18, marginBottom: 7 },
  p: { fontSize: 10, lineHeight: 1.5, marginBottom: 6 },
  proof: { backgroundColor: c.tint, padding: 14, marginTop: 8 },
  bullet: { fontSize: 10, marginBottom: 3 },
  fine: { fontSize: 7.5, color: c.muted, lineHeight: 1.45, marginTop: 18, borderTop: `0.5 solid ${c.line}`, paddingTop: 10 },
});

export type RoiPdfProps = {
  result: RoiResult;
  cafeName: string;
  contactName: string;
  sizeLabel: string;
  priceIncreaseCents: number;
  generatedOn: string;
};

/** The breakdown emailed after "Email me this breakdown". Same numbers as the screen, no flattery. */
export function RoiBreakdownPdf({ result: r, cafeName, contactName, sizeLabel, priceIncreaseCents, generatedOn }: RoiPdfProps) {
  const cupDelta = r.perCup.cupcasaCupCostCents - r.perCup.currentCupCostCents;
  return (
    <Document title={`Cup Casa switch breakdown — ${cafeName}`} author="Cup Casa Inc.">
      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>Cup Casa · Switch breakdown</Text>
        <Text style={s.h1}>{cafeName}</Text>
        <Text style={s.meta}>
          Prepared for {contactName} on {generatedOn} · {sizeLabel} cups · {r.annualCups.toLocaleString("en-CA")} cups a year
        </Text>

        <View style={s.heroBox}>
          <Text style={s.heroLabel}>{r.isNetLoss ? "Net annual change" : "Net annual gain"}</Text>
          <Text style={s.hero}>{formatCad(r.netGainCents)}</Text>
          <Text style={s.sentence}>
            {r.isNetLoss
              ? `On these numbers the switch costs you ${formatCad(Math.abs(r.netGainCents))} a year. That is the honest arithmetic at a ${formatCadPrecise(priceIncreaseCents)} increase — a slightly larger increase, or the value of being the only café in town with a certified home-compostable cup, is what closes the gap.`
              : `Switching costs you ${formatCad(Math.abs(r.addedCupCostCents))} more in cups and earns you ${formatCad(r.addedRevenueCents)} more in revenue. You keep ${formatCad(r.netGainCents)}.`}
          </Text>
        </View>

        <View style={s.rowHead}>
          <Text style={[s.th, s.col]}>Per year</Text>
          <Text style={[s.th, s.colRight]}>Amount</Text>
          <Text style={[s.th, s.colRight]}>Per cup</Text>
        </View>
        <View style={s.row}>
          <Text style={[s.cell, s.col]}>{r.addedCupCostCents >= 0 ? "Added cup cost" : "Cup cost saved"}</Text>
          <Text style={[s.cell, s.colRight]}>{formatCad(Math.abs(r.addedCupCostCents))}</Text>
          <Text style={[s.cell, s.colRight]}>{formatCadPrecise(Math.abs(cupDelta))}</Text>
        </View>
        <View style={s.row}>
          <Text style={[s.cell, s.col]}>Added revenue</Text>
          <Text style={[s.cell, s.colRight]}>{formatCad(r.addedRevenueCents)}</Text>
          <Text style={[s.cell, s.colRight]}>{formatCadPrecise(priceIncreaseCents * r.acceptance)}</Text>
        </View>
        <View style={s.row}>
          <Text style={[s.cellStrong, s.col]}>Net</Text>
          <Text style={[s.cellStrong, s.colRight]}>{formatCad(r.netGainCents)}</Text>
          <Text style={[s.cellStrong, s.colRight]}>{formatCadPrecise(r.perCup.marginChangeCents)}</Text>
        </View>

        <Text style={s.h2}>Per cup</Text>
        <View style={s.rowHead}>
          <Text style={[s.th, s.col]} />
          <Text style={[s.th, s.colRight]}>Now</Text>
          <Text style={[s.th, s.colRight]}>With Cup Casa</Text>
        </View>
        <View style={s.row}>
          <Text style={[s.cell, s.col]}>Cup cost</Text>
          <Text style={[s.cell, s.colRight]}>{formatCadPrecise(r.perCup.currentCupCostCents)}</Text>
          <Text style={[s.cell, s.colRight]}>{formatCadPrecise(r.perCup.cupcasaCupCostCents)}</Text>
        </View>
        <View style={s.row}>
          <Text style={[s.cell, s.col]}>Drink price</Text>
          <Text style={[s.cell, s.colRight]}>{formatCadPrecise(r.perCup.currentDrinkPriceCents)}</Text>
          <Text style={[s.cell, s.colRight]}>{formatCadPrecise(r.perCup.newDrinkPriceCents)}</Text>
        </View>
        <View style={s.row}>
          <Text style={[s.cellStrong, s.col]}>Margin change</Text>
          <Text style={[s.cell, s.colRight]}>—</Text>
          <Text style={[s.cellStrong, s.colRight]}>
            {r.perCup.marginChangeCents >= 0 ? "+" : "−"}
            {formatCadPrecise(Math.abs(r.perCup.marginChangeCents))}
          </Text>
        </View>

        <Text style={s.h2}>Why we think your customers will pay it</Text>
        <View style={s.proof}>
          <Text style={s.p}>
            {`We asked ${SURVEY.respondents} people on ${SURVEY.place} whether they'd pay $0.15 more for a coffee. ${SURVEY.agreed} said yes.`}
          </Text>
          {SURVEY.results.map((x) => (
            <Text key={x.label} style={s.bullet}>
              {`• ${x.pct}% yes, for ${x.label.toLowerCase()}`}
            </Text>
          ))}
        </View>
        <Text style={[s.p, { marginTop: 8, color: c.muted, fontSize: 9 }]}>{SURVEY.method}</Text>

        <Text style={s.fine}>
          {`Estimate only, based on the figures you entered and a ${Math.round(r.acceptance * 100)}% price-acceptance rate drawn from the survey above. Cup prices are before tax and delivery. Actual results depend on your drink mix, volume and how you present the change to customers. Cup Casa Inc., Victoria, BC · hello@cupcasa.com`}
        </Text>
      </Page>
    </Document>
  );
}

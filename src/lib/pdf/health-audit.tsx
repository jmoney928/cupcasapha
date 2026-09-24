import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as s, pdfColors as c } from "./theme";
import { DocFooter } from "./doc-parts";
import { HEALTH_AUDIT, HEALTH_SOURCES } from "@/lib/compliance/health-audit";

export type HealthAuditProps = { cafeName: string; preparedBy: string; generatedOn: string; healthAuthority: string };

/** The walk-round an operator does before Island Health does it for them. */
export function HealthAuditPdf({ cafeName, preparedBy, generatedOn, healthAuthority }: HealthAuditProps) {
  const title = "Health self-audit";
  return (
    <Document title={`${title} — ${cafeName}`} author="Cup Casa Inc.">
      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>Cup Casa · Compliance Center</Text>
        <Text style={s.h1}>Pre-inspection self-audit</Text>
        <Text style={s.muted}>{`${cafeName} · prepared for ${preparedBy} · ${generatedOn} · ${healthAuthority}`}</Text>
        <View style={s.divider} />
        <Text style={[s.p, s.muted]}>
          Walk the shop with this before an inspector does. Tick what&apos;s right, note what isn&apos;t, and put a date
          against the fix. Keep the completed sheets — showing improvement over time is itself worth something.
        </Text>
        <View style={{ flexDirection: "row", gap: 18, marginBottom: 6 }}>
          <View style={{ flex: 1 }}><View style={s.blank} /><Text style={s.signLabel}>Completed by</Text></View>
          <View style={{ flex: 1 }}><View style={s.blank} /><Text style={s.signLabel}>Date</Text></View>
        </View>
        <DocFooter title={title} cafeName={cafeName} generatedOn={generatedOn} kind="audit" />
      </Page>

      {HEALTH_AUDIT.reduce<AuditSection[][]>((pages, section, i) => {
        const page = Math.floor(i / 3);
        pages[page] = [...(pages[page] ?? []), section];
        return pages;
      }, []).map((sections, i) => (
        <Page key={i} size="LETTER" style={s.page}>
          {sections.map((section) => (
            <View key={section.id} style={{ marginBottom: 16 }}>
              <Text style={s.h2}>{section.title}</Text>
              <View style={s.rowHead}>
                <Text style={[s.th, { flex: 1 }]}>Check</Text>
                <Text style={[s.th, { width: 34, textAlign: "center" }]}>OK</Text>
                <Text style={[s.th, { width: 34, textAlign: "center" }]}>Fix</Text>
                <Text style={[s.th, { width: 120 }]}>Action / by when</Text>
              </View>
              {section.items.map((item) => (
                <View key={item} style={s.row} wrap={false}>
                  <Text style={{ flex: 1, paddingRight: 6 }}>{item}</Text>
                  <Text style={{ width: 34, textAlign: "center" }}>☐</Text>
                  <Text style={{ width: 34, textAlign: "center" }}>☐</Text>
                  <View style={{ width: 120, borderBottom: `0.5 solid ${c.line}` }} />
                </View>
              ))}
            </View>
          ))}
          <DocFooter title={title} cafeName={cafeName} generatedOn={generatedOn} kind="audit" />
        </Page>
      ))}

      <Page size="LETTER" style={s.page}>
        <Text style={s.h2}>Anything that needs fixing</Text>
        <Text style={[s.p, s.muted]}>List the items you ticked &quot;Fix&quot;, who is doing it, and by when.</Text>
        <View style={s.rowHead}>
          <Text style={[s.th, { flex: 1 }]}>Item</Text>
          <Text style={[s.th, { width: 110 }]}>Who</Text>
          <Text style={[s.th, { width: 80 }]}>By when</Text>
          <Text style={[s.th, { width: 60 }]}>Done</Text>
        </View>
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={[s.row, { height: 24 }]}>
            <View style={{ flex: 1 }} /><View style={{ width: 110 }} /><View style={{ width: 80 }} />
            <Text style={{ width: 60, textAlign: "center" }}>☐</Text>
          </View>
        ))}
        <Text style={[s.muted, { fontSize: 8, marginTop: 16 }]}>
          {`Built against: ${HEALTH_SOURCES.map((h) => `${h.label} (${h.url})`).join("; ")}. This is a self-check, not an inspection, and it does not replace the regulation or your food safety plan.`}
        </Text>
        <DocFooter title={title} cafeName={cafeName} generatedOn={generatedOn} kind="audit" />
      </Page>
    </Document>
  );
}

type AuditSection = (typeof HEALTH_AUDIT)[number];

import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { CATEGORY_LABELS, formatDate, type SdsProduct } from "@/lib/compliance/sds";
import { CAFE_HAZARDS, ORIENTATION_TOPICS } from "@/lib/compliance/hazards";
import { COMPLIANCE_DISCLAIMER, WORKSAFE_SOURCES } from "@/lib/compliance/disclaimer";

const c = { ink: "#2b1d14", text: "#3a2e26", muted: "#6f625a", coral: "#e8735c", gold: "#a8753f", line: "#d9cec2", tint: "#f5efe6" };

const s = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 52, paddingHorizontal: 46, fontSize: 9.5, color: c.text, fontFamily: "Helvetica", lineHeight: 1.45 },
  eyebrow: { fontSize: 7.5, letterSpacing: 1.5, color: c.gold, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 6 },
  h1: { fontSize: 26, color: c.ink, fontFamily: "Helvetica-Bold", marginBottom: 4, lineHeight: 1.1 },
  h2: { fontSize: 15, color: c.ink, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  h3: { fontSize: 10.5, color: c.ink, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  p: { marginBottom: 7 },
  muted: { color: c.muted },
  divider: { borderBottom: `1 solid ${c.ink}`, marginTop: 8, marginBottom: 14 },
  card: { backgroundColor: c.tint, padding: 12, marginBottom: 10 },
  callout: { borderLeft: `3 solid ${c.coral}`, backgroundColor: c.tint, padding: 12, marginBottom: 12 },
  rowHead: { flexDirection: "row", paddingBottom: 5, borderBottom: `1 solid ${c.ink}` },
  row: { flexDirection: "row", paddingVertical: 6, borderBottom: `0.5 solid ${c.line}` },
  th: { fontSize: 7.5, letterSpacing: 1, color: c.muted, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  bold: { fontFamily: "Helvetica-Bold", color: c.ink },
  qrRow: { flexDirection: "row", paddingVertical: 9, borderBottom: `0.5 solid ${c.line}`, alignItems: "flex-start" },
  qr: { width: 52, height: 52, marginRight: 12 },
  bullet: { flexDirection: "row", marginBottom: 3 },
  dot: { width: 10, color: c.coral },
  toc: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottom: `0.5 solid ${c.line}` },
  footer: { position: "absolute", bottom: 26, left: 46, right: 46, fontSize: 6.8, color: c.muted, borderTop: `0.5 solid ${c.line}`, paddingTop: 6, lineHeight: 1.4 },
  signRow: { flexDirection: "row", marginTop: 16, gap: 18 },
  signBox: { flex: 1, borderBottom: `0.75 solid ${c.ink}`, height: 26 },
  signLabel: { fontSize: 7.5, color: c.muted, marginTop: 3 },
  blank: { borderBottom: `0.5 solid ${c.line}`, height: 20 },
  wallTitle: { fontSize: 44, color: c.ink, fontFamily: "Helvetica-Bold", textAlign: "center", lineHeight: 1.05 },
  wallBody: { fontSize: 15, textAlign: "center", marginTop: 18, lineHeight: 1.5 },
  wallBox: { border: `2 solid ${c.ink}`, padding: 30, marginTop: 40 },
});

export type BinderItem = { product: SdsProduct; location: string; qrDataUrl: string | null; url: string | null };

export type BinderProps = {
  cafeName: string;
  preparedBy: string;
  address?: string;
  generatedOn: string;
  reviewDueOn: string;
  items: BinderItem[];
};

const Footer = ({ cafeName, generatedOn }: { cafeName: string; generatedOn: string }) => (
  <Text style={s.footer} fixed>
    {`${cafeName} · WHMIS & safety binder · generated ${generatedOn} by Cup Casa. ${COMPLIANCE_DISCLAIMER}`}
  </Text>
);

const Bullet = ({ children }: { children: string }) => (
  <View style={s.bullet}>
    <Text style={s.dot}>•</Text>
    <Text style={{ flex: 1 }}>{children}</Text>
  </View>
);

/**
 * The gated asset: a printable WHMIS and safety binder for a BC café.
 * Sheets are indexed, never mirrored, so the café always reaches the manufacturer's current version.
 */
export function WorkSafeBinderPdf({ cafeName, preparedBy, address, generatedOn, reviewDueOn, items }: BinderProps) {
  const linked = items.filter((i) => i.url);
  const unlinked = items.filter((i) => !i.url);
  const contents = [
    "1. Hazardous products inventory",
    "2. Safety data sheet index",
    "3. \"Safety data sheets are here\" wall sign",
    "4. Safe work procedures",
    "5. New and young worker orientation",
    "6. Orientation record and sign-off",
    "7. Incident report form",
    "8. Monthly safety inspection checklist",
  ];

  return (
    <Document title={`WHMIS & safety binder — ${cafeName}`} author="Cup Casa Inc.">
      {/* ---------- cover ---------- */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>Cup Casa · Compliance Center</Text>
        <Text style={s.h1}>WHMIS &amp; safety binder</Text>
        <Text style={[s.h2, { color: c.coral, marginTop: 2 }]}>{cafeName}</Text>
        <Text style={s.muted}>
          {[address, `Prepared for ${preparedBy}`, `Generated ${generatedOn}`].filter(Boolean).join(" · ")}
        </Text>
        <View style={s.divider} />

        <View style={s.callout}>
          <Text style={s.h3}>Review this binder by {reviewDueOn}</Text>
          <Text>
            In British Columbia, safety data sheets must be checked at least every three years to confirm they still
            hold current information. That is a BC-specific requirement, and it is the date above. Re-generate this
            binder then, or sooner if you change products.
          </Text>
        </View>

        <Text style={s.h2}>What&apos;s inside</Text>
        {contents.map((t) => (
          <View key={t} style={s.toc}>
            <Text>{t}</Text>
          </View>
        ))}

        <View style={[s.card, { marginTop: 18 }]}>
          <Text style={s.h3}>How to use it</Text>
          <Bullet>Print it and keep it where staff can reach it without asking a manager.</Bullet>
          <Bullet>Safety data sheets are linked, not copied, so you always open the manufacturer&apos;s current sheet.</Bullet>
          <Bullet>Fill in the orientation record for every new hire, and keep it in their file.</Bullet>
          <Bullet>Walk the inspection checklist monthly and keep the completed sheets.</Bullet>
        </View>

        <Text style={[s.muted, { marginTop: 14, fontSize: 8 }]}>
          {`Based on: ${WORKSAFE_SOURCES.map((x) => x.label).join("; ")}.`}
        </Text>
        <Footer cafeName={cafeName} generatedOn={generatedOn} />
      </Page>

      {/* ---------- 1. inventory ---------- */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>Section 1</Text>
        <Text style={s.h2}>Hazardous products inventory</Text>
        <Text style={[s.p, s.muted]}>
          Every hazardous product on site, where it is kept, and its main hazard. Update this whenever you change
          a product, and note that a product moved out of its original container needs a workplace label.
        </Text>
        <View style={s.rowHead}>
          <Text style={[s.th, { width: "30%" }]}>Product</Text>
          <Text style={[s.th, { width: "20%" }]}>Category</Text>
          <Text style={[s.th, { width: "20%" }]}>Location</Text>
          <Text style={[s.th, { width: "30%" }]}>Main hazard</Text>
        </View>
        {items.map((i) => (
          <View key={i.product.id} style={s.row} wrap={false}>
            <View style={{ width: "30%", paddingRight: 6 }}>
              <Text style={s.bold}>{i.product.name}</Text>
              <Text style={[s.muted, { fontSize: 8 }]}>{i.product.manufacturer}</Text>
            </View>
            <Text style={{ width: "20%", paddingRight: 6 }}>{CATEGORY_LABELS[i.product.category]}</Text>
            <Text style={{ width: "20%", paddingRight: 6 }}>{i.location}</Text>
            <Text style={{ width: "30%" }}>{i.product.hazardSummary}</Text>
          </View>
        ))}
        <Text style={[s.muted, { marginTop: 12, fontSize: 8 }]}>
          {`${items.length} product${items.length === 1 ? "" : "s"} listed. Anything you use that is not here must be added — the inventory is only correct if it is complete.`}
        </Text>
        <Footer cafeName={cafeName} generatedOn={generatedOn} />
      </Page>

      {/* ---------- 2. SDS index ---------- */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>Section 2</Text>
        <Text style={s.h2}>Safety data sheet index</Text>
        <Text style={[s.p, s.muted]}>
          Scan the code or type the address to open the manufacturer&apos;s current sheet. We deliberately do not
          reproduce sheets here — a copy in a binder goes out of date the moment the manufacturer revises it.
        </Text>
        {linked.map((i) => (
          <View key={i.product.id} style={s.qrRow} wrap={false}>
            {i.qrDataUrl ? <Image style={s.qr} src={i.qrDataUrl} /> : <View style={s.qr} />}
            <View style={{ flex: 1 }}>
              <Text style={s.bold}>{i.product.name}</Text>
              <Text style={[s.muted, { fontSize: 8 }]}>
                {`${i.product.manufacturer} · kept: ${i.location}${i.product.sdsRevision ? ` · sheet revised ${i.product.sdsRevision}` : ""}`}
              </Text>
              <Text style={{ fontSize: 8, marginTop: 3 }}>{i.url}</Text>
            </View>
          </View>
        ))}
        {unlinked.length > 0 && (
          <View style={[s.callout, { marginTop: 14 }]}>
            <Text style={s.h3}>Get these sheets from your supplier</Text>
            <Text style={{ marginBottom: 6 }}>
              These products vary by brand, so only your supplier can give you the right sheet. Ask them, then file it
              behind this page. They stay on the inventory either way.
            </Text>
            {unlinked.map((i) => (
              <Bullet key={i.product.id}>
                {`${i.product.name}${i.product.sourceNote ? ` — ${i.product.sourceNote}` : ""}`}
              </Bullet>
            ))}
          </View>
        )}
        <Footer cafeName={cafeName} generatedOn={generatedOn} />
      </Page>

      {/* ---------- 3. wall sign ---------- */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>Section 3 · print and post</Text>
        <View style={s.wallBox}>
          <Text style={s.wallTitle}>Safety data{"\n"}sheets are here</Text>
          <Text style={s.wallBody}>
            Every hazardous product used in this workplace has a safety data sheet.{"\n"}
            You have the right to read them at any time. Ask any staff member.
          </Text>
          <Text style={[s.wallBody, { fontSize: 12, marginTop: 24, color: c.muted }]}>
            Kept at: ______________________________________________
          </Text>
          <Text style={[s.wallBody, { fontSize: 12, marginTop: 6, color: c.muted }]}>
            Supervisor: ___________________________________________
          </Text>
        </View>
        <Text style={[s.muted, { marginTop: 22, fontSize: 8, textAlign: "center" }]}>
          Post this where the products are stored. Fill in where the binder lives and who to ask.
        </Text>
        <Footer cafeName={cafeName} generatedOn={generatedOn} />
      </Page>

      {/* ---------- 4. safe work procedures ---------- */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>Section 4</Text>
        <Text style={s.h2}>Safe work procedures</Text>
        <Text style={[s.p, s.muted]}>
          Written around the hazards of an espresso bar. Adapt them to your site — the wording matters less than
          whether your staff have actually been shown each one.
        </Text>
        {CAFE_HAZARDS.map((h) => (
          <View key={h.id} style={[s.card, { marginBottom: 9 }]} wrap={false}>
            <Text style={s.h3}>{h.title}</Text>
            <Text style={[s.muted, { marginBottom: 5 }]}>{h.risk}</Text>
            {h.controls.map((ct) => <Bullet key={ct}>{ct}</Bullet>)}
          </View>
        ))}
        <Footer cafeName={cafeName} generatedOn={generatedOn} />
      </Page>

      {/* ---------- 5. orientation ---------- */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>Section 5</Text>
        <Text style={s.h2}>New and young worker orientation</Text>
        <Text style={[s.p, s.muted]}>
          WorkSafeBC requires a documented orientation before a new or young worker starts, covering the three topics
          below, and requires you to keep the record. Walk through each point, then complete the record overleaf.
        </Text>
        {ORIENTATION_TOPICS.map((t, i) => (
          <View key={t.id} style={[s.card, { marginBottom: 9 }]} wrap={false}>
            <Text style={s.h3}>{`${i + 1}. ${t.title}`}</Text>
            {t.points.map((p) => <Bullet key={p}>{p}</Bullet>)}
          </View>
        ))}
        <View style={s.callout}>
          <Text style={s.h3}>Site-specific hazards to walk through</Text>
          <Text>{CAFE_HAZARDS.map((h) => h.title).join(" · ")}</Text>
        </View>
        <Footer cafeName={cafeName} generatedOn={generatedOn} />
      </Page>

      {/* ---------- 6. orientation record ---------- */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>Section 6</Text>
        <Text style={s.h2}>Orientation record and sign-off</Text>
        <Text style={[s.p, s.muted]}>
          Complete one per worker and keep it in their file. This is the record an inspector asks for.
        </Text>
        <View style={{ marginBottom: 14 }}>
          {[["Worker name", "Start date"], ["Position", "Date of birth (if under 19)"], ["Supervisor", "Orientation date"]].map(([a, b]) => (
            <View key={a} style={{ flexDirection: "row", gap: 18, marginBottom: 12 }}>
              <View style={{ flex: 1 }}><View style={s.blank} /><Text style={s.signLabel}>{a}</Text></View>
              <View style={{ flex: 1 }}><View style={s.blank} /><Text style={s.signLabel}>{b}</Text></View>
            </View>
          ))}
        </View>
        <Text style={s.h3}>Covered in this orientation</Text>
        {ORIENTATION_TOPICS.flatMap((t) => t.points).map((p) => (
          <View key={p} style={[s.row, { paddingVertical: 5 }]} wrap={false}>
            <Text style={{ width: 22 }}>☐</Text>
            <Text style={{ flex: 1 }}>{p}</Text>
          </View>
        ))}
        <Text style={[s.h3, { marginTop: 12 }]}>Site hazards shown</Text>
        {CAFE_HAZARDS.map((h) => (
          <View key={h.id} style={[s.row, { paddingVertical: 5 }]} wrap={false}>
            <Text style={{ width: 22 }}>☐</Text>
            <Text style={{ flex: 1 }}>{h.title}</Text>
          </View>
        ))}
        <View style={s.signRow}>
          <View style={{ flex: 1 }}><View style={s.signBox} /><Text style={s.signLabel}>Worker signature</Text></View>
          <View style={{ flex: 1 }}><View style={s.signBox} /><Text style={s.signLabel}>Supervisor signature</Text></View>
        </View>
        <Footer cafeName={cafeName} generatedOn={generatedOn} />
      </Page>

      {/* ---------- 7. incident report ---------- */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>Section 7</Text>
        <Text style={s.h2}>Incident report</Text>
        <Text style={[s.p, s.muted]}>
          Complete for every injury, near miss or incident, however minor. A near miss recorded today is the injury
          you don&apos;t have next month.
        </Text>
        {[["Date and time of incident", "Reported to"], ["Injured or involved person", "Position"], ["Location in the premises", "Witnesses"]].map(([a, b]) => (
          <View key={a} style={{ flexDirection: "row", gap: 18, marginBottom: 12 }}>
            <View style={{ flex: 1 }}><View style={s.blank} /><Text style={s.signLabel}>{a}</Text></View>
            <View style={{ flex: 1 }}><View style={s.blank} /><Text style={s.signLabel}>{b}</Text></View>
          </View>
        ))}
        {[
          "What happened? (describe the sequence of events)",
          "What was the cause? (what allowed it to happen)",
          "First aid or treatment given",
          "What will prevent it happening again? (and by when, and who)",
        ].map((label) => (
          <View key={label} style={{ marginBottom: 14 }}>
            <Text style={s.h3}>{label}</Text>
            <View style={s.blank} /><View style={s.blank} /><View style={s.blank} />
          </View>
        ))}
        <View style={s.signRow}>
          <View style={{ flex: 1 }}><View style={s.signBox} /><Text style={s.signLabel}>Completed by</Text></View>
          <View style={{ flex: 1 }}><View style={s.signBox} /><Text style={s.signLabel}>Date</Text></View>
        </View>
        <Footer cafeName={cafeName} generatedOn={generatedOn} />
      </Page>

      {/* ---------- 8. inspection checklist ---------- */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>Section 8</Text>
        <Text style={s.h2}>Monthly safety inspection</Text>
        <Text style={[s.p, s.muted]}>Walk the shop with this once a month. Keep the completed sheets.</Text>
        <View style={{ flexDirection: "row", gap: 18, marginBottom: 12 }}>
          <View style={{ flex: 1 }}><View style={s.blank} /><Text style={s.signLabel}>Inspected by</Text></View>
          <View style={{ flex: 1 }}><View style={s.blank} /><Text style={s.signLabel}>Date</Text></View>
        </View>
        <View style={s.rowHead}>
          <Text style={[s.th, { flex: 1 }]}>Item</Text>
          <Text style={[s.th, { width: 40, textAlign: "center" }]}>OK</Text>
          <Text style={[s.th, { width: 40, textAlign: "center" }]}>Fix</Text>
          <Text style={[s.th, { width: 130 }]}>Action / by when</Text>
        </View>
        {[
          "Safety data sheets present and reachable by staff",
          "All decanted containers carry a workplace label",
          "Chemicals stored separately; nothing stored above food",
          "Eyewash accessible and unobstructed",
          "First aid kit stocked and in date",
          "Floors dry; mats flat and in good condition",
          "Walkways and exits clear",
          "Fire extinguisher in place, tagged, in date",
          "Steam wand and hot water tap working correctly",
          "Knives stored safely and in good condition",
          "Electrical cords and plugs undamaged",
          "Ladder or step stool available and sound",
          "Staff trained on any new product or equipment",
          "Incident reports from the last month reviewed and closed",
        ].map((item) => (
          <View key={item} style={s.row} wrap={false}>
            <Text style={{ flex: 1 }}>{item}</Text>
            <Text style={{ width: 40, textAlign: "center" }}>☐</Text>
            <Text style={{ width: 40, textAlign: "center" }}>☐</Text>
            <View style={{ width: 130, borderBottom: `0.5 solid ${c.line}` }} />
          </View>
        ))}
        <Footer cafeName={cafeName} generatedOn={generatedOn} />
      </Page>
    </Document>
  );
}

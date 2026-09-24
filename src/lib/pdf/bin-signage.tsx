import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as s, pdfColors as c } from "./theme";
import { DocFooter, Bullet } from "./doc-parts";
import { regionalProgramme, type Municipality } from "@/lib/compliance/municipalities";
import { CERT } from "@/lib/certs";

export type BinSignageProps = { cafeName: string; municipality: Municipality; generatedOn: string };

/**
 * Back-of-house poster plus customer-facing decals.
 *
 * The signage states what the cup IS and where it should go. It does not claim the municipal
 * organics programme accepts it — in the CRD it does not, and saying otherwise would be a
 * greenwashing exposure for us as much as for the café.
 */
export function BinSignagePdf({ cafeName, municipality, generatedOn }: BinSignageProps) {
  const title = "Bin signage";
  return (
    <Document title={`${title} — ${cafeName}`} author="Cup Casa Inc.">
      {/* back of house */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>Back of house · print and post</Text>
        <Text style={s.h1}>Where things go</Text>
        <Text style={s.muted}>{`${cafeName} · ${municipality.name}`}</Text>
        <View style={s.divider} />

        <View style={{ border: `2 solid ${c.ink}`, padding: 18, marginBottom: 14 }}>
          <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: c.leaf, marginBottom: 6 }}>
            Cup Casa cups → compost
          </Text>
          <Text style={{ fontSize: 11, marginBottom: 8 }}>
            {`Paper with a PHA lining. Certified home compostable (DIN CERTCO ${CERT.number}). Cup and lid both go in the in-store compost or a backyard/worm bin.`}
          </Text>
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: c.coral }}>
            Not the green bin. Not the blue bin.
          </Text>
        </View>

        <View style={s.callout}>
          <Text style={s.h3}>Why not the green bin?</Text>
          <Text>{regionalProgramme.note}</Text>
          <Text style={[s.muted, { fontSize: 8, marginTop: 6 }]}>
            {`Check the current list: ${regionalProgramme.url}`}
          </Text>
        </View>

        <Text style={s.h2}>Everything else</Text>
        <View style={s.rowHead}>
          <Text style={[s.th, { flex: 1 }]}>Item</Text>
          <Text style={[s.th, { width: 150 }]}>Where</Text>
        </View>
        {[
          ["Food scraps, coffee grounds, filters", "Organics / green bin"],
          ["Soiled paper napkins", "Organics / green bin"],
          ["Milk cartons, rinsed", "Recycling"],
          ["Clean cardboard", "Recycling"],
          ["Cup Casa cups and lids", "Compost — in-store or backyard"],
          ["Other brands' lined cups", "Garbage"],
          ["Plastic-lined or PLA cups", "Garbage"],
          ["Cling film, gloves, wrappers", "Garbage"],
        ].map(([item, where]) => (
          <View key={item} style={s.row} wrap={false}>
            <Text style={{ flex: 1 }}>{item}</Text>
            <Text style={[s.bold, { width: 150 }]}>{where}</Text>
          </View>
        ))}

        <Text style={[s.muted, { fontSize: 8, marginTop: 12 }]}>
          {`${municipality.name}'s own programme: ${municipality.url}. Rules change — re-check yearly.`}
        </Text>
        <DocFooter title={title} cafeName={cafeName} generatedOn={generatedOn} kind="signage" />
      </Page>

      {/* customer-facing decals */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>Customer facing · cut out and stick on the bins</Text>
        <Text style={[s.muted, { marginBottom: 14 }]}>
          Sized for a standard bin opening. Print on adhesive stock or laminate and tape.
        </Text>
        {[
          { head: "COMPOST", sub: "Cups, lids, food scraps, napkins", tone: c.leaf },
          { head: "RECYCLING", sub: "Cartons and clean cardboard only. No cups.", tone: c.ink },
          { head: "GARBAGE", sub: "Everything else", tone: c.muted },
        ].map((d) => (
          <View key={d.head} style={{ border: `2 solid ${d.tone}`, padding: 16, marginBottom: 12 }} wrap={false}>
            <Text style={{ fontSize: 30, fontFamily: "Helvetica-Bold", color: d.tone, textAlign: "center" }}>{d.head}</Text>
            <Text style={{ fontSize: 12, textAlign: "center", marginTop: 6 }}>{d.sub}</Text>
            {d.head === "COMPOST" && (
              <Text style={{ fontSize: 9, textAlign: "center", marginTop: 6, color: c.muted }}>
                Our cups are certified home compostable — they belong here.
              </Text>
            )}
          </View>
        ))}
        <DocFooter title={title} cafeName={cafeName} generatedOn={generatedOn} kind="signage" />
      </Page>

      {/* staff briefing */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.eyebrow}>For your staff</Text>
        <Text style={s.h2}>What to tell a customer who asks</Text>
        <View style={s.good}>
          <Text style={s.h3}>The short answer</Text>
          <Text>
            &quot;It&apos;s lined with PHA instead of plastic, so it composts at home — no industrial facility needed.
            Pop it in our compost bin.&quot;
          </Text>
        </View>
        <Text style={[s.h3, { marginTop: 10 }]}>If they push further</Text>
        <Bullet>It is paper with a PHA lining. PHA is made by microbes from plant oils.</Bullet>
        <Bullet>{`It is certified home compostable by DIN CERTCO, part of the TÜV Rheinland group — certificate ${CERT.number}.`}</Bullet>
        <Bullet>There is no polyethylene and no PLA in it, so nothing fragments into microplastics.</Bullet>
        <Bullet>It does not go in the blue bin — cups of any kind contaminate paper recycling.</Bullet>
        <Bullet>It does not go in the municipal green bin here, because that programme is for food scraps and soiled paper.</Bullet>

        <View style={[s.callout, { marginTop: 12 }]}>
          <Text style={s.h3}>What not to say</Text>
          <Bullet>Don&apos;t say &quot;biodegradable&quot; on its own — it means nothing without conditions.</Bullet>
          <Bullet>Don&apos;t say the café is zero waste or plastic free on the strength of the cup.</Bullet>
          <Bullet>Don&apos;t promise it disappears in the ocean or in landfill.</Bullet>
        </View>
        <DocFooter title={title} cafeName={cafeName} generatedOn={generatedOn} kind="signage" />
      </Page>
    </Document>
  );
}

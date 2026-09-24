import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { DIELINES, mm } from "@/lib/brand/dielines";
import { CERT } from "@/lib/certs";

/**
 * Print-ready pieces at the supplier's exact trim, with bleed and crop marks.
 * Artwork is generated as vector/PDF, never rasterised — see docs/SPEC.md, "Print-ready artwork".
 */
export type PrintInput = {
  cafeName: string;
  tagline?: string;
  primary: string;
  secondary: string;
  logoPng: string | null;
  piece: "window-decal" | "till-card" | "a-frame";
};

const readable = (hex: string) => {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2) || "0", 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#1a1a1a" : "#ffffff";
};

/** L-shaped crop marks just outside the trim box. */
function CropMarks({ bleedPt, widthPt, heightPt }: { bleedPt: number; widthPt: number; heightPt: number }) {
  const len = 14, off = 4;
  const corners = [
    { top: bleedPt - off - len, left: bleedPt, v: true }, { top: bleedPt, left: bleedPt - off - len, v: false },
    { top: bleedPt - off - len, left: bleedPt + widthPt, v: true }, { top: bleedPt, left: bleedPt + widthPt + off, v: false },
    { top: bleedPt + heightPt + off, left: bleedPt, v: true }, { top: bleedPt + heightPt, left: bleedPt - off - len, v: false },
    { top: bleedPt + heightPt + off, left: bleedPt + widthPt, v: true }, { top: bleedPt + heightPt, left: bleedPt + widthPt + off, v: false },
  ];
  return (
    <>
      {corners.map((c, i) => (
        <View key={i} style={{ position: "absolute", top: c.top, left: c.left, width: c.v ? 0.5 : len, height: c.v ? len : 0.5, backgroundColor: "#000" }} />
      ))}
    </>
  );
}

export function BrandPrintPdf(input: PrintInput) {
  const d = DIELINES[input.piece];
  const bleedPt = mm(d.bleed), wPt = mm(d.trim.width), hPt = mm(d.trim.height), safePt = mm(d.safeArea);
  const fg = readable(input.primary);

  return (
    <Document title={`${d.label} — ${input.cafeName}`} author="Cup Casa Inc.">
      <Page size={{ width: wPt + bleedPt * 2, height: hPt + bleedPt * 2 }} style={{ position: "relative" }}>
        {/* bleed ground */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: input.primary }} />
        <View style={{ position: "absolute", top: bleedPt, left: bleedPt, width: wPt, height: hPt, padding: safePt, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {input.piece === "window-decal" && (
            <View style={{ alignItems: "center" }}>
              {input.logoPng && <Image src={input.logoPng} style={{ width: wPt * 0.42, height: wPt * 0.24, objectFit: "contain", marginBottom: mm(6) }} />}
              <Text style={{ fontSize: 17, fontFamily: "Helvetica-Bold", color: fg, textAlign: "center", lineHeight: 1.15 }}>
                Our cups compost{"\n"}at home
              </Text>
              <Text style={{ fontSize: 8, color: fg, opacity: 0.85, textAlign: "center", marginTop: mm(4), lineHeight: 1.4 }}>
                {`Paper with a PHA lining. No PE, no PLA,\nno microplastics. DIN CERTCO ${CERT.number}.`}
              </Text>
            </View>
          )}

          {input.piece === "till-card" && (
            <View style={{ flex: 1, justifyContent: "space-between" }}>
              <View>
                {input.logoPng && <Image src={input.logoPng} style={{ width: mm(28), height: mm(16), objectFit: "contain", marginBottom: mm(5) }} />}
                <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: fg, lineHeight: 1.2 }}>
                  This cup{"\n"}composts at home.
                </Text>
                <Text style={{ fontSize: 7.5, color: fg, opacity: 0.85, marginTop: mm(4), lineHeight: 1.5 }}>
                  It&apos;s paper lined with PHA — a material microbes make from plants — instead of plastic. No PE,
                  no PLA, no microplastics.
                </Text>
              </View>
              <Text style={{ fontSize: 6.5, color: fg, opacity: 0.7 }}>
                {`${input.cafeName} · DIN CERTCO ${CERT.number}`}
              </Text>
              {/* fold line at the half */}
              <View style={{ position: "absolute", top: hPt / 2 - safePt, left: -safePt, right: -safePt, height: 0.4, backgroundColor: fg, opacity: 0.25 }} />
            </View>
          )}

          {input.piece === "a-frame" && (
            <View style={{ flex: 1, justifyContent: "center" }}>
              {input.logoPng && <Image src={input.logoPng} style={{ width: mm(90), height: mm(50), objectFit: "contain", marginBottom: mm(24) }} />}
              <Text style={{ fontSize: 62, fontFamily: "Helvetica-Bold", color: fg, lineHeight: 1.03 }}>
                Our cups{"\n"}compost{"\n"}at home.
              </Text>
              <Text style={{ fontSize: 17, color: fg, opacity: 0.88, marginTop: mm(14), lineHeight: 1.45 }}>
                {input.tagline || "Paper lined with PHA instead of plastic. No PE, no PLA, no microplastics — certified home compostable."}
              </Text>
              <Text style={{ fontSize: 11, color: fg, opacity: 0.7, marginTop: mm(20) }}>
                {`${input.cafeName} · DIN CERTCO ${CERT.number}`}
              </Text>
            </View>
          )}
        </View>
        <CropMarks bleedPt={bleedPt} widthPt={wPt} heightPt={hPt} />
      </Page>
    </Document>
  );
}

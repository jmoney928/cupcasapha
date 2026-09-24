import { StyleSheet } from "@react-pdf/renderer";

/** Shared look for every generated document, so a café's binder, signage and audit match. */
export const pdfColors = {
  ink: "#2b1d14", text: "#3a2e26", muted: "#6f625a",
  coral: "#e8735c", gold: "#a8753f", line: "#d9cec2", tint: "#f5efe6",
  leaf: "#2e4a38",
};

const c = pdfColors;

export const pdfStyles = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 52, paddingHorizontal: 46, fontSize: 9.5, color: c.text, fontFamily: "Helvetica", lineHeight: 1.45 },
  eyebrow: { fontSize: 7.5, letterSpacing: 1.5, color: c.gold, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 6 },
  h1: { fontSize: 24, color: c.ink, fontFamily: "Helvetica-Bold", marginBottom: 4, lineHeight: 1.1 },
  h2: { fontSize: 14, color: c.ink, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  h3: { fontSize: 10.5, color: c.ink, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  p: { marginBottom: 7 },
  muted: { color: c.muted },
  bold: { fontFamily: "Helvetica-Bold", color: c.ink },
  divider: { borderBottom: `1 solid ${c.ink}`, marginTop: 8, marginBottom: 14 },
  card: { backgroundColor: c.tint, padding: 12, marginBottom: 10 },
  callout: { borderLeft: `3 solid ${c.coral}`, backgroundColor: c.tint, padding: 12, marginBottom: 12 },
  good: { borderLeft: `3 solid ${c.leaf}`, backgroundColor: c.tint, padding: 12, marginBottom: 10 },
  rowHead: { flexDirection: "row", paddingBottom: 5, borderBottom: `1 solid ${c.ink}` },
  row: { flexDirection: "row", paddingVertical: 6, borderBottom: `0.5 solid ${c.line}` },
  th: { fontSize: 7.5, letterSpacing: 1, color: c.muted, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  bullet: { flexDirection: "row", marginBottom: 3 },
  dot: { width: 10, color: c.coral },
  footer: { position: "absolute", bottom: 26, left: 46, right: 46, fontSize: 6.8, color: c.muted, borderTop: `0.5 solid ${c.line}`, paddingTop: 6, lineHeight: 1.4 },
  blank: { borderBottom: `0.5 solid ${c.line}`, height: 20 },
  signBox: { flex: 1, borderBottom: `0.75 solid ${c.ink}`, height: 26 },
  signLabel: { fontSize: 7.5, color: c.muted, marginTop: 3 },
});

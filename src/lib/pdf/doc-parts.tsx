import { Text, View } from "@react-pdf/renderer";
import { pdfStyles as s } from "./theme";
import { DISCLAIMERS, type DisclaimerKind } from "@/lib/compliance/disclaimer";

export const DocFooter = ({ title, cafeName, generatedOn, kind }: { title: string; cafeName: string; generatedOn: string; kind: DisclaimerKind }) => (
  <Text style={s.footer} fixed>
    {`${cafeName} · ${title} · generated ${generatedOn} by Cup Casa. ${DISCLAIMERS[kind]}`}
  </Text>
);

export const Bullet = ({ children, marker = "•" }: { children: string; marker?: string }) => (
  <View style={s.bullet}>
    <Text style={s.dot}>{marker}</Text>
    <Text style={{ flex: 1 }}>{children}</Text>
  </View>
);

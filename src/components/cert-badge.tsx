import Image from "next/image";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { CERT } from "@/lib/certs";

/**
 * "Certified home compostable · DIN CERTCO 9P0326". Plain text until CERT.entryUrl is set, then a link
 * to the public register. Shows the DIN-Geprüft mark once CERT.logoSrc is set; a shield icon until then.
 */
export function CertBadge({ variant = "light", size = "md" }: { variant?: "light" | "dark"; size?: "sm" | "md" }) {
  const tone = variant === "dark" ? "bg-cream/10 text-cream border-cream/15" : "bg-leaf/10 text-leaf border-leaf/20";
  const pad = size === "sm" ? "px-3 py-1.5 text-xs gap-2" : "px-4 py-2.5 text-sm gap-3";
  const icon = size === "sm" ? 16 : 22;
  const cls = `inline-flex items-center rounded-full border font-bold ${tone} ${pad}`;
  const inner = (
    <>
      {CERT.logoSrc ? (
        <Image src={CERT.logoSrc} alt="DIN-Geprüft Home Compostable" width={icon * 2} height={icon} className="h-5 w-auto" />
      ) : (
        <ShieldCheck style={{ width: icon, height: icon }} className="shrink-0" />
      )}
      <span>
        {CERT.title} · DIN CERTCO <span className="tabular-nums">{CERT.number}</span>
      </span>
      {CERT.entryUrl && <ExternalLink className="w-3.5 h-3.5 opacity-60" aria-hidden />}
    </>
  );
  if (!CERT.entryUrl) return <span className={cls}>{inner}</span>;
  return (
    <a href={CERT.entryUrl} target="_blank" rel="noopener noreferrer" className={`${cls} hover:opacity-90`} title={`Verify certificate ${CERT.number} on the public DIN CERTCO register`}>
      {inner}
    </a>
  );
}

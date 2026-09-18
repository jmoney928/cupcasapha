import Image from "next/image";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { CERT, certVerifyUrl } from "@/lib/certs";

/**
 * "Certified home compostable — DIN CERTCO 9P0326", linked to the public register.
 * Shows the DIN-Geprüft mark once CERT.logoSrc is set; a shield icon stands in until then.
 */
export function CertBadge({ variant = "light", size = "md" }: { variant?: "light" | "dark"; size?: "sm" | "md" }) {
  const tone = variant === "dark" ? "bg-cream/10 text-cream border-cream/15" : "bg-leaf/10 text-leaf border-leaf/20";
  const pad = size === "sm" ? "px-3 py-1.5 text-xs gap-2" : "px-4 py-2.5 text-sm gap-3";
  const icon = size === "sm" ? 16 : 22;
  return (
    <a
      href={certVerifyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center rounded-full border font-bold ${tone} ${pad} hover:opacity-90`}
      title={`Verify certificate ${CERT.number} on the public DIN CERTCO register`}
    >
      {CERT.logoSrc ? (
        <Image src={CERT.logoSrc} alt="DIN-Geprüft Home Compostable" width={icon * 2} height={icon} className="h-5 w-auto" />
      ) : (
        <ShieldCheck style={{ width: icon, height: icon }} className="shrink-0" />
      )}
      <span>
        {CERT.title} · DIN CERTCO <span className="tabular-nums">{CERT.number}</span>
      </span>
      <ExternalLink className="w-3.5 h-3.5 opacity-60" aria-hidden />
    </a>
  );
}

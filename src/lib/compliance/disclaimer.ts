/**
 * Every generated compliance page carries this. We supply templates and an index, never
 * certification or advice — see docs/SPEC.md, "Risks, review and disclaimers".
 */
export const COMPLIANCE_DISCLAIMER =
  "Template for your use. Verify against current WorkSafeBC requirements and your suppliers' current safety data sheets. Cup Casa does not certify your workplace.";

/** Each document carries the caveat that actually applies to it. */
export const DISCLAIMERS = {
  binder: COMPLIANCE_DISCLAIMER,
  claims:
    "Template for your use, not legal advice. Our certification substantiates claims about the cup only — not about your café, your waste stream or your other packaging. Verify any claim you make against the Competition Act's requirements before you publish it.",
  signage:
    "Template for your use. Municipal and regional collection rules change — check your municipality's current programme before printing at scale. Cup Casa does not certify your waste stream.",
  audit:
    "Template for your use, not an inspection and not a substitute for the BC Food Premises Regulation or your own food safety plan. Cup Casa does not certify your premises.",
} as const;
export type DisclaimerKind = keyof typeof DISCLAIMERS;

/** Shown wherever content has not yet been through its review pass. */
export const REVIEW_PENDING_NOTE =
  "This template is awaiting its independent review by a BC safety consultant. Use it as a starting point and check it against WorkSafeBC's own guidance.";

export const WORKSAFE_SOURCES = [
  { label: "WorkSafeBC — WHMIS 2015", url: "https://www.worksafebc.com/en/health-safety/hazards-exposures/whmis/whmis-2015" },
  { label: "WorkSafeBC — Training and orienting workers", url: "https://www.worksafebc.com/en/health-safety/create-manage/training-orientation" },
] as const;

/**
 * Every generated compliance page carries this. We supply templates and an index, never
 * certification or advice — see docs/SPEC.md, "Risks, review and disclaimers".
 */
export const COMPLIANCE_DISCLAIMER =
  "Template for your use. Verify against current WorkSafeBC requirements and your suppliers' current safety data sheets. Cup Casa does not certify your workplace.";

/** Shown wherever content has not yet been through its review pass. */
export const REVIEW_PENDING_NOTE =
  "This template is awaiting its independent review by a BC safety consultant. Use it as a starting point and check it against WorkSafeBC's own guidance.";

export const WORKSAFE_SOURCES = [
  { label: "WorkSafeBC — WHMIS 2015", url: "https://www.worksafebc.com/en/health-safety/hazards-exposures/whmis/whmis-2015" },
  { label: "WorkSafeBC — Training and orienting workers", url: "https://www.worksafebc.com/en/health-safety/create-manage/training-orientation" },
] as const;

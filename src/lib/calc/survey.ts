/**
 * Primary research behind the calculator's proof block. These figures appear in front of café
 * owners and in the emailed PDF, so they live in one place with their method note attached.
 * See docs/SPEC.md, "The proof block".
 */
export const SURVEY = {
  respondents: 167,
  agreed: 163,
  place: "Victoria's Inner Harbour",
  when: "summer 2026",
  question: "Would you pay $0.15 more for a coffee in a cup with no microplastics that composts at home?",
  results: [
    { label: "No microplastics", pct: 87 },
    { label: "Home compostable", pct: 90 },
    { label: "Both", pct: 98 },
  ],
  instagram: "https://instagram.com/cup_casa",
  method: "167 coffee drinkers, street survey, Victoria Inner Harbour, summer 2026. Respondents were asked in person; interview videos are on our Instagram.",
} as const;

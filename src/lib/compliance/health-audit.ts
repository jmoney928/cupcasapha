/**
 * Pre-inspection self-audit for a BC food premises, structured as the walk-round an operator can
 * do with a clipboard. Regional specificity is the whole value — this is built around Island Health
 * inspections under the BC Food Premises Regulation, not a generic Canadian checklist.
 *
 * ⚠️ Awaiting its review pass. A starting point, not a substitute for the regulation.
 */
export type AuditSection = { id: string; title: string; items: string[] };

export const HEALTH_AUDIT: AuditSection[] = [
  {
    id: "temperatures",
    title: "Temperatures and logs",
    items: [
      "Fridges holding at 4°C or below; freezers at −18°C or below",
      "Thermometer in every unit, and one probe thermometer available",
      "Temperature log completed daily and kept on file",
      "Milk is dated and rotated; nothing past its date in service",
      "Hot-held items above 60°C, if you hot-hold anything",
    ],
  },
  {
    id: "handwashing",
    title: "Handwashing",
    items: [
      "Handwash sink accessible, not blocked, not used for anything else",
      "Hot and cold running water at the handwash sink",
      "Liquid soap and single-use towels stocked",
      "Handwashing sign posted",
    ],
  },
  {
    id: "sanitizing",
    title: "Sanitizing and warewashing",
    items: [
      "Sanitizer at the correct concentration, and test strips on hand",
      "Sanitizer buckets changed through the shift, cloths stored in solution",
      "Dish machine reaching its required wash and rinse temperature, or chemical dose correct",
      "Two- or three-compartment sink set up correctly if washing by hand",
    ],
  },
  {
    id: "storage",
    title: "Food storage and separation",
    items: [
      "Everything stored off the floor, on shelving",
      "Raw and ready-to-eat kept separate",
      "Open product covered, labelled and dated",
      "Allergen-containing items stored so they cannot cross-contaminate",
      "Chemicals stored away from and below food and packaging",
    ],
  },
  {
    id: "surfaces",
    title: "Surfaces, equipment and premises",
    items: [
      "Food contact surfaces clean and in good repair",
      "Espresso machine, grinder and milk lines cleaned on schedule",
      "No chipped or cracked crockery in service",
      "Floors, walls and ceilings cleanable and intact",
      "Garbage and organics containers covered and emptied",
    ],
  },
  {
    id: "pests",
    title: "Pest control",
    items: [
      "No evidence of pests (droppings, gnaw marks, insects)",
      "Doors and windows screened or sealed",
      "Pest control records available if you use a contractor",
    ],
  },
  {
    id: "staff",
    title: "Staff and documentation",
    items: [
      "At least one FOODSAFE-certified person on shift, certificate current",
      "Staff illness policy understood — no one working while symptomatic",
      "Clean clothing, hair restrained, no eating or drinking in prep areas",
      "Food safety plan and sanitation plan written and available",
      "Current health operating permit displayed",
      "Previous inspection report available, and any items from it closed out",
    ],
  },
];

export const HEALTH_SOURCES = [
  { label: "BC Food Premises Regulation", url: "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/11_210_99" },
  { label: "Island Health — food safety", url: "https://www.islandhealth.ca/learn-about-health/food-safety" },
] as const;

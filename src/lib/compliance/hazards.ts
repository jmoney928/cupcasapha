/**
 * The hazards a café actually has, for the young-worker orientation pack and the safe-work
 * procedures. Written around espresso bars, not generic industrial boilerplate.
 * See docs/SPEC.md, "Safety procedures".
 */
export type Hazard = { id: string; title: string; risk: string; controls: string[] };

export const CAFE_HAZARDS: Hazard[] = [
  {
    id: "burns",
    title: "Burns and scalds",
    risk: "Steam wands, hot water taps, milk jugs and the group head all reach temperatures that burn skin instantly.",
    controls: [
      "Purge the steam wand away from your body, into the drip tray",
      "Never put a hand under the hot water tap to test temperature",
      "Carry one jug at a time; call out \"behind, hot\" when passing",
      "Run cool water over a burn for 20 minutes and report it, however small",
    ],
  },
  {
    id: "chemicals",
    title: "Chemical handling",
    risk: "Cleaners and descalers cause eye and skin damage, and mixing the wrong two produces toxic gas.",
    controls: [
      "Never mix products — especially bleach with descaler or sanitizer",
      "Dilute exactly as the label says; more is not better",
      "Wear gloves and eye protection when handling concentrate",
      "Label every decanted container with the product name and hazard",
      "Know where the safety data sheets and the eyewash are before you start",
    ],
  },
  {
    id: "slips",
    title: "Slips and trips",
    risk: "Milk, water and ice behind the bar make the busiest square metre in the shop the most slippery.",
    controls: [
      "Wear closed-toe, slip-resistant shoes",
      "Wipe spills immediately — don't wait for the lull",
      "Keep walkways and the path to the dish pit clear",
      "Use a wet-floor sign when mopping during service",
    ],
  },
  {
    id: "knives",
    title: "Knives and slicers",
    risk: "Food prep cuts are the most common reportable injury in a café kitchen.",
    controls: [
      "Cut on a stable board, away from the body",
      "Never try to catch a falling knife",
      "Carry knives point-down at your side",
      "Wash and store knives separately, never in a sink of water",
    ],
  },
  {
    id: "working-alone",
    title: "Working alone",
    risk: "Opening and closing shifts often mean one person on site, which changes how an injury or an incident plays out.",
    controls: [
      "Agree a check-in procedure and who is checking in with whom",
      "Keep the door locked outside trading hours",
      "Never handle cash in view of the street",
      "Know the escalation steps if someone becomes aggressive — your safety over the till",
    ],
  },
  {
    id: "manual-handling",
    title: "Lifting and manual handling",
    risk: "Milk crates, bean sacks and cup cases are lifted dozens of times a shift.",
    controls: [
      "Lift with the legs, load close to the body",
      "Split a heavy delivery rather than carrying it in one trip",
      "Use a trolley for anything over shoulder height or awkward",
    ],
  },
];

/** The three topics WorkSafeBC requires a new or young worker orientation to cover. */
export const ORIENTATION_TOPICS = [
  {
    id: "rights",
    title: "Rights and responsibilities",
    points: [
      "The right to know about hazards in the workplace",
      "The right to participate in health and safety",
      "The right to refuse unsafe work, without penalty",
      "Your responsibility to follow safe work procedures and report hazards",
      "Who your supervisor is, and how to reach them",
    ],
  },
  {
    id: "hazards",
    title: "Workplace hazards",
    points: [
      "The specific hazards on this site (see the hazard list in this pack)",
      "Where the safety data sheets are kept",
      "Where first aid supplies and the eyewash are",
      "How to report a hazard or a near miss",
    ],
  },
  {
    id: "procedures",
    title: "Safe work procedures",
    points: [
      "Safe operation of the espresso machine, grinder and steam wand",
      "Chemical dilution, storage and the products that must never be mixed",
      "Spill response and floor safety during service",
      "Emergency procedures: evacuation, first aid, incident reporting",
    ],
  },
] as const;

export type PRCategory = {
  value: string;
  label: string;
  description: string;
  icon: string;
};

export const PR_CATEGORIES: PRCategory[] = [
  {
    value: "ee-fsw",
    label: "EE - FSW",
    description: "Express Entry - Federal Skilled Worker (FSW)",
    icon: "🎯",
  },
  {
    value: "ee-fst",
    label: "EE - FST",
    description: "Express Entry - Federal Skilled Trades (FST)",
    icon: "🔧",
  },
  {
    value: "ee-cec",
    label: "EE - CEC",
    description: "Express Entry - Canadian Experience Class (CEC)",
    icon: "🍁",
  },
  {
    value: "non-ee",
    label: "Non-EE",
    description: "Non-Express Entry",
    icon: "🍁",
  },
  {
    value: "pnp",
    label: "PNP",
    description: "Provincial Nominee Program (PNP)",
    icon: "🏛️",
  },
  {
    value: "family-spousal",
    label: "Family - Spousal",
    description: "Family Sponsorship - Spousal/Partner",
    icon: "💑",
  },
  {
    value: "family-pgp",
    label: "Family - PGP",
    description: "Family Sponsorship - Parent & Grandparent",
    icon: "👨‍👩‍👧",
  },
  {
    value: "aip",
    label: "AIP",
    description: "Atlantic Immigration Program (AIP)",
    icon: "🌊",
  },
  {
    value: "rnip",
    label: "RNIP",
    description: "Rural & Northern Immigration Pilot (RNIP)",
    icon: "🌲",
  },
  {
    value: "caregiver",
    label: "Caregiver",
    description: "Caregiver Pathways",
    icon: "❤️",
  },
  {
    value: "startup",
    label: "Start-Up",
    description: "Start-Up Visa",
    icon: "🚀",
  },
  {
    value: "quebec",
    label: "Quebec",
    description: "Quebec Skilled Worker (CSQ)",
    icon: "⚜️",
  },
  {
    value: "self-employed",
    label: "Self-Employed",
    description: "Self-Employed Program",
    icon: "💼",
  },
  {
    value: "other",
    label: "Other",
    description: "Other",
    icon: "🌐",
  },
];

export const JOURNEY_STEPS: string[] = [];
export function buildGroupKey(..._args: unknown[]): string { return ""; }
export function getCategoryShortLabel(..._args: unknown[]): string { return ""; }
export function getCategoryLabel(..._args: unknown[]): string { return ""; }
export function formatStepDate(..._args: unknown[]): string { return ""; }
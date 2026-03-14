export type PRCategory = {
  value: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
};

export const PR_CATEGORIES: PRCategory[] = [
  {
    value: "ee-fsw",
    label: "EE - FSW",
    shortLabel: "FSW",
    description: "Express Entry - Federal Skilled Worker (FSW)",
    icon: "🎯",
  },
  {
    value: "ee-fst",
    label: "EE - FST",
    shortLabel: "FST",
    description: "Express Entry - Federal Skilled Trades (FST)",
    icon: "🔧",
  },
  {
    value: "ee-cec",
    label: "EE - CEC",
    shortLabel: "CEC",
    description: "Express Entry - Canadian Experience Class (CEC)",
    icon: "🍁",
  },
  {
    value: "non-ee",
    label: "Non-EE",
    shortLabel: "Non-EE",
    description: "Non-Express Entry",
    icon: "🍁",
  },
  {
    value: "pnp",
    label: "PNP",
    shortLabel: "PNP",
    description: "Provincial Nominee Program (PNP)",
    icon: "🏛️",
  },
  {
    value: "family-spousal",
    label: "Family - Spousal",
    shortLabel: "Spousal",
    description: "Family Sponsorship - Spousal/Partner",
    icon: "💑",
  },
  {
    value: "family-pgp",
    label: "Family - PGP",
    shortLabel: "PGP",
    description: "Family Sponsorship - Parent & Grandparent",
    icon: "👨‍👩‍👧",
  },
  {
    value: "aip",
    label: "AIP",
    shortLabel: "AIP",
    description: "Atlantic Immigration Program (AIP)",
    icon: "🌊",
  },
  {
    value: "rnip",
    label: "RNIP",
    shortLabel: "RNIP",
    description: "Rural & Northern Immigration Pilot (RNIP)",
    icon: "🌲",
  },
  {
    value: "caregiver",
    label: "Caregiver",
    shortLabel: "Caregiver",
    description: "Caregiver Pathways",
    icon: "❤️",
  },
  {
    value: "startup",
    label: "Start-Up",
    shortLabel: "Start-Up",
    description: "Start-Up Visa",
    icon: "🚀",
  },
  {
    value: "quebec",
    label: "Quebec",
    shortLabel: "Quebec",
    description: "Quebec Skilled Worker (CSQ)",
    icon: "⚜️",
  },
  {
    value: "self-employed",
    label: "Self-Employed",
    shortLabel: "Self-Employed",
    description: "Self-Employed Program",
    icon: "💼",
  },
  {
    value: "other",
    label: "Other",
    shortLabel: "Other",
    description: "Other",
    icon: "🌐",
  },
];

// --- Journey Steps ---
export const JOURNEY_STEPS: string[] = [];

// --- Group Key Helpers ---
export function buildGroupKey(category: string, month: string): string {
  return `${category}:${month}`;
}

export function getCategoryShortLabel(category: string): string {
  const cat = PR_CATEGORIES.find((c) => c.value === category);
  return cat?.shortLabel ?? category;
}

export function getCategoryLabel(category: string): string {
  const cat = PR_CATEGORIES.find((c) => c.value === category);
  return cat?.label ?? category;
}

export function formatStepDate(date: string): string {
  return date;
}
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
    label: "Federal Skilled Worker (FSW)",
    shortLabel: "FSW",
    description: "Express Entry - Federal Skilled Worker (FSW)",
    icon: "🎯",
  },
  {
    value: "ee-fst",
    label: "Federal Skilled Trades (FST)",
    shortLabel: "FST",
    description: "Express Entry - Federal Skilled Trades (FST)",
    icon: "🔧",
  },
  {
    value: "ee-cec",
    label: "Canadian Experience Class (CEC)",
    shortLabel: "CEC",
    description: "Express Entry - Canadian Experience Class (CEC)",
    icon: "🍁",
  },
  {
    value: "pnp",
    label: "Provincial Nominee Program (PNP)",
    shortLabel: "PNP",
    description: "Provincial Nominee Program (PNP)",
    icon: "🏛️",
  },
  {
    value: "family-spousal",
    label: "Spousal Sponsorship (Spousal)",
    shortLabel: "Spousal",
    description: "Family Sponsorship - Spousal/Partner",
    icon: "💍",
  },
  {
    value: "family-pgp",
    label: "Parent & Grandparent Sponsorship (PGP)",
    shortLabel: "PGP",
    description: "Family Sponsorship - Parent & Grandparent",
    icon: "👨‍👩‍👧",
  },
  {
    value: "aip",
    label: "Atlantic Immigration Program (AIP)",
    shortLabel: "AIP",
    description: "Atlantic Immigration Program (AIP)",
    icon: "🌊",
  },
  {
    value: "rnip",
    label: "Rural & Northern Immigration Pilot (RNIP)",
    shortLabel: "RNIP",
    description: "Rural & Northern Immigration Pilot (RNIP)",
    icon: "🌲",
  },
  {
    value: "caregiver",
    label: "Caregiver Pathways (Caregiver)",
    shortLabel: "Caregiver",
    description: "Caregiver Pathways",
    icon: "❤️",
  },
  {
    value: "startup",
    label: "Start-Up Visa (Start-Up)",
    shortLabel: "Start-Up",
    description: "Start-Up Visa",
    icon: "🚀",
  },
  {
    value: "quebec",
    label: "Quebec Skilled Worker (Quebec)",
    shortLabel: "Quebec",
    description: "Quebec Skilled Worker (CSQ)",
    icon: "⚜️",
  },
  {
    value: "self-employed",
    label: "Self-Employed Program (Self-Employed)",
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
export const JOURNEY_STEPS: string[] = [
  "AOR",
  "BIL Date",
  "ADR (If Any) / Return Date",
  "Biometrics Completed",
  "Medical Completed",
  "Medical Date (Outland)",
  "PVO (Inland)",
  "SVO (Inland)",
  "PAL",
  "Info Sharing",
  "Criminality",
  "Security",
  "Final Decision",
  "P1",
  "P2",
  "PPR",
  "ECOPR",
  "PR Card",
];

export const JOURNEY_STEP_EMOJIS: Record<string, string> = {
  "AOR": "📄",
  "BIL Date": "📋",
  "ADR (If Any) / Return Date": "📎",
  "Biometrics Completed": "🧬",
  "Medical Completed": "🩺",
  "Medical Date (Outland)": "🏥",
  "PVO (Inland)": "🔍",
  "SVO (Inland)": "📝",
  "PAL": "✈️",
  "Info Sharing": "🔗",
  "Criminality": "🔎",
  "Security": "🛡️",
  "Final Decision": "⚖️",
  "P1": "📨",
  "P2": "📩",
  "PPR": "@",
  "ECOPR": "🎉",
  "PR Card": "🏆",
};

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

/** Format a date string from "YYYY-MM-DD" to "dd.mm.yyyy". Returns the input unchanged for unrecognised formats. */
export function formatStepDate(date: string): string {
  const parts = date.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}.${month}.${year}`;
  }
  return date;
}
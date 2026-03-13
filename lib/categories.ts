export interface PRCategory {
  value: string;
  label: string;
  shortLabel: string;
}

export const PR_CATEGORIES: PRCategory[] = [
  { value: 'express-entry-fsw', label: 'Express Entry - Federal Skilled Worker (FSW)', shortLabel: 'EE - FSW' },
  { value: 'express-entry-fst', label: 'Express Entry - Federal Skilled Trades (FST)', shortLabel: 'EE - FST' },
  { value: 'express-entry-cec', label: 'Express Entry - Canadian Experience Class (CEC)', shortLabel: 'EE - CEC' },
  { value: 'pnp', label: 'Provincial Nominee Program (PNP)', shortLabel: 'PNP' },
  { value: 'family-spousal', label: 'Family Sponsorship - Spousal/Partner', shortLabel: 'Family - Spousal' },
  { value: 'family-parent', label: 'Family Sponsorship - Parent & Grandparent', shortLabel: 'Family - PGP' },
  { value: 'aip', label: 'Atlantic Immigration Program (AIP)', shortLabel: 'AIP' },
  { value: 'rnip', label: 'Rural & Northern Immigration Pilot (RNIP)', shortLabel: 'RNIP' },
  { value: 'caregiver', label: 'Caregiver Pathways', shortLabel: 'Caregiver' },
  { value: 'startup-visa', label: 'Start-Up Visa', shortLabel: 'Start-Up' },
  { value: 'quebec', label: 'Quebec Skilled Worker (CSQ)', shortLabel: 'Quebec' },
  { value: 'self-employed', label: 'Self-Employed Program', shortLabel: 'Self-Employed' },
  { value: 'other', label: 'Other', shortLabel: 'Other' },
];

export const JOURNEY_STEPS = [
  'Application Submitted',
  'AOR',
  'Biometrics',
  'Medical Exam',
  'Background Check',
  'PPR',
  'COPR',
  'Landing',
];

/** Returns the category label for a given value, or null */
export function getCategoryLabel(value: string): string | null {
  return PR_CATEGORIES.find((c) => c.value === value)?.label ?? null;
}

/** Returns the short label for a given value, or null */
export function getCategoryShortLabel(value: string): string | null {
  return PR_CATEGORIES.find((c) => c.value === value)?.shortLabel ?? null;
}

/** Build the group_month key for category-scoped chats: "category:month" */
export function buildGroupKey(category: string, month: string): string {
  return `${category}:${month}`;
}

/** Format a DATE string "yyyy-mm-dd" -> "dd.mm.yyyy" */
export function formatStepDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Pending';
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
}

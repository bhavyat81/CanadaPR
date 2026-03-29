export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface MonthOption {
  value: string;  // e.g., "2025-11"
  label: string;  // e.g., "November 2025"
}

/** Generate month options from January 2024 to December 2026 */
export const generateMonths = (): MonthOption[] => {
  const months: MonthOption[] = [];
  for (let year = 2024; year <= 2026; year++) {
    for (let month = 1; month <= 12; month++) {
      months.push({
        value: `${year}-${String(month).padStart(2, '0')}`,
        label: `${MONTH_NAMES[month - 1]} ${year}`,
      });
    }
  }
  return months;
};

/** Format "2025-11" -> "November 2025" */
export const formatMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
};
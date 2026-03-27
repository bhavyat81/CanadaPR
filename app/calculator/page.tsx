'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LatestDrawCard from '@/components/LatestDrawCard';

// ─── CRS Scoring Tables ───────────────────────────────────────────────────────

// Age points (no spouse)
const AGE_POINTS_NO_SPOUSE: Record<string, number> = {
  'under18': 0, '18': 99, '19': 105, '20': 110, '21': 110, '22': 119, '23': 123,
  '24': 128, '25': 133, '26': 138, '27': 138, '28': 133, '29': 128, '30': 119,
  '31': 114, '32': 109, '33': 104, '34': 99, '35': 94, '36': 89, '37': 84,
  '38': 79, '39': 74, '40': 69, '41': 64, '42': 59, '43': 54, '44': 50,
  '45plus': 0,
};

const AGE_POINTS_SPOUSE: Record<string, number> = {
  'under18': 0, '18': 90, '19': 95, '20': 97, '21': 97, '22': 99, '23': 101,
  '24': 103, '25': 105, '26': 107, '27': 107, '28': 105, '29': 103, '30': 101,
  '31': 99, '32': 97, '33': 95, '34': 93, '35': 91, '36': 89, '37': 87,
  '38': 85, '39': 83, '40': 81, '41': 79, '42': 77, '43': 75, '44': 73,
  '45plus': 0,
};

// Education points
const EDU_POINTS_NO_SPOUSE: Record<string, number> = {
  'none': 0, 'secondary': 30, 'one_year': 90, 'two_year': 98, 'bachelors': 120,
  'two_plus': 128, 'masters': 135, 'phd': 150,
};
const EDU_POINTS_SPOUSE: Record<string, number> = {
  'none': 0, 'secondary': 28, 'one_year': 84, 'two_year': 91, 'bachelors': 112,
  'two_plus': 119, 'masters': 126, 'phd': 140,
};

// CLB to points (first language, no spouse)
const CLB_FIRST_NO_SPOUSE: Record<number, number> = {
  4: 6, 5: 6, 6: 9, 7: 17, 8: 23, 9: 31, 10: 34,
};
const CLB_FIRST_SPOUSE: Record<number, number> = {
  4: 6, 5: 6, 6: 8, 7: 16, 8: 22, 9: 29, 10: 32,
};
// Second official language (per ability)
const CLB_SECOND: Record<number, number> = {
  5: 1, 6: 1, 7: 3, 8: 3, 9: 6, 10: 6,
};

// Canadian work experience (no spouse)
const CAN_EXP_NO_SPOUSE: Record<string, number> = {
  '0': 0, '1': 40, '2': 53, '3': 64, '4': 72, '5plus': 80,
};
const CAN_EXP_SPOUSE: Record<string, number> = {
  '0': 0, '1': 35, '2': 46, '3': 56, '4': 63, '5plus': 70,
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function clbScore(clb: number, tableNoSpouse: Record<number, number>): number {
  if (clb < 4) return 0;
  if (clb > 10) clb = 10;
  return tableNoSpouse[clb] ?? 0;
}

function calcLanguagePoints(
  speaking: number, listening: number, reading: number, writing: number,
  table: Record<number, number>
): number {
  return (
    clbScore(speaking, table) +
    clbScore(listening, table) +
    clbScore(reading, table) +
    clbScore(writing, table)
  );
}

function calcSecondLanguage(speaking: number, listening: number, reading: number, writing: number): number {
  const abilities = [speaking, listening, reading, writing];
  let total = 0;
  for (const clb of abilities) {
    if (clb < 5) continue;
    const capped = Math.min(clb, 10);
    total += CLB_SECOND[capped] ?? 0;
  }
  return Math.min(total, 22); // max 22 for second language
}

// ─── Component ────────────────────────────────────────────────────────────────

const AGE_OPTIONS = [
  { value: 'under18', label: 'Under 18' },
  ...Array.from({ length: 27 }, (_, i) => ({ value: String(18 + i), label: String(18 + i) })),
  { value: '45plus', label: '45 or older' },
];

const EDU_OPTIONS = [
  { value: 'none', label: 'Less than secondary / high school' },
  { value: 'secondary', label: 'Secondary diploma (high school graduation)' },
  { value: 'one_year', label: 'One-year degree, diploma or certificate' },
  { value: 'two_year', label: 'Two-year program (diploma or certificate)' },
  { value: 'bachelors', label: "Bachelor's degree (3+ years)" },
  { value: 'two_plus', label: 'Two or more certificates, diplomas, or degrees (one 3+ years)' },
  { value: 'masters', label: "Master's degree / professional degree" },
  { value: 'phd', label: 'PhD' },
];

const CLB_OPTIONS = Array.from({ length: 8 }, (_, i) => ({ value: i + 4, label: `CLB ${i + 4}` }));
const CLB_OPTIONS_SECOND = [{ value: 0, label: 'None / below CLB 5' }, ...Array.from({ length: 6 }, (_, i) => ({ value: i + 5, label: `CLB ${i + 5}` }))];

const CAN_EXP_OPTIONS = [
  { value: '0', label: 'None' },
  { value: '1', label: '1 year' },
  { value: '2', label: '2 years' },
  { value: '3', label: '3 years' },
  { value: '4', label: '4 years' },
  { value: '5plus', label: '5 years or more' },
];

interface FormState {
  hasSpouse: boolean;
  age: string;
  education: string;
  // First language (English or French)
  l1Speaking: number; l1Listening: number; l1Reading: number; l1Writing: number;
  // Second official language
  l2Speaking: number; l2Listening: number; l2Reading: number; l2Writing: number;
  // Canadian work experience
  canExp: string;
  // Spouse
  spouseEducation: string;
  spouseCanExp: string;
  spouseL1Speaking: number; spouseL1Listening: number; spouseL1Reading: number; spouseL1Writing: number;
}

const DEFAULT_FORM: FormState = {
  hasSpouse: false, age: '30', education: 'bachelors',
  l1Speaking: 7, l1Listening: 7, l1Reading: 7, l1Writing: 7,
  l2Speaking: 0, l2Listening: 0, l2Reading: 0, l2Writing: 0,
  canExp: '0',
  spouseEducation: 'bachelors', spouseCanExp: '0',
  spouseL1Speaking: 7, spouseL1Listening: 7, spouseL1Reading: 7, spouseL1Writing: 7,
};

function computeCRS(f: FormState): { total: number; breakdown: Record<string, number> } {
  const withSpouse = f.hasSpouse;

  const ageTable = withSpouse ? AGE_POINTS_SPOUSE : AGE_POINTS_NO_SPOUSE;
  const eduTable = withSpouse ? EDU_POINTS_SPOUSE : EDU_POINTS_NO_SPOUSE;
  const langTable = withSpouse ? CLB_FIRST_SPOUSE : CLB_FIRST_NO_SPOUSE;
  const expTable = withSpouse ? CAN_EXP_SPOUSE : CAN_EXP_NO_SPOUSE;

  const agePoints = ageTable[f.age] ?? 0;
  const eduPoints = eduTable[f.education] ?? 0;
  const langPoints = calcLanguagePoints(f.l1Speaking, f.l1Listening, f.l1Reading, f.l1Writing, langTable);
  const lang2Points = calcSecondLanguage(f.l2Speaking, f.l2Listening, f.l2Reading, f.l2Writing);
  const expPoints = expTable[f.canExp] ?? 0;

  // Spouse factors (max 40 pts)
  let spousePoints = 0;
  if (withSpouse) {
    const spouseEdu = { none: 0, secondary: 2, one_year: 6, two_year: 7, bachelors: 8, two_plus: 9, masters: 10, phd: 10 }[f.spouseEducation] ?? 0;
    const spouseExp = ({ '0': 0, '1': 5, '2': 7, '3': 8, '4': 9, '5plus': 10 } as Record<string, number>)[f.spouseCanExp] ?? 0;
    const spouseLang = Math.min(
      calcLanguagePoints(f.spouseL1Speaking, f.spouseL1Listening, f.spouseL1Reading, f.spouseL1Writing, CLB_FIRST_NO_SPOUSE),
      20
    );
    spousePoints = Math.min(spouseEdu + spouseExp + spouseLang, 40);
  }

  const coreHuman = agePoints + eduPoints + langPoints + lang2Points + expPoints;
  const total = Math.min(coreHuman + spousePoints, 1200);

  return {
    total,
    breakdown: {
      Age: agePoints,
      Education: eduPoints,
      'Language (1st)': langPoints,
      'Language (2nd)': lang2Points,
      'Canadian Experience': expPoints,
      'Spouse Factors': spousePoints,
    },
  };
}

function SelectField({ label, value, options, onChange }: {
  label: string;
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function CalculatorPage() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<{ total: number; breakdown: Record<string, number> } | null>(null);
  const [latestCRS, setLatestCRS] = useState<number | null>(null);

  const set = (key: keyof FormState) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: key.endsWith('Speaking') || key.endsWith('Listening') || key.endsWith('Reading') || key.endsWith('Writing') ? Number(v) : v }));

  const calculate = () => setResult(computeCRS(form));

  useEffect(() => {
    fetch('https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const crs = Number(d?.rounds?.[0]?.DrawCRS);
        if (!isNaN(crs) && crs > 0) setLatestCRS(crs);
      })
      .catch(() => {});
  }, []);

  const langAbilityOptions = CLB_OPTIONS;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 page-fade-in">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/welcome" className="text-gray-400 hover:text-red-500 transition-colors">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">🧮 CRS Score Calculator</h1>
        </div>

        <p className="text-sm text-gray-500 dark:text-slate-400">
          Estimate your Comprehensive Ranking System (CRS) score for Express Entry. Results are approximate.
        </p>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md dark:shadow-slate-900/50 p-6 space-y-5 border border-transparent dark:border-slate-700">
          {/* Spouse toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, hasSpouse: !p.hasSpouse }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.hasSpouse ? 'bg-red-600' : 'bg-gray-300 dark:bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.hasSpouse ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
              I have a spouse / common-law partner
            </span>
          </div>

          <hr className="border-gray-100 dark:border-slate-700" />

          {/* Core Human Capital */}
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-slate-100">Core Human Capital</h2>
            <SelectField label="Age" value={form.age} options={AGE_OPTIONS} onChange={set('age')} />
            <SelectField label="Education" value={form.education} options={EDU_OPTIONS} onChange={set('education')} />
            <SelectField label="Canadian Work Experience" value={form.canExp} options={CAN_EXP_OPTIONS} onChange={set('canExp')} />
          </div>

          {/* First Language */}
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-slate-100">First Official Language (English or French)</h2>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Speaking" value={form.l1Speaking} options={langAbilityOptions} onChange={set('l1Speaking')} />
              <SelectField label="Listening" value={form.l1Listening} options={langAbilityOptions} onChange={set('l1Listening')} />
              <SelectField label="Reading" value={form.l1Reading} options={langAbilityOptions} onChange={set('l1Reading')} />
              <SelectField label="Writing" value={form.l1Writing} options={langAbilityOptions} onChange={set('l1Writing')} />
            </div>
          </div>

          {/* Second Language */}
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-slate-100">Second Official Language (optional)</h2>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Speaking" value={form.l2Speaking} options={CLB_OPTIONS_SECOND} onChange={set('l2Speaking')} />
              <SelectField label="Listening" value={form.l2Listening} options={CLB_OPTIONS_SECOND} onChange={set('l2Listening')} />
              <SelectField label="Reading" value={form.l2Reading} options={CLB_OPTIONS_SECOND} onChange={set('l2Reading')} />
              <SelectField label="Writing" value={form.l2Writing} options={CLB_OPTIONS_SECOND} onChange={set('l2Writing')} />
            </div>
          </div>

          {/* Spouse Factors */}
          {form.hasSpouse && (
            <div className="space-y-4 border-t border-gray-100 dark:border-slate-700 pt-4">
              <h2 className="font-semibold text-gray-800 dark:text-slate-100">Spouse / Common-law Partner Factors</h2>
              <SelectField label="Spouse Education" value={form.spouseEducation} options={EDU_OPTIONS} onChange={set('spouseEducation')} />
              <SelectField label="Spouse Canadian Work Experience" value={form.spouseCanExp} options={CAN_EXP_OPTIONS} onChange={set('spouseCanExp')} />
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Spouse Speaking" value={form.spouseL1Speaking} options={langAbilityOptions} onChange={set('spouseL1Speaking')} />
                <SelectField label="Spouse Listening" value={form.spouseL1Listening} options={langAbilityOptions} onChange={set('spouseL1Listening')} />
                <SelectField label="Spouse Reading" value={form.spouseL1Reading} options={langAbilityOptions} onChange={set('spouseL1Reading')} />
                <SelectField label="Spouse Writing" value={form.spouseL1Writing} options={langAbilityOptions} onChange={set('spouseL1Writing')} />
              </div>
            </div>
          )}

          <button
            onClick={calculate}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-red-200/50 dark:shadow-red-900/30"
          >
            Calculate My CRS Score
          </button>
        </div>

        {/* Result Card */}
        {result && (
          <div className="rounded-2xl p-[2px] bg-gradient-to-r from-red-500 via-red-400 to-orange-400 shadow-lg">
            <div className="rounded-2xl bg-white dark:bg-slate-800 p-6">
              <div className="text-center mb-4">
                <div className="text-sm text-gray-500 dark:text-slate-400 mb-1">Your Estimated CRS Score</div>
                <div className="text-6xl font-bold text-red-600 dark:text-red-400">{result.total}</div>
                {latestCRS && (
                  <div className={`mt-2 text-sm font-medium ${result.total >= latestCRS ? 'text-green-600 dark:text-green-400' : 'text-orange-500 dark:text-orange-400'}`}>
                    {result.total >= latestCRS
                      ? `✅ Above the latest draw cutoff (${latestCRS})`
                      : `📊 ${latestCRS - result.total} points below the latest draw cutoff (${latestCRS})`}
                  </div>
                )}
              </div>
              {/* Breakdown */}
              <div className="space-y-2 mt-4">
                {Object.entries(result.breakdown).map(([label, pts]) => (
                  pts > 0 && (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-slate-400">{label}</span>
                      <span className="font-semibold text-gray-800 dark:text-slate-100">+{pts}</span>
                    </div>
                  )
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-4">
                * This is an estimate based on core human capital factors only. Actual CRS may differ.
              </p>
            </div>
          </div>
        )}

        {/* Latest Draw */}
        <LatestDrawCard />
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

interface CRSInputs {
  age: string;
  education: string;
  firstLanguageCLB: string;
  secondLanguageCLB: string;
  canadianWorkExp: string;
  certificateOfQualification: boolean;
  provincialNomination: boolean;
  jobOfferType: string;
  canadianEducation: boolean;
  siblingInCanada: boolean;
}

function getAgePoints(age: string): number {
  const a = parseInt(age, 10);
  if (isNaN(a) || a < 18) return 0;
  if (a >= 45) return 0;
  if (a <= 19) return 99;
  if (a <= 29) return 110;
  const map: Record<number, number> = {
    30: 105, 31: 99, 32: 93, 33: 87, 34: 81,
    35: 75, 36: 68, 37: 61, 38: 55, 39: 49,
    40: 44, 41: 38, 42: 33, 43: 28, 44: 23,
  };
  return map[a] ?? 0;
}

function getEducationPoints(edu: string): number {
  const map: Record<string, number> = {
    phd: 150,
    masters: 135,
    two_plus: 128,
    bachelors: 120,
    two_year: 98,
    one_year: 90,
    high_school: 30,
  };
  return map[edu] ?? 0;
}

function getLangPointsPerAbility(clb: string): number {
  const c = parseInt(clb, 10);
  if (isNaN(c)) return 0;
  if (c >= 10) return 34;
  if (c === 9) return 31;
  if (c === 8) return 23;
  if (c === 7) return 17;
  if (c === 6) return 9;
  if (c === 5) return 6;
  return 0;
}

function getCanadianExpPoints(years: string): number {
  const map: Record<string, number> = {
    '0': 0, '1': 40, '2': 53, '3': 64, '4': 72, '5+': 80,
  };
  return map[years] ?? 0;
}

function calculateCRS(inputs: CRSInputs): number {
  let score = 0;

  // Core: Age (max 110)
  score += getAgePoints(inputs.age);

  // Core: Education (max 150)
  score += getEducationPoints(inputs.education);

  // Core: First official language — 4 abilities (max 136 total)
  const firstLangPer = getLangPointsPerAbility(inputs.firstLanguageCLB);
  score += firstLangPer * 4;

  // Core: Second official language — capped at 24 points total
  if (inputs.secondLanguageCLB && inputs.secondLanguageCLB !== '0') {
    const secondLangPer = getLangPointsPerAbility(inputs.secondLanguageCLB);
    score += Math.min(secondLangPer * 4, 24);
  }

  // Core: Canadian Work Experience (max 80)
  score += getCanadianExpPoints(inputs.canadianWorkExp);

  // Additional: Provincial Nomination (+600)
  if (inputs.provincialNomination) score += 600;

  // Additional: Job Offer
  if (inputs.jobOfferType === 'teer01') score += 200;
  else if (inputs.jobOfferType === 'other') score += 50;

  // Additional: Sibling in Canada (+15)
  if (inputs.siblingInCanada) score += 15;

  // Additional: Canadian Education bonus (+15)
  if (inputs.canadianEducation) score += 15;

  // Additional: Certificate of Qualification (+50)
  if (inputs.certificateOfQualification) score += 50;

  return score;
}

const CLB_OPTIONS = ['4', '5', '6', '7', '8', '9', '10', '11', '12'];

export default function CRSCalculator() {
  const [inputs, setInputs] = useState<CRSInputs>({
    age: '',
    education: '',
    firstLanguageCLB: '',
    secondLanguageCLB: '',
    canadianWorkExp: '0',
    certificateOfQualification: false,
    provincialNomination: false,
    jobOfferType: 'none',
    canadianEducation: false,
    siblingInCanada: false,
  });
  const [score, setScore] = useState<number | null>(null);

  const set = (field: keyof CRSInputs, value: string | boolean) =>
    setInputs((prev) => ({ ...prev, [field]: value }));

  const handleCalculate = () => {
    setScore(calculateCRS(inputs));
  };

  const selectClass =
    'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500';

  const labelClass = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

  const checkboxRow = (label: string, field: keyof CRSInputs) => (
    <label key={field} className="flex items-center gap-3 cursor-pointer py-1">
      <input
        type="checkbox"
        checked={inputs[field] as boolean}
        onChange={(e) => set(field, e.target.checked)}
        className="w-4 h-4 accent-red-600"
      />
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );

  return (
    <div className="space-y-4">
      {/* Age */}
      <div>
        <label className={labelClass}>Age</label>
        <select className={selectClass} value={inputs.age} onChange={(e) => set('age', e.target.value)}>
          <option value="">Select age</option>
          {['Under 18', ...Array.from({ length: 27 }, (_, i) => String(i + 18)), '45+'].map((a) => (
            <option key={a} value={a === 'Under 18' ? '17' : a === '45+' ? '45' : a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* Education */}
      <div>
        <label className={labelClass}>Education Level</label>
        <select className={selectClass} value={inputs.education} onChange={(e) => set('education', e.target.value)}>
          <option value="">Select education</option>
          <option value="phd">PhD / Doctoral degree</option>
          <option value="masters">Master&apos;s degree</option>
          <option value="two_plus">Two or more post-secondary credentials</option>
          <option value="bachelors">Bachelor&apos;s degree (3-year+)</option>
          <option value="two_year">Two-year diploma / college</option>
          <option value="one_year">One-year diploma / certificate</option>
          <option value="high_school">High school diploma</option>
        </select>
      </div>

      {/* First Language CLB */}
      <div>
        <label className={labelClass}>First Official Language (CLB level per ability)</label>
        <select className={selectClass} value={inputs.firstLanguageCLB} onChange={(e) => set('firstLanguageCLB', e.target.value)}>
          <option value="">Select CLB level</option>
          <option value="4">CLB 4 (below minimum)</option>
          {CLB_OPTIONS.map((c) => (
            <option key={c} value={c}>
              CLB {c}{c === '12' ? '+' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Second Language CLB */}
      <div>
        <label className={labelClass}>Second Official Language (optional, CLB level per ability)</label>
        <select className={selectClass} value={inputs.secondLanguageCLB} onChange={(e) => set('secondLanguageCLB', e.target.value)}>
          <option value="">Not applicable</option>
          <option value="4">CLB 4 (below minimum)</option>
          {CLB_OPTIONS.map((c) => (
            <option key={c} value={c}>
              CLB {c}{c === '12' ? '+' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Canadian Work Experience */}
      <div>
        <label className={labelClass}>Canadian Work Experience</label>
        <select className={selectClass} value={inputs.canadianWorkExp} onChange={(e) => set('canadianWorkExp', e.target.value)}>
          <option value="0">None</option>
          <option value="1">1 year</option>
          <option value="2">2 years</option>
          <option value="3">3 years</option>
          <option value="4">4 years</option>
          <option value="5+">5 or more years</option>
        </select>
      </div>

      {/* Job Offer */}
      <div>
        <label className={labelClass}>Valid Job Offer</label>
        <select className={selectClass} value={inputs.jobOfferType} onChange={(e) => set('jobOfferType', e.target.value)}>
          <option value="none">No job offer</option>
          <option value="teer01">Yes — TEER 0 or 1 (senior / professional)</option>
          <option value="other">Yes — TEER 2, 3, or 4</option>
        </select>
      </div>

      {/* Boolean checkboxes */}
      <div className="space-y-1 pt-1">
        {checkboxRow('Provincial / Territorial Nomination', 'provincialNomination')}
        {checkboxRow('Canadian Education (post-secondary in Canada)', 'canadianEducation')}
        {checkboxRow('Certificate of Qualification (trades)', 'certificateOfQualification')}
        {checkboxRow('Sibling who is a Canadian citizen or PR in Canada', 'siblingInCanada')}
      </div>

      {/* Calculate Button */}
      <button
        onClick={handleCalculate}
        className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors mt-2"
      >
        Calculate My CRS Score
      </button>

      {/* Result */}
      {score !== null && (
        <div className="mt-4 text-center bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl py-5 px-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estimated CRS Score</p>
          <p className="text-5xl font-bold text-red-600 dark:text-red-400">{score}</p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed">
        This is an estimate only. For official scores, use the{' '}
        <a
          href="https://www.canada.ca/en/immigration-refugees-citizenship/services/come-canada-tool-immigration-express-entry.html"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-red-500 dark:text-red-400"
        >
          IRCC CRS tool
        </a>
        .
      </p>
    </div>
  );
}

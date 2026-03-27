'use client';

import { useState } from 'react';

// ─── Scoring tables ──────────────────────────────────────────────────────────

// Age — single (no spouse)
const AGE_SINGLE: Record<number, number> = {
  17: 0, 18: 99, 19: 105,
  20: 110, 21: 110, 22: 110, 23: 110, 24: 110, 25: 110,
  26: 110, 27: 110, 28: 110, 29: 110,
  30: 105, 31: 99, 32: 93, 33: 87, 34: 81, 35: 75, 36: 68,
  37: 61, 38: 55, 39: 49, 40: 44, 41: 38, 42: 33, 43: 28,
  44: 23,
};

function ageScoreSingle(age: number): number {
  if (age <= 17) return 0;
  if (age >= 45) return 0;
  return AGE_SINGLE[age] ?? 0;
}

// Age — with spouse
const AGE_SPOUSE: Record<number, number> = {
  17: 0, 18: 90, 19: 95,
  20: 100, 21: 100, 22: 100, 23: 100, 24: 100, 25: 100,
  26: 100, 27: 100, 28: 100, 29: 100,
  30: 95, 31: 90, 32: 85, 33: 80, 34: 75, 35: 70, 36: 65,
  37: 60, 38: 55, 39: 50, 40: 45, 41: 35, 42: 25, 43: 15,
  44: 5,
};

function ageScoreSpouse(age: number): number {
  if (age <= 17) return 0;
  if (age >= 45) return 0;
  return AGE_SPOUSE[age] ?? 0;
}

// Education — single (max 150)
const EDU_SINGLE: Record<string, number> = {
  none: 0, secondary: 30, oneyear: 90, twoyear: 98,
  bachelors: 120, twocreds: 128, masters: 135, phd: 150,
};

// Education — with spouse (max 140)
const EDU_SPOUSE_SELF: Record<string, number> = {
  none: 0, secondary: 28, oneyear: 84, twoyear: 91,
  bachelors: 112, twocreds: 119, masters: 126, phd: 140,
};

// First language — single: per-ability CLB → points (max 34 each, total 136)
function firstLangSingle(clb: number): number {
  if (clb <= 4) return 0;
  if (clb === 5) return 6;
  if (clb === 6) return 9;
  if (clb === 7) return 17;
  if (clb === 8) return 23;
  if (clb === 9) return 31;
  return 34; // CLB 10+
}

// First language — with spouse: per-ability CLB → points (max 32 each, total 128)
function firstLangSpouseSelf(clb: number): number {
  if (clb <= 4) return 0;
  if (clb === 5) return 6;
  if (clb === 6) return 8;
  if (clb === 7) return 16;
  if (clb === 8) return 22;
  if (clb === 9) return 29;
  return 32; // CLB 10+
}

// Second language — same for both modes: per-ability (max 6 each, total 24)
function secondLangPoints(clb: number): number {
  if (clb <= 4) return 0;
  if (clb <= 6) return 1;
  if (clb <= 8) return 3;
  return 6; // CLB 9+
}

// Canadian Work Experience — single (max 80)
const CWE_SINGLE: Record<string, number> = {
  none: 0, one: 40, two: 53, three: 64, four: 72, fiveplus: 80,
};

// Canadian Work Experience — with spouse (max 70)
const CWE_SPOUSE_SELF: Record<string, number> = {
  none: 0, one: 35, two: 46, three: 56, four: 63, fiveplus: 70,
};

// Spouse factors
const SPOUSE_EDU: Record<string, number> = {
  none: 0, secondary: 2, oneyear: 6, twoyear: 7,
  bachelors: 8, twocreds: 9, masters: 10, phd: 10,
};

function spouseLangPoints(clb: number): number {
  if (clb <= 4) return 0;
  if (clb <= 6) return 1;
  if (clb <= 8) return 3;
  return 5; // CLB 9+
}

const SPOUSE_CWE: Record<string, number> = {
  none: 0, one: 5, two: 7, three: 8, four: 9, fiveplus: 10,
};

// ─── Skill Transferability ───────────────────────────────────────────────────
// Each combination has its own lookup.  Cap per combination: 50.  Total cap: 100.
// (A) Education + First Language
function skillEduLang(edu: string, firstLangClb: number): number {
  const hasPostSec = ['oneyear', 'twoyear', 'bachelors', 'twocreds', 'masters', 'phd'].includes(edu);
  const hasBachelors = ['bachelors', 'twocreds', 'masters', 'phd'].includes(edu);
  if (!hasPostSec) return 0;
  if (firstLangClb >= 9) return hasBachelors ? 50 : 25;
  if (firstLangClb >= 7) return hasBachelors ? 25 : 13;
  return 0;
}

// (B) Education + Canadian Work Experience
function skillEduCwe(edu: string, cwe: string): number {
  const hasPostSec = ['oneyear', 'twoyear', 'bachelors', 'twocreds', 'masters', 'phd'].includes(edu);
  const hasBachelors = ['bachelors', 'twocreds', 'masters', 'phd'].includes(edu);
  const hasCwe = cwe !== 'none';
  if (!hasPostSec || !hasCwe) return 0;
  const hasTwoPlusCwe = ['two', 'three', 'four', 'fiveplus'].includes(cwe);
  if (hasBachelors && hasTwoPlusCwe) return 50;
  if (hasBachelors || hasTwoPlusCwe) return 25;
  return 0;
}

// (C) Foreign Work Experience + First Language
function skillFweLang(fwe: string, firstLangClb: number): number {
  if (fwe === 'none') return 0;
  const hasTwoPlusFwe = ['two', 'threeplus'].includes(fwe);
  if (firstLangClb >= 9) return hasTwoPlusFwe ? 50 : 25;
  if (firstLangClb >= 7) return hasTwoPlusFwe ? 25 : 13;
  return 0;
}

// (D) Foreign Work Experience + Canadian Work Experience
function skillFweCwe(fwe: string, cwe: string): number {
  if (fwe === 'none' || cwe === 'none') return 0;
  const hasTwoPlusFwe = ['two', 'threeplus'].includes(fwe);
  const hasTwoPlusCwe = ['two', 'three', 'four', 'fiveplus'].includes(cwe);
  if (hasTwoPlusFwe && hasTwoPlusCwe) return 50;
  if (hasTwoPlusFwe || hasTwoPlusCwe) return 25;
  return 0;
}

// ─── Options ─────────────────────────────────────────────────────────────────
const AGE_OPTIONS = [
  { value: '17', label: '17 or younger' },
  ...Array.from({ length: 27 }, (_, i) => ({ value: String(i + 18), label: String(i + 18) })),
  { value: '45', label: '45 or older' },
];

const EDU_OPTIONS = [
  { value: 'none', label: 'None / less than secondary' },
  { value: 'secondary', label: 'Secondary diploma (high school)' },
  { value: 'oneyear', label: 'One-year post-secondary' },
  { value: 'twoyear', label: 'Two-year post-secondary' },
  { value: 'bachelors', label: "Bachelor's degree (3yr+)" },
  { value: 'twocreds', label: 'Two or more post-secondary credentials' },
  { value: 'masters', label: "Master's degree / professional degree" },
  { value: 'phd', label: 'Doctoral degree (PhD)' },
];

const CLB_OPTIONS = [
  { value: '4', label: 'CLB 4 or below' },
  { value: '5', label: 'CLB 5' },
  { value: '6', label: 'CLB 6' },
  { value: '7', label: 'CLB 7' },
  { value: '8', label: 'CLB 8' },
  { value: '9', label: 'CLB 9' },
  { value: '10', label: 'CLB 10+' },
];

const CWE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'one', label: '1 year' },
  { value: 'two', label: '2 years' },
  { value: 'three', label: '3 years' },
  { value: 'four', label: '4 years' },
  { value: 'fiveplus', label: '5 years or more' },
];

const FWE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'one', label: '1 year' },
  { value: 'two', label: '2 years' },
  { value: 'threeplus', label: '3 years or more' },
];

const JOB_OFFER_OPTIONS = [
  { value: 'none', label: 'No job offer' },
  { value: 'teer00', label: 'TEER 0 Major Group 00 (senior managers)' },
  { value: 'other', label: 'Other TEER 0/1/2/3 job offer' },
];

const CANADIAN_EDU_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'onetwo', label: '1-2 year Canadian credential' },
  { value: 'threeplus', label: '3+ year Canadian credential' },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function CRSCalculator() {
  const [hasSpouse, setHasSpouse] = useState(false);

  // Main applicant
  const [age, setAge] = useState('25');
  const [edu, setEdu] = useState('bachelors');
  const [firstLangSpeak, setFirstLangSpeak] = useState('9');
  const [firstLangListen, setFirstLangListen] = useState('9');
  const [firstLangRead, setFirstLangRead] = useState('9');
  const [firstLangWrite, setFirstLangWrite] = useState('9');
  const [secondLangSpeak, setSecondLangSpeak] = useState('4');
  const [secondLangListen, setSecondLangListen] = useState('4');
  const [secondLangRead, setSecondLangRead] = useState('4');
  const [secondLangWrite, setSecondLangWrite] = useState('4');
  const [cwe, setCwe] = useState('one');
  const [fwe, setFwe] = useState('none');

  // Spouse
  const [spouseEdu, setSpouseEdu] = useState('secondary');
  const [spouseLangClb, setSpouseLangClb] = useState('5');
  const [spouseCwe, setSpouseCwe] = useState('none');

  // Additional
  const [hasPnp, setHasPnp] = useState(false);
  const [jobOffer, setJobOffer] = useState('none');
  const [canadianEdu, setCanadianEdu] = useState('none');
  const [frenchEnglishClb, setFrenchEnglishClb] = useState('none');
  const [hasSibling, setHasSibling] = useState(false);

  const [result, setResult] = useState<{
    core: number;
    spouse: number;
    skill: number;
    additional: number;
    total: number;
  } | null>(null);

  function calculate() {
    // ── Core / Human Capital ──────────────────────────────────────────────
    const ageNum = Math.min(Math.max(parseInt(age, 10), 17), 45);

    let coreAge: number;
    let coreEdu: number;
    let coreFirstLang: number;
    let coreSecondLang: number;
    let coreCwe: number;

    const firstLangClbMin = Math.min(
      parseInt(firstLangSpeak, 10),
      parseInt(firstLangListen, 10),
      parseInt(firstLangRead, 10),
      parseInt(firstLangWrite, 10),
    );

    const secondLangClbMin = Math.min(
      parseInt(secondLangSpeak, 10),
      parseInt(secondLangListen, 10),
      parseInt(secondLangRead, 10),
      parseInt(secondLangWrite, 10),
    );

    if (!hasSpouse) {
      coreAge = ageScoreSingle(ageNum);
      coreEdu = EDU_SINGLE[edu] ?? 0;
      coreFirstLang =
        firstLangSingle(parseInt(firstLangSpeak, 10)) +
        firstLangSingle(parseInt(firstLangListen, 10)) +
        firstLangSingle(parseInt(firstLangRead, 10)) +
        firstLangSingle(parseInt(firstLangWrite, 10));
      coreSecondLang =
        secondLangPoints(parseInt(secondLangSpeak, 10)) +
        secondLangPoints(parseInt(secondLangListen, 10)) +
        secondLangPoints(parseInt(secondLangRead, 10)) +
        secondLangPoints(parseInt(secondLangWrite, 10));
      coreCwe = CWE_SINGLE[cwe] ?? 0;
    } else {
      coreAge = ageScoreSpouse(ageNum);
      coreEdu = EDU_SPOUSE_SELF[edu] ?? 0;
      coreFirstLang =
        firstLangSpouseSelf(parseInt(firstLangSpeak, 10)) +
        firstLangSpouseSelf(parseInt(firstLangListen, 10)) +
        firstLangSpouseSelf(parseInt(firstLangRead, 10)) +
        firstLangSpouseSelf(parseInt(firstLangWrite, 10));
      coreSecondLang =
        secondLangPoints(parseInt(secondLangSpeak, 10)) +
        secondLangPoints(parseInt(secondLangListen, 10)) +
        secondLangPoints(parseInt(secondLangRead, 10)) +
        secondLangPoints(parseInt(secondLangWrite, 10));
      coreCwe = CWE_SPOUSE_SELF[cwe] ?? 0;
    }

    const core = coreAge + coreEdu + coreFirstLang + coreSecondLang + coreCwe;

    // ── Spouse factors ────────────────────────────────────────────────────
    let spousePoints = 0;
    if (hasSpouse) {
      const spLangClb = parseInt(spouseLangClb, 10);
      const spouseLangTotal =
        spouseLangPoints(spLangClb) * 4; // same CLB applied to all 4 abilities
      spousePoints = (SPOUSE_EDU[spouseEdu] ?? 0) + spouseLangTotal + (SPOUSE_CWE[spouseCwe] ?? 0);
      spousePoints = Math.min(spousePoints, 40);
    }

    // ── Skill Transferability ─────────────────────────────────────────────
    // Use the min first-language CLB for skill transferability checks
    const a = Math.min(skillEduLang(edu, firstLangClbMin), 50);
    const b = Math.min(skillEduCwe(edu, cwe), 50);
    const c = Math.min(skillFweLang(fwe, firstLangClbMin), 50);
    const d = Math.min(skillFweCwe(fwe, cwe), 50);
    const skill = Math.min(a + b + c + d, 100);

    // ── Additional points ─────────────────────────────────────────────────
    let additional = 0;
    if (hasPnp) additional += 600;
    if (jobOffer === 'teer00') additional += 200;
    else if (jobOffer === 'other') additional += 50;
    if (canadianEdu === 'onetwo') additional += 15;
    else if (canadianEdu === 'threeplus') additional += 30;
    if (frenchEnglishClb === 'five_plus') additional += 50;
    else if (frenchEnglishClb === 'four_minus') additional += 25;
    if (hasSibling) additional += 15;

    const total = core + spousePoints + skill + additional;

    setResult({ core, spouse: spousePoints, skill, additional, total });
  }

  const labelClass = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1';
  const selectClass =
    'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500';

  return (
    <div className="space-y-5 text-sm">
      {/* Spouse toggle */}
      <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
        <div className="flex-1">
          <p className="font-semibold text-gray-800 dark:text-white text-sm">
            Do you have a spouse / common-law partner accompanying you?
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setHasSpouse(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              !hasSpouse
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
            }`}
          >
            No
          </button>
          <button
            onClick={() => setHasSpouse(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              hasSpouse
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
            }`}
          >
            Yes
          </button>
        </div>
      </div>

      {/* Age */}
      <div>
        <label className={labelClass}>Age</label>
        <select value={age} onChange={(e) => setAge(e.target.value)} className={selectClass}>
          {AGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Education */}
      <div>
        <label className={labelClass}>Education Level</label>
        <select value={edu} onChange={(e) => setEdu(e.target.value)} className={selectClass}>
          {EDU_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* First Official Language */}
      <div className="space-y-2">
        <p className={`${labelClass} mb-0`}>First Official Language (CLB scores)</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Speaking', firstLangSpeak, setFirstLangSpeak],
            ['Listening', firstLangListen, setFirstLangListen],
            ['Reading', firstLangRead, setFirstLangRead],
            ['Writing', firstLangWrite, setFirstLangWrite],
          ].map(([label, val, setter]) => (
            <div key={label as string}>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{label as string}</label>
              <select value={val as string} onChange={(e) => (setter as (v: string) => void)(e.target.value)} className={selectClass}>
                {CLB_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Second Official Language */}
      <div className="space-y-2">
        <p className={`${labelClass} mb-0`}>Second Official Language (CLB scores)</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Speaking', secondLangSpeak, setSecondLangSpeak],
            ['Listening', secondLangListen, setSecondLangListen],
            ['Reading', secondLangRead, setSecondLangRead],
            ['Writing', secondLangWrite, setSecondLangWrite],
          ].map(([label, val, setter]) => (
            <div key={label as string}>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{label as string}</label>
              <select value={val as string} onChange={(e) => (setter as (v: string) => void)(e.target.value)} className={selectClass}>
                {CLB_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Canadian Work Experience */}
      <div>
        <label className={labelClass}>Canadian Work Experience</label>
        <select value={cwe} onChange={(e) => setCwe(e.target.value)} className={selectClass}>
          {CWE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Foreign Work Experience */}
      <div>
        <label className={labelClass}>Foreign Work Experience</label>
        <select value={fwe} onChange={(e) => setFwe(e.target.value)} className={selectClass}>
          {FWE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── Spouse fields ──────────────────────────────────────────────────── */}
      {hasSpouse && (
        <div className="border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-4 bg-red-50/50 dark:bg-red-900/10">
          <p className="text-sm font-bold text-red-700 dark:text-red-400">Spouse / Partner Details</p>

          <div>
            <label className={labelClass}>Spouse Education Level</label>
            <select value={spouseEdu} onChange={(e) => setSpouseEdu(e.target.value)} className={selectClass}>
              {EDU_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Spouse First Language (CLB — applied to all abilities)</label>
            <select value={spouseLangClb} onChange={(e) => setSpouseLangClb(e.target.value)} className={selectClass}>
              {CLB_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Spouse Canadian Work Experience</label>
            <select value={spouseCwe} onChange={(e) => setSpouseCwe(e.target.value)} className={selectClass}>
              {CWE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── Additional Points ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className={`${labelClass} mb-0`}>Additional Points</p>

        <div>
          <label className={labelClass}>Provincial Nomination</label>
          <div className="flex gap-2">
            {[['No', false], ['Yes (+600)', true]].map(([lbl, val]) => (
              <button
                key={String(lbl)}
                onClick={() => setHasPnp(val as boolean)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  hasPnp === val
                    ? 'bg-red-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                }`}
              >
                {lbl as string}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Arranged Employment (Job Offer)</label>
          <select value={jobOffer} onChange={(e) => setJobOffer(e.target.value)} className={selectClass}>
            {JOB_OFFER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Canadian Post-Secondary Education</label>
          <select value={canadianEdu} onChange={(e) => setCanadianEdu(e.target.value)} className={selectClass}>
            {CANADIAN_EDU_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>French + English Language Bonus</label>
          <select value={frenchEnglishClb} onChange={(e) => setFrenchEnglishClb(e.target.value)} className={selectClass}>
            <option value="none">Not applicable</option>
            <option value="four_minus">French NCLC 7+ and English CLB 4 or less (+25)</option>
            <option value="five_plus">French NCLC 7+ and English CLB 5+ (+50)</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Sibling in Canada (citizen or PR)</label>
          <div className="flex gap-2">
            {[['No', false], ['Yes (+15)', true]].map(([lbl, val]) => (
              <button
                key={String(lbl)}
                onClick={() => setHasSibling(val as boolean)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  hasSibling === val
                    ? 'bg-red-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                }`}
              >
                {lbl as string}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calculate button */}
      <button
        onClick={calculate}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
      >
        Calculate CRS Score
      </button>

      {/* Result breakdown */}
      {result && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
          <p className="font-bold text-gray-800 dark:text-white text-sm">Score Breakdown</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Core / Human Capital</span>
              <span className="font-semibold text-gray-900 dark:text-white">{result.core}</span>
            </div>
            {hasSpouse && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Spouse / Partner Factors</span>
                <span className="font-semibold text-gray-900 dark:text-white">{result.spouse}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Skill Transferability</span>
              <span className="font-semibold text-gray-900 dark:text-white">{result.skill}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Additional Points</span>
              <span className="font-semibold text-gray-900 dark:text-white">{result.additional}</span>
            </div>
            <div className="border-t dark:border-gray-600 pt-2 flex justify-between">
              <span className="font-bold text-gray-800 dark:text-white">Estimated Total CRS</span>
              <span className="text-2xl font-extrabold text-red-600 dark:text-red-400">{result.total}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            ⚠️ This is an estimate only. For your official CRS score, use the{' '}
            <a
              href="https://www.cic.gc.ca/english/immigrate/skilled/crs-tool.asp"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-red-600 dark:text-red-400"
            >
              IRCC CRS tool
            </a>.
          </p>
        </div>
      )}
    </div>
  );
}

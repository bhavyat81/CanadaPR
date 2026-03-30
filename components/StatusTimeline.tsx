import { JOURNEY_STEPS, JOURNEY_STEP_EMOJIS, formatStepDate, daysSince } from '@/lib/categories';

export interface JourneyStep {
  step_name: string;
  step_date: string | null;
}

interface StatusTimelineProps {
  /** New: journey steps with dates (preferred) */
  journeySteps?: JourneyStep[];
  /** Legacy: single application_status string (fallback) */
  applicationStatus?: string;
}

export default function StatusTimeline({ journeySteps, applicationStatus }: StatusTimelineProps) {
  // Build a map of step_name -> step_date from journeySteps
  const stepMap: Record<string, string | null> = {};
  if (journeySteps) {
    for (const s of journeySteps) {
      stepMap[s.step_name] = s.step_date;
    }
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      {JOURNEY_STEPS.map((step) => {
        const date = stepMap[step] ?? null;
        const done = date !== null;
        return (
          <div key={step} className="flex items-center gap-3">
            <span className="text-base w-6 text-center">{JOURNEY_STEP_EMOJIS[step] ?? '📌'}</span>
            <span className={`text-sm ${done ? 'text-gray-800 dark:text-slate-100 font-medium' : 'text-gray-400 dark:text-slate-500'}`}>
              {step}
              {done && (
                <span className="ml-2 text-gray-500 dark:text-slate-400 font-normal">— {formatStepDate(date ?? '')}</span>
              )}
              {!done && <span className="ml-2 text-gray-400 dark:text-slate-500 font-normal">— Pending</span>}
              {step === 'Waiting AOR' && stepMap['Filed PR Application'] && (
                <span className="ml-2 text-orange-500 dark:text-orange-400 font-normal text-xs">
                  ⏳ {daysSince(stepMap['Filed PR Application']!)} days since filing
                </span>
              )}
            </span>
          </div>
        );
      })}
      {/* Legacy fallback: show raw status string if no journey steps provided */}
      {!journeySteps && applicationStatus && (
        <div className="mt-2 text-xs text-gray-400 dark:text-slate-500">Status: {applicationStatus}</div>
      )}
    </div>
  );
}

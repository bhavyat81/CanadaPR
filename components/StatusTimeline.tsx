const STATUS_STEPS = [
  'AOR Received',
  'Biometrics Done',
  'Medicals Done',
  'Background Check',
  'PPR',
  'COPR',
];

interface StatusTimelineProps {
  applicationStatus: string;
}

export default function StatusTimeline({ applicationStatus }: StatusTimelineProps) {
  // Returns -1 for unknown/empty status, which means all steps render as pending (⏳)
  const currentIndex = STATUS_STEPS.indexOf(applicationStatus);

  return (
    <div className="flex flex-col gap-2 mt-2">
      {STATUS_STEPS.map((step, index) => {
        const done = index <= currentIndex;
        return (
          <div key={step} className="flex items-center gap-3">
            <span className="text-lg">{done ? '✅' : '⏳'}</span>
            <span className={`text-sm ${done ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}

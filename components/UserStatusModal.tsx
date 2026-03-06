import StatusTimeline from './StatusTimeline';

interface UserStatusModalProps {
  displayName: string;
  prStream: string;
  applicationStatus: string;
  onClose: () => void;
}

export default function UserStatusModal({
  displayName,
  prStream,
  applicationStatus,
  onClose,
}: UserStatusModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{displayName}</h2>
            {prStream && (
              <p className="text-sm text-gray-500 mt-0.5">{prStream}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <StatusTimeline applicationStatus={applicationStatus} />
      </div>
    </div>
  );
}

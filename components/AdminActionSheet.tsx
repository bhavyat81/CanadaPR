'use client';

function getRoleLabel(role: string): string {
  switch (role) {
    case 'creator_admin':
      return 'creator/admin';
    case 'admin':
      return 'admin';
    default:
      return 'member';
  }
}

interface AdminActionSheetProps {
  targetUserId: string;
  targetUserName: string;
  targetUserRole: string;
  currentUserRole: string;
  onClose: () => void;
  onKick: () => void;
  onPromoteToAdmin: () => void;
  onDemoteToMember: () => void;
}

export default function AdminActionSheet({
  targetUserName,
  targetUserRole,
  onClose,
  onKick,
  onPromoteToAdmin,
  onDemoteToMember,
}: AdminActionSheetProps) {
  const isTargetCreator = targetUserRole === 'creator_admin';
  const canKick = !isTargetCreator;
  const canPromote = !isTargetCreator && targetUserRole === 'member';
  const canDemote = !isTargetCreator && targetUserRole === 'admin';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl shadow-2xl w-full max-w-md pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />

        {/* Target user header */}
        <div className="px-6 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">{targetUserName}</p>
          <p className="text-xs text-gray-500">{getRoleLabel(targetUserRole)}</p>
        </div>

        {isTargetCreator ? (
          <div className="px-6 py-4 text-sm text-gray-500 text-center">
            No actions available for creator/admin.
          </div>
        ) : (
          <>
            {canPromote && (
              <>
                <button
                  onClick={onPromoteToAdmin}
                  className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xl">⬆️</span>
                  <div>
                    <div className="text-sm font-semibold text-blue-700">Promote to Admin</div>
                    <div className="text-xs text-gray-500">Grant admin privileges</div>
                  </div>
                </button>
                <div className="h-px bg-gray-100 mx-6" />
              </>
            )}

            {canDemote && (
              <>
                <button
                  onClick={onDemoteToMember}
                  className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xl">⬇️</span>
                  <div>
                    <div className="text-sm font-semibold text-orange-600">Demote to Member</div>
                    <div className="text-xs text-gray-500">Remove admin privileges</div>
                  </div>
                </button>
                <div className="h-px bg-gray-100 mx-6" />
              </>
            )}

            {canKick && (
              <>
                <button
                  onClick={onKick}
                  className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xl">🥾</span>
                  <div>
                    <div className="text-sm font-semibold text-red-600">Kick from Group</div>
                    <div className="text-xs text-gray-500">Remove from this group</div>
                  </div>
                </button>
                <div className="h-px bg-gray-100 mx-6" />
              </>
            )}
          </>
        )}

        <button
          onClick={onClose}
          className="w-full px-6 py-4 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>

        <div className="h-6" />
      </div>
    </div>
  );
}

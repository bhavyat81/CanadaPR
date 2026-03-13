'use client';

import { useState } from 'react';
import UserProfileModal from './UserProfileModal';

interface Member {
  id: string;
  display_name: string;
}

interface MembersPanelProps {
  members: Member[];
}

export default function MembersPanel({ members }: MembersPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const sorted = [...members].sort((a, b) =>
    a.display_name.localeCompare(b.display_name)
  );

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-lg px-3 py-1.5 bg-white hover:bg-red-50 transition-colors flex items-center gap-1"
        >
          👥 Members ({members.length})
          <span className="text-xs">{expanded ? '▲' : '▼'}</span>
        </button>

        {expanded && (
          <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-40 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">
                {members.length} applicant{members.length !== 1 ? 's' : ''} in this group
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {sorted.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-3">No members yet</p>
              ) : (
                sorted.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setExpanded(false);
                      setSelectedUserId(member.id);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <span className="text-sm text-gray-600">👤</span>
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {member.display_name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          isOpen={true}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </>
  );
}

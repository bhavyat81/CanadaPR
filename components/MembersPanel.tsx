'use client';

import { useState } from 'react';
import Image from 'next/image';
import UserProfileModal from './UserProfileModal';

interface Member {
  id: string;
  display_name: string;
  avatar_url?: string;
}

interface MembersPanelProps {
  members: Member[];
}

const DEFAULT_AVATAR = '/avatars/diverse_people_man_dark_short_hair_skin3.png';

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
          className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 border border-red-300 dark:border-red-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
        >
          👥 Members ({members.length})
          <span className="text-xs">{expanded ? '▲' : '▼'}</span>
        </button>

        {expanded && (
          <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 z-40 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                {members.length} applicant{members.length !== 1 ? 's' : ''} in this group
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {sorted.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500 px-4 py-3">No members yet</p>
              ) : (
                sorted.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setExpanded(false);
                      setSelectedUserId(member.id);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-600 flex-shrink-0">
                      <Image
                        src={member.avatar_url || DEFAULT_AVATAR}
                        alt={member.display_name}
                        width={28}
                        height={28}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">
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

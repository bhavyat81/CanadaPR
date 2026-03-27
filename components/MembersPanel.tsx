'use client';

import { useState } from 'react';
import Image from 'next/image';
import UserProfileModal from './UserProfileModal';
import { getAvatarUrl } from '@/lib/avatars';

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
          className="text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1"
        >
          👥 Members ({members.length})
          <span className="text-xs">{expanded ? '▲' : '▼'}</span>
        </button>

        {expanded && (
          <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-40 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
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
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                  >
                    <Image
                      src={getAvatarUrl(member.id)}
                      alt={member.display_name}
                      width={24}
                      height={24}
                      className="rounded-full flex-shrink-0"
                      unoptimized
                    />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
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

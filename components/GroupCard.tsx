import Link from 'next/link';

interface GroupCardProps {
  month: string;          // e.g., "2025-11"
  displayName: string;    // e.g., "November 2025"
  memberCount: number;
  isUserGroup: boolean;
  category: string;      // e.g., "express-entry-fsw"
  isJoined: boolean;     // whether the current user has explicitly joined this group
  onJoin?: () => void;   // callback when the user clicks "Join Group"
}

export default function GroupCard({ month, displayName, memberCount, isUserGroup, category, isJoined, onJoin }: GroupCardProps) {
  const href = `/chat?category=${encodeURIComponent(category)}&month=${encodeURIComponent(month)}`;

  return (
    <div
      className={`p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 ${
        isUserGroup
          ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-slate-800'
          : 'border-transparent bg-white dark:bg-slate-800 hover:border-red-200 dark:hover:border-red-800'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">{displayName} Applicants</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </p>
        </div>
        {isUserGroup && (
          <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            Your Group
          </span>
        )}
      </div>
      <div className="mt-4">
        {isJoined ? (
          <Link href={href}>
            <span className="inline-flex items-center text-sm text-green-600 dark:text-green-400 font-medium hover:text-green-700 dark:hover:text-green-300 cursor-pointer">
              Open Chat → <span className="ml-1">✓</span>
            </span>
          </Link>
        ) : (
          <button
            onClick={onJoin}
            className="inline-flex items-center text-sm text-red-600 dark:text-red-400 font-medium hover:text-red-700 dark:hover:text-red-300"
          >
            Join Group Chat
          </button>
        )}
      </div>
    </div>
  );
}

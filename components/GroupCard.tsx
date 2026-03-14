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
  const href = `/chat/${category}/${month}`;

  return (
    <div
      className={`p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 ${
        isUserGroup
          ? 'border-red-500 bg-red-50'
          : 'border-transparent bg-white hover:border-red-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{displayName} Applicants</h3>
          <p className="text-sm text-gray-500 mt-1">
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
            <span className="inline-flex items-center text-sm text-green-600 font-medium hover:text-green-700 cursor-pointer">
              Open Chat → <span className="ml-1">✓</span>
            </span>
          </Link>
        ) : (
          <button
            onClick={onJoin}
            className="inline-flex items-center text-sm text-red-600 font-medium hover:text-red-700"
          >
            Join Group Chat
          </button>
        )}
      </div>
    </div>
  );
}

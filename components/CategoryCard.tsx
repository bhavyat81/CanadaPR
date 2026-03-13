import Link from 'next/link';
import { PRCategory } from '@/lib/categories';

const CATEGORY_EMOJIS: Record<string, string> = {
  'express-entry-fsw': '🎯',
  'express-entry-fst': '🔧',
  'express-entry-cec': '🍁',
  'pnp': '🏛️',
  'family-spousal': '💑',
  'family-parent': '👨‍👩‍👧',
  'aip': '🌊',
  'rnip': '🌲',
  'caregiver': '❤️',
  'startup-visa': '🚀',
  'quebec': '⚜️',
  'self-employed': '💼',
  'other': '🌐',
};

interface CategoryCardProps {
  category: PRCategory;
  memberCount: number;
  isUserCategory: boolean;
}

export default function CategoryCard({ category, memberCount, isUserCategory }: CategoryCardProps) {
  const emoji = CATEGORY_EMOJIS[category.value] || '🍁';

  return (
    <Link href={`/groups/${category.value}`}>
      <div
        className={`p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 ${
          isUserCategory
            ? 'border-red-500 bg-red-50'
            : 'border-transparent bg-white hover:border-red-200'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-2xl flex-shrink-0">{emoji}</span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-800 leading-tight">
                {category.shortLabel}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight line-clamp-2">
                {category.label}
              </p>
            </div>
          </div>
          {isUserCategory && (
            <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2">
              Yours
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
          <span className="text-xs text-red-600 font-medium">View Groups →</span>
        </div>
      </div>
    </Link>
  );
}

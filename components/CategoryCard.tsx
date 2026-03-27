'use client';

import { useRouter } from 'next/navigation';
import { PRCategory } from '@/lib/categories';

interface CategoryCardProps {
  category: PRCategory;
  memberCount: number;
  isUserCategory: boolean;
}

export default function CategoryCard({ category, memberCount, isUserCategory }: CategoryCardProps) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/groups/category?cat=${encodeURIComponent(category.value)}`)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && router.push(`/groups/category?cat=${encodeURIComponent(category.value)}`)}
      className={`p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 ${
        isUserCategory
          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
          : 'border-transparent bg-white dark:bg-gray-800 hover:border-red-200 dark:hover:border-red-700'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-2xl flex-shrink-0">{category.icon}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white leading-tight line-clamp-2">
              {category.label}
            </h3>
          </div>
        </div>
        {isUserCategory && (
          <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2">
            Yours
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </span>
        <span className="text-xs text-red-600 font-medium">View Groups →</span>
      </div>
    </div>
  );
}

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
      className={`p-5 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border-l-4 ${
        isUserCategory
          ? 'border-l-red-500 bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-slate-800 border border-red-200 dark:border-red-800/50'
          : 'border-l-red-300 dark:border-l-slate-600 bg-white dark:bg-slate-800 border border-transparent dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800/50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-2xl flex-shrink-0">{category.icon}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100 leading-tight line-clamp-2">
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
        <span className="text-xs text-gray-500 dark:text-slate-400">
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </span>
        <span className="text-xs text-red-600 dark:text-red-400 font-medium">View Groups →</span>
      </div>
    </div>
  );
}

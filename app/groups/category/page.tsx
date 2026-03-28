import { Suspense } from 'react';
import CategoryClient from '../CategoryClient';

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-gray-500 dark:text-slate-400">Loading groups...</div>
        </div>
      }
    >
      <CategoryClient />
    </Suspense>
  );
}

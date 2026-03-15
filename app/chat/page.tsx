'use client';

import { useSearchParams, useRouter } from 'next/navigation';

export default function ChatPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const category = sp.get('category');
  const month = sp.get('month');

  // Redirect to groups if missing params
  if (!category || !month) {
    // You can change this default behavior if you want
    router.push('/groups');
    return null;
  }

  // Lazy-load the old dynamic page as a component
  // (we will create this component in the next step)
  const CategoryChat = require('./CategoryChat').default;
  return <CategoryChat category={category} month={month} />;
}

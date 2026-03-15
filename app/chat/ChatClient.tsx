'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import CategoryChat from './CategoryChat';

export default function ChatClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const category = sp.get('category');
  const month = sp.get('month');

  if (!category || !month) {
    router.push('/groups');
    return null;
  }

  return <CategoryChat category={category} month={month} />;
}

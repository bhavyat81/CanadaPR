'use client';
import { useEffect } from 'react';

export default function PrivacyPage() {
  useEffect(() => {
    window.location.replace('/privacy-policy.html');
  }, []);
  return null;
}

'use client';
import { useEffect } from 'react';

export default function TermsPage() {
  useEffect(() => {
    window.location.replace('/terms-of-service.html');
  }, []);
  return null;
}
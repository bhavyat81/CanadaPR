'use client';
import React from 'react';

export default function ModerationPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Community Guidelines & Moderation</h1>
      <p>We do not tolerate:</p>
      <ul className="mb-4 list-disc ml-8">
        <li>Hate speech, bullying, or harassment</li>
        <li>Spam or malicious links</li>
        <li>Personal/sensitive info about others</li>
      </ul>
      <p>Report concerns: <a href="mailto:support@canadapr.chat" className="text-blue-600 underline">support@canadapr.chat</a></p>
      <p className="mt-4">Violations may result in removal of content or permanent ban.</p>
    </main>
  );
}
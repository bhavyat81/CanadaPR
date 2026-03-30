'use client';
import React from 'react';

export default function TermsPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <p>Welcome to <strong>Canada PR Chat</strong>! By using this app, you agree to these terms.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Purpose</h2>
      <p>This platform lets Canada PR applicants chat and share their application journey. It is <strong>not</strong> an official government resource or legal advice service.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">User Conduct</h2>
      <ul className="mb-4 list-disc ml-8">
        <li>Be respectful and courteous.</li>
        <li>Do not harass, spam, or post unlawful content.</li>
        <li>No solicitation or fake profiles.</li>
        <li>We may remove users who violate these terms.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">Content</h2>
      <p>You are responsible for messages you post. We are not liable for external advice/actions taken as a result of using this app.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Data</h2>
      <p>Your messages and progress are visible to group members only. See our <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a>.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Disclaimer</h2>
      <p>Not affiliated with the Government of Canada. For peer support only.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Support</h2>
      <p>Contact: <a href="mailto:talpadabhavya@gmail.com" className="text-blue-600 underline">talpadabhavya@gmail.com</a></p>
    </main>
  );
}
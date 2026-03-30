'use client';
import React from 'react';

export default function PrivacyPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p><strong>Canada PR Chat</strong> is committed to protecting your privacy. This policy explains what data we collect, how it is used, and your choices.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">What We Collect</h2>
      <ul className="mb-4 list-disc ml-8">
        <li>Account Info: Email address, display name, user ID.</li>
        <li>Profile Data: PR category, journey stages, selected milestones.</li>
        <li>Chat Content: Messages you send in group chats.</li>
        <li>Device Info: Basic analytics (page views, errors).</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">How We Use Your Data</h2>
      <ul className="mb-4 list-disc ml-8">
        <li>To create your account and profile.</li>
        <li>To enable real-time group chats and stage tracking.</li>
        <li>To operate, secure, and improve the app.</li>
        <li>We <strong>do not</strong> sell or share your data with third parties.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">Data Storage</h2>
      <p>All user data is stored securely in Supabase (EU/US region). Data is retained until your account is deleted.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Your Choices</h2>
      <ul className="mb-4 list-disc ml-8">
        <li>You may request account deletion at any time (contact support below).</li>
        <li>You may edit your display name, profile information, and stage updates.</li>
        <li>For data deletion or access requests, contact: <a href="mailto:support@canadapr.chat" className="text-blue-600 underline">support@canadapr.chat</a></li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">Children’s Privacy</h2>
      <p>This app is not designed for children under 13.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Updates</h2>
      <p>We may update this policy. See the app for the latest version.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
      <p>support@canadapr.chat</p>
    </main>
  );
}
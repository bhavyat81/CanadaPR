'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-red-600 text-white px-5 py-6 text-center">
        <div className="text-sm font-semibold tracking-widest uppercase opacity-85 mb-1">CanadaPR Chat</div>
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <div className="mt-1 text-sm opacity-80">Effective Date: March 16, 2026</div>
      </header>

      {/* Breadcrumb */}
      <nav className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-5 py-2.5 text-sm text-gray-500 dark:text-slate-400">
        <Link href="/" className="text-red-600 hover:underline">← Back to App</Link>
        {' / '}Privacy Policy
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-5 py-8 pb-12">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8">

          <p className="text-gray-600 dark:text-slate-400 mb-7 pb-6 border-b border-gray-100 dark:border-slate-700">
            <strong className="text-gray-800 dark:text-slate-100">Bhavya Talpada</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates the{' '}
            <strong className="text-gray-800 dark:text-slate-100">CanadaPR Chat</strong> mobile application (&ldquo;App&rdquo;). This Privacy Policy explains how we collect, use, and protect your information when you use the App. By using the App you agree to the practices described here.
          </p>

          {/* Section 1 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">1. Information We Collect</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-3">We collect only the information needed to provide the service:</p>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="bg-red-50 dark:bg-red-900/20 text-red-600 text-left px-3 py-2 border border-red-200 dark:border-red-800">Data</th>
                  <th className="bg-red-50 dark:bg-red-900/20 text-red-600 text-left px-3 py-2 border border-red-200 dark:border-red-800">How It Is Collected</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Email address', 'Provided during account registration / sign-in'],
                  ['Display name', 'Entered during profile setup'],
                  ['PR category', 'Selected during profile setup (e.g., Express Entry, PNP)'],
                  ['PR application month', 'Selected during profile setup'],
                  ['Chat messages', 'Sent by you in community group chat rooms'],
                  ['Journey step dates', 'Entered by you in the profile journey tracker'],
                ].map(([data, how], i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-gray-50 dark:bg-slate-700/30' : ''}>
                    <td className="px-3 py-2 border border-gray-100 dark:border-slate-700 text-gray-700 dark:text-slate-300">{data}</td>
                    <td className="px-3 py-2 border border-gray-100 dark:border-slate-700 text-gray-700 dark:text-slate-300">{how}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-gray-700 dark:text-slate-300 mb-3">We do <strong>not</strong> collect device identifiers, location data, contacts, photos, or any other personal information beyond what is listed above.</p>

          {/* Section 2 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">2. How We Use Your Information</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-2">Your information is used solely to operate and improve the App:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-slate-300 mb-3 space-y-1.5">
            <li>Authenticate your account and keep it secure</li>
            <li>Match you with the correct PR category and month-based group chats</li>
            <li>Display your messages and profile to other community members</li>
            <li>Allow you to track and record your PR journey milestones</li>
            <li>Respond to your support requests</li>
          </ul>
          <p className="text-gray-700 dark:text-slate-300 mb-3">We do <strong>not</strong> use your data for advertising, profiling, or any purpose unrelated to providing the community service.</p>

          {/* Section 3 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">3. Data Storage and Security</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-3">
            All data is stored on <strong>Supabase</strong> cloud infrastructure, which provides encryption in transit (TLS) and encryption at rest. We follow industry-standard security practices to protect your information. For Supabase&apos;s own data-processing details please see{' '}
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">supabase.com/privacy</a>.
          </p>

          {/* Section 4 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">4. Sharing of Information</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-3">We do <strong>not</strong> sell, rent, or trade your personal information to any third party.</p>
          <p className="text-gray-700 dark:text-slate-300 mb-2">We share data only in these limited circumstances:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-slate-300 mb-3 space-y-1.5">
            <li><strong>Service providers:</strong> Supabase (authentication and database) – as described above.</li>
            <li><strong>Legal obligations:</strong> If required by law or to protect the rights and safety of users or the public.</li>
          </ul>

          {/* Section 5 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">5. Advertising and Tracking</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-3">The App contains <strong>no advertising</strong> and <strong>no third-party analytics or tracking SDKs</strong>. We do not track your activity across other apps or websites.</p>

          {/* Section 6 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">6. Children&apos;s Privacy</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-3">The App is not directed at children under the age of 13. We do not knowingly collect personal information from anyone under 13. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.</p>

          {/* Section 7 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">7. Your Rights</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-2">You may request at any time:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-slate-300 mb-3 space-y-1.5">
            <li><strong>Access</strong> – a copy of the data we hold about you.</li>
            <li><strong>Correction</strong> – an update to inaccurate or incomplete data.</li>
            <li><strong>Deletion</strong> – removal of your account and all associated data.</li>
            <li><strong>Data Portability</strong> – receive your personal data in a structured, machine-readable format.</li>
            <li><strong>Restriction of Processing</strong> – ask us to stop using (but not delete) your data in certain circumstances.</li>
            <li><strong>Object to Processing</strong> – object to our processing of your data based on legitimate interests.</li>
            <li><strong>Lodge a Complaint</strong> – you have the right to lodge a complaint with a data protection supervisory authority in your country of residence.</li>
          </ul>
          <p className="text-gray-700 dark:text-slate-300 mb-3">
            To exercise these rights, email us at{' '}
            <a href="mailto:talpadabhavya@gmail.com" className="text-red-600 hover:underline">talpadabhavya@gmail.com</a>. We will respond within 30 days.
          </p>

          {/* Section 8 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">8. Legal Basis for Processing (GDPR)</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-2">If you are located in the European Union or European Economic Area, we process your personal data under the following legal bases:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-slate-300 mb-3 space-y-1.5">
            <li><strong>Contract Performance</strong> – processing is necessary to provide you with the CanadaPR Chat service you have requested.</li>
            <li><strong>Consent</strong> – you have given us your consent at sign-up to collect and process your personal data for the purposes described in this policy. You may withdraw your consent at any time by contacting us or deleting your account; withdrawal does not affect the lawfulness of processing before withdrawal.</li>
            <li><strong>Legitimate Interest</strong> – we may process certain data to improve the App, ensure security, and maintain the quality of our service, where these interests are not overridden by your data protection rights.</li>
          </ul>

          {/* Section 9 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">9. International Data Transfers</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-2">Supabase, our cloud infrastructure provider, may store and process your data on servers located outside the European Union / European Economic Area (EU/EEA). When your data is transferred outside the EU/EEA, we ensure it is protected by appropriate safeguards, including:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-slate-300 mb-3 space-y-1.5">
            <li>Standard Contractual Clauses (SCCs) approved by the European Commission.</li>
            <li>Supabase&apos;s own data protection policies and compliance programs.</li>
          </ul>
          <p className="text-gray-700 dark:text-slate-300 mb-3">
            For more details on how Supabase handles international transfers, please see{' '}
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">supabase.com/privacy</a>.
          </p>

          {/* Section 10 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">10. California Privacy Rights (CCPA / CPRA)</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-2">If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-slate-300 mb-3 space-y-1.5">
            <li><strong>Right to Know</strong> – you may request to know what personal information we have collected, used, disclosed, or sold about you.</li>
            <li><strong>Right to Delete</strong> – you may request deletion of the personal information we hold about you, subject to certain exceptions.</li>
            <li><strong>Right to Opt Out of Sale</strong> – we do <strong>not</strong> sell or share your personal information with third parties for monetary or other valuable consideration. This right is therefore not applicable.</li>
            <li><strong>Right to Non-Discrimination</strong> – we will not discriminate against you for exercising any of your CCPA rights.</li>
          </ul>
          <p className="text-gray-700 dark:text-slate-300 mb-3">
            To exercise your California privacy rights, please contact us at{' '}
            <a href="mailto:talpadabhavya@gmail.com" className="text-red-600 hover:underline">talpadabhavya@gmail.com</a>.
          </p>

          {/* Section 11 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">11. Canada&apos;s PIPEDA</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-2">We comply with Canada&apos;s <strong>Personal Information Protection and Electronic Documents Act (PIPEDA)</strong> and applicable provincial privacy laws. In accordance with PIPEDA:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-slate-300 mb-3 space-y-1.5">
            <li>We collect, use, and disclose personal information only with your knowledge and consent, except where the law permits otherwise.</li>
            <li>We collect only the information necessary for the purposes identified in this policy.</li>
            <li>You may challenge the accuracy and completeness of your personal information and request that it be amended.</li>
            <li>You may withdraw consent to our collection, use, or disclosure of your personal information at any time (subject to legal or contractual restrictions), by contacting our Privacy Officer.</li>
            <li>We retain personal information only as long as necessary to fulfill the identified purposes or as required by law.</li>
          </ul>
          <p className="text-gray-700 dark:text-slate-300 mb-3">
            To exercise your rights under PIPEDA or to contact our <strong>Privacy Officer</strong>, please email:{' '}
            <a href="mailto:talpadabhavya@gmail.com" className="text-red-600 hover:underline">talpadabhavya@gmail.com</a>.
          </p>

          {/* Section 12 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">12. Data Retention</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-3">We retain your data for as long as your account is active. If you request account deletion, we will delete your personal data within 30 days, except where retention is required by law.</p>

          {/* Section 13 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">13. Changes to This Policy</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-3">We may update this Privacy Policy from time to time. When we do, we will revise the &ldquo;Effective Date&rdquo; at the top of this page. Continued use of the App after changes are posted constitutes your acceptance of the revised policy.</p>

          {/* Section 14 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">14. Contact Us</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-2">If you have questions or concerns about this Privacy Policy, please contact us at:</p>
          <p className="text-gray-700 dark:text-slate-300">
            <strong>CanadaPR Chat Support</strong><br />
            Email: <a href="mailto:talpadabhavya@gmail.com" className="text-red-600 hover:underline">talpadabhavya@gmail.com</a>
          </p>

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-5 text-xs text-gray-400 dark:text-slate-500">
        <p>
          <Link href="/" className="text-red-600 hover:underline">CanadaPR Chat</Link>
          {' · '}
          <Link href="/privacy" className="text-red-600 hover:underline">Privacy Policy</Link>
          {' · '}
          <Link href="/terms" className="text-red-600 hover:underline">Terms of Service</Link>
        </p>
        <p className="mt-1.5">© 2026 Bhavya Talpada. All rights reserved.</p>
      </footer>
    </div>
  );
}

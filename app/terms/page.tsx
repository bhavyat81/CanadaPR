'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-red-600 text-white px-5 py-6 text-center">
        <div className="text-sm font-semibold tracking-widest uppercase opacity-85 mb-1">CanadaPR Chat</div>
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <div className="mt-1 text-sm opacity-80">Effective Date: March 16, 2026</div>
      </header>

      {/* Breadcrumb */}
      <nav className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-5 py-2.5 text-sm text-gray-500 dark:text-slate-400">
        <Link href="/" className="text-red-600 hover:underline">← Back to App</Link>
        {' / '}Terms of Service
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-5 py-8 pb-12">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8">

          <p className="text-gray-600 dark:text-slate-400 mb-7 pb-6 border-b border-gray-100 dark:border-slate-700">
            Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using the{' '}
            <strong className="text-gray-800 dark:text-slate-100">CanadaPR Chat</strong> mobile application (&ldquo;App&rdquo;) operated by{' '}
            <strong className="text-gray-800 dark:text-slate-100">Bhavya Talpada</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). By accessing or using the App you agree to be bound by these Terms. If you do not agree, do not use the App.
          </p>

          {/* Immigration disclaimer */}
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 rounded-r-lg px-4 py-3.5 my-4 text-red-900 dark:text-red-300 text-sm">
            <strong>⚠️ IMPORTANT DISCLAIMER:</strong> CanadaPR Chat is <strong>NOT</strong> an immigration consultancy, law firm, or government service. We do <strong>not</strong> provide immigration advice, legal counsel, or representation of any kind. The App is a peer-to-peer community platform where users share their personal experiences. Any information shared by users is their personal opinion and should <strong>NOT</strong> be treated as professional immigration advice. For official immigration guidance, always consult a licensed immigration consultant (RCIC), immigration lawyer, or visit the official Government of Canada website at{' '}
            <a href="https://ircc.canada.ca" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">ircc.canada.ca</a>. We are not affiliated with, endorsed by, or connected to Immigration, Refugees and Citizenship Canada (IRCC) or any government body.
          </div>

          {/* Section 1 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">1. Acceptance of Terms</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-3">By creating an account or using any part of the App, you confirm that you are at least 13 years of age, have read and understood these Terms, and agree to be legally bound by them. If you are using the App on behalf of an organisation, you represent that you have authority to bind that organisation to these Terms.</p>

          {/* Section 2 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">2. Description of Service</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-2">CanadaPR Chat is a community platform for individuals applying for Canadian permanent residence. The App allows users to:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-slate-300 mb-3 space-y-1.5">
            <li>Create a profile with their PR category and application month</li>
            <li>Join category-based and month-based group chat rooms</li>
            <li>Exchange messages with other PR applicants</li>
            <li>Track and record personal PR journey milestones</li>
          </ul>
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 rounded-r-lg px-4 py-3.5 my-4 text-red-900 dark:text-red-300 text-sm">
            <strong>Not Immigration Advice:</strong> CanadaPR Chat is a community platform only. We are <strong>NOT</strong> immigration consultants, lawyers, or a government service. We are <strong>NOT</strong> affiliated with, endorsed by, or connected to Immigration, Refugees and Citizenship Canada (IRCC) or any government body. Information shared by users represents their personal opinions and experiences — it is <strong>NOT</strong> professional immigration advice. Always consult a licensed immigration consultant (RCIC) or immigration lawyer for advice specific to your situation.
          </div>
          <p className="text-gray-700 dark:text-slate-300 mb-3">The App is provided for informational and community purposes only. Nothing in the App constitutes legal advice. For immigration advice, consult a qualified immigration consultant or lawyer.</p>

          {/* Section 3 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">3. User Accounts</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-2">You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You agree to:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-slate-300 mb-3 space-y-1.5">
            <li>Provide accurate and current information when creating your account</li>
            <li>Notify us immediately of any unauthorised use of your account</li>
            <li>Not share your account credentials with any other person</li>
          </ul>
          <p className="text-gray-700 dark:text-slate-300 mb-3">We reserve the right to suspend or terminate accounts that we believe have been compromised or used in violation of these Terms.</p>

          {/* Section 4 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">4. Acceptable Use</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-2">You agree to use the App only for lawful purposes and in a manner that respects other users. You must <strong>not</strong>:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-slate-300 mb-3 space-y-1.5">
            <li>Post content that is harassing, threatening, abusive, defamatory, or discriminatory</li>
            <li>Spam, flood, or repeatedly post the same or similar messages</li>
            <li>Post false, misleading, or fraudulent information</li>
            <li>Share illegal content or content that infringes third-party intellectual property rights</li>
            <li>Attempt to gain unauthorised access to any part of the App or its infrastructure</li>
            <li>Use automated tools, bots, or scrapers to access the App</li>
            <li>Collect or harvest other users&apos; personal information without their consent</li>
            <li>Impersonate another person or entity</li>
          </ul>
          <p className="text-gray-700 dark:text-slate-300 mb-3">We reserve the right to remove content and/or terminate accounts that violate these rules at our sole discretion.</p>

          {/* Section 5 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">5. User Content</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-3"><strong>Ownership:</strong> You retain ownership of the messages and content you post in the App (&ldquo;User Content&rdquo;).</p>
          <p className="text-gray-700 dark:text-slate-300 mb-3"><strong>Licence:</strong> By posting User Content, you grant us a non-exclusive, royalty-free, worldwide licence to store, display, and transmit your User Content solely for the purpose of operating and providing the App. We do not use your content for advertising or any other commercial purpose.</p>
          <p className="text-gray-700 dark:text-slate-300 mb-3"><strong>Responsibility:</strong> You are solely responsible for your User Content and any consequences of posting it. We do not endorse any User Content or views expressed by users.</p>

          {/* Section 6 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">6. Privacy</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-3">
            Your use of the App is also governed by our{' '}
            <Link href="/privacy" className="text-red-600 hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference. Please review it to understand how we collect and use your information.
          </p>

          {/* Section 7 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">7. Intellectual Property</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-3">All content, design elements, logos, and software in the App (excluding User Content) are the property of Bhavya Talpada or our licensors and are protected by applicable intellectual property laws. You may not copy, modify, distribute, or create derivative works without our prior written permission.</p>

          {/* Section 8 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">8. Disclaimer of Warranties</h2>
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 rounded-r-lg px-4 py-3.5 my-4 text-red-900 dark:text-red-300 text-sm">
            THE APP IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
          </div>

          {/* Section 9 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">9. Limitation of Liability</h2>
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 rounded-r-lg px-4 py-3.5 my-4 text-red-900 dark:text-red-300 text-sm">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL BHAVYA TALPADA BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE APP, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM THESE TERMS OR YOUR USE OF THE APP SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
          </div>

          {/* Section 10 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">10. Indemnification</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-3">You agree to indemnify, defend, and hold harmless Bhavya Talpada and affiliates from any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or related to your use of the App, your User Content, or your violation of these Terms.</p>

          {/* Section 11 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">11. Termination</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-3">We may suspend or permanently terminate your access to the App at any time, with or without notice, if we believe you have violated these Terms or for any other legitimate business reason. Upon termination, your right to use the App ceases immediately. Sections 5, 7, 8, 9, and 10 survive termination.</p>
          <p className="text-gray-700 dark:text-slate-300 mb-3">
            You may delete your account at any time by contacting us at{' '}
            <a href="mailto:talpadabhavya@gmail.com" className="text-red-600 hover:underline">talpadabhavya@gmail.com</a> or using the Delete Account feature in the App.
          </p>

          {/* Section 12 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">12. Changes to Terms</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-3">We may update these Terms from time to time. We will notify you of material changes by updating the &ldquo;Effective Date&rdquo; at the top of this page. Your continued use of the App after changes are posted constitutes your acceptance of the revised Terms. If you do not agree to the updated Terms, you must stop using the App.</p>

          {/* Section 13 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">13. Governing Law</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-3">These Terms are governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict of law principles.</p>

          {/* Section 14 */}
          <h2 className="text-red-600 font-bold text-lg mt-8 mb-2.5">14. Contact Us</h2>
          <p className="text-gray-700 dark:text-slate-300 mb-2">If you have questions about these Terms, please contact us at:</p>
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
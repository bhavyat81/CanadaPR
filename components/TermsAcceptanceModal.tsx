'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TermsAcceptanceModalProps {
  userId: string;
  onAccepted: () => void;
}

export default function TermsAcceptanceModal({ userId, onAccepted }: TermsAcceptanceModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const handleAccept = async () => {
    if (!agreed || saving) return;
    setSaving(true);
    setSaveError(false);

    const { error } = await supabase
      .from('profiles')
      .update({ terms_accepted_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Failed to save terms acceptance:', error);
      setSaveError(true);
      setSaving(false);
      return;
    }

    onAccepted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="text-3xl mb-2 text-center">🇨🇦</div>
          <h2 className="text-xl font-bold text-gray-800 text-center">Community Guidelines</h2>
          <p className="text-sm text-gray-500 text-center mt-1">
            Please read and accept before joining the chat
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 text-sm text-gray-700 space-y-4">
          <p>
            Canada PR Chat is a <strong>peer-to-peer community</strong> for PR applicants. It is{' '}
            <strong>not</strong> an official government resource or legal advice service.
          </p>

          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Community Rules</h3>
            <ul className="list-disc ml-5 space-y-1">
              <li>Be respectful and courteous to all members.</li>
              <li>No hate speech, discrimination, or harassment.</li>
              <li>No spam, solicitation, or fake profiles.</li>
              <li>Do not post personal or confidential immigration documents.</li>
              <li>
                Do not present yourself as an immigration consultant or lawyer — this platform is
                for peer support only.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Reporting &amp; Blocking</h3>
            <p>
              You can <strong>report</strong> any message that violates these guidelines by
              long-pressing it. You can also <strong>block</strong> any user to instantly hide
              their messages from your view. All reports are reviewed by the developer within{' '}
              <strong>24 hours</strong>.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Enforcement</h3>
            <p>
              Violations may result in your messages being removed and your account being
              suspended or permanently banned.
            </p>
          </div>

          <p>
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-red-600 underline font-medium">
              full Terms of Service
            </a>{' '}
            and the Community Guidelines above.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-red-600 flex-shrink-0"
            />
            <span className="text-sm text-gray-700">
              I agree to the Terms of Use and Community Guidelines
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!agreed || saving}
            className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Accept & Continue'}
          </button>

          {saveError && (
            <p className="text-xs text-red-600 text-center">
              Could not save. Please check your connection and try again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

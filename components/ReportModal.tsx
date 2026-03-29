'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { hapticSuccess } from '@/lib/haptics';

const REPORT_REASONS = ['Spam', 'Harassment', 'Inappropriate Content', 'Hate Speech', 'Other'];
const SUCCESS_MESSAGE_DURATION = 2000;

interface ReportModalProps {
  reporterId: string;
  reportedUserId: string;
  messageId: string;
  messageContent: string;
  groupMonth: string;
  onClose: () => void;
}

export default function ReportModal({
  reporterId,
  reportedUserId,
  messageId,
  messageContent,
  groupMonth,
  onClose,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleSubmit = async () => {
    if (!selectedReason || submitting) return;
    setSubmitting(true);
    setSubmitError(false);

    const { error } = await supabase.from('reports').insert({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      message_id: messageId,
      message_content: messageContent,
      reason: selectedReason,
      group_month: groupMonth,
      status: 'pending',
    });

    if (error) {
      console.error('Failed to submit report:', error);
      setSubmitError(true);
      setSubmitting(false);
      return;
    }

    hapticSuccess();
    setSubmitted(true);
    closeTimerRef.current = setTimeout(onClose, SUCCESS_MESSAGE_DURATION);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-1">Report Submitted</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {"We'll review this within 24 hours. Thank you for keeping the community safe."}
            </p>
          </div>
        ) : (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Report Message</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Why are you reporting this message?</p>
            </div>

            <div className="px-6 py-4 space-y-2">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium border transition-colors ${
                    selectedReason === reason
                      ? 'bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300'
                      : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-700 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedReason || submitting}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>

            {submitError && (
              <p className="px-6 pb-4 text-xs text-red-600 dark:text-red-400 text-center">
                Could not submit report. Please check your connection and try again.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApplyToJob } from '@/hooks/use-applications';

interface ApplyModalProps {
  jobId: string;
  jobTitle: string;
  onClose: () => void;
}

export function ApplyModal({ jobId, jobTitle, onClose }: ApplyModalProps) {
  const [coverLetter, setCoverLetter] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { mutate: apply, isPending } = useApplyToJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    apply(
      { jobId, coverLetter },
      {
        onSuccess: () => setSubmitted(true),
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setErrorMsg(msg ?? 'Failed to submit application. Please try again.');
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-modal-title"
      >
        {submitted ? (
          /* ── Success state ─────────────────────────────────────── */
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
            <h2 id="apply-modal-title" className="text-xl font-bold text-gray-900">
              Application submitted!
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Your application for <strong>{jobTitle}</strong> has been sent to the employer.
            </p>
            <Button className="mt-6 w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          /* ── Form ──────────────────────────────────────────────── */
          <>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="apply-modal-title" className="text-lg font-bold text-gray-900">
                  Apply for {jobTitle}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Tell the employer why you&apos;re a great fit.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="coverLetter"
                  className="block text-sm font-medium text-gray-700"
                >
                  Cover Letter <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="coverLetter"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={6}
                  minLength={50}
                  maxLength={3000}
                  required
                  placeholder="Introduce yourself and explain why you're a great fit for this role…"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
                <p className="text-right text-xs text-gray-400">
                  {coverLetter.length} / 3000 (min 50)
                </p>
              </div>

              {errorMsg && (
                <p role="alert" className="text-sm text-red-600">
                  {errorMsg}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isPending || coverLetter.length < 50}
                >
                  {isPending ? 'Submitting…' : 'Submit application'}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

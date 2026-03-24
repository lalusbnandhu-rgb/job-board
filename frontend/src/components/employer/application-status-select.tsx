'use client';

import type { ApplicationStatus } from '@/types/seeker';

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'applied', label: 'Applied' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
];

interface ApplicationStatusSelectProps {
  value: ApplicationStatus;
  onValueChange: (status: ApplicationStatus) => void;
  disabled?: boolean;
}

export function ApplicationStatusSelect({
  value,
  onValueChange,
  disabled,
}: ApplicationStatusSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value as ApplicationStatus)}
      disabled={disabled}
      className="h-9 w-40 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

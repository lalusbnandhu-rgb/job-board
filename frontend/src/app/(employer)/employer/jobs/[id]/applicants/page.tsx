'use client';

import { useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { useJobApplications, useUpdateApplicationStatus } from '@/hooks/use-employer';
import { ApplicantCard } from '@/components/employer/applicant-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { ApplicationStatus } from '@/types/seeker';

const STATUS_FILTERS: { value: ApplicationStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'applied', label: 'Applied' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
];

export default function JobApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: jobId } = use(params);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');

  const { data, isLoading } = useJobApplications(
    jobId,
    page,
    statusFilter || undefined,
  );
  const updateStatus = useUpdateApplicationStatus(jobId);

  const applications = data?.applications ?? [];
  const pagination = data?.pagination;

  const handleStatusChange = (applicationId: string, status: ApplicationStatus) => {
    updateStatus.mutate({ applicationId, status });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/employer/jobs"
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Applicants</h1>
        <p className="mt-1 text-sm text-gray-500">
          {pagination?.total ?? 0} application{(pagination?.total ?? 0) !== 1 ? 's' : ''} received
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setStatusFilter(value); setPage(1); }}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              statusFilter === value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Applicants list */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8 text-gray-400" />}
          title="No applicants yet"
          description={
            statusFilter
              ? `No ${statusFilter} applicants. Try a different filter.`
              : 'Applications will appear here once seekers apply to this job.'
          }
          action={
            statusFilter ? (
              <button
                onClick={() => setStatusFilter('')}
                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear filter
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <ApplicantCard
              key={application._id}
              application={application}
              onStatusChange={handleStatusChange}
              isUpdating={updateStatus.isPending}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <Pagination meta={pagination} onPageChange={setPage} />
      )}
    </div>
  );
}

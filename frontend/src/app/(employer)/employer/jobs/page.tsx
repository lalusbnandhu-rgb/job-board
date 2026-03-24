'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Briefcase, Users, ArrowRight, PauseCircle, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useMyJobs, useDeleteJob } from '@/hooks/use-employer';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Job, JobStatus } from '@/types/jobs';

const STATUS_FILTER_OPTIONS: { value: JobStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_CONFIG: Record<JobStatus, { label: string; icon: React.ReactNode; className: string }> = {
  active: {
    label: 'Active',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    className: 'text-green-700 bg-green-50 border border-green-200',
  },
  paused: {
    label: 'Paused',
    icon: <PauseCircle className="h-3.5 w-3.5" />,
    className: 'text-amber-700 bg-amber-50 border border-amber-200',
  },
  closed: {
    label: 'Closed',
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: 'text-red-700 bg-red-50 border border-red-200',
  },
};

function JobRow({ job, onDelete }: { job: Job; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const statusCfg = STATUS_CONFIG[job.status];

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
      {/* Job info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 truncate">{job.title}</p>
          <span
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shrink-0',
              statusCfg.className,
            )}
          >
            {statusCfg.icon}
            {statusCfg.label}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          {job.location} · {job.type} ·{' '}
          {new Date(job.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Applicant count */}
      <div className="flex items-center gap-1.5 text-sm text-gray-600 shrink-0">
        <Users className="h-4 w-4" />
        {job.applicationCount}
      </div>

      {/* View applicants */}
      <Link
        href={`/employer/jobs/${job._id}/applicants`}
        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline shrink-0"
      >
        Applicants <ArrowRight className="h-3.5 w-3.5" />
      </Link>

      {/* Edit */}
      <Link
        href={`/employer/jobs/${job._id}/edit`}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shrink-0')}
      >
        Edit
      </Link>

      {/* Delete */}
      {confirming ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-red-600 font-medium">Delete?</span>
          <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-red-600 text-white hover:bg-red-700 border-0"
            onClick={() => { onDelete(); setConfirming(false); }}
          >
            Confirm
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 text-red-500 hover:text-red-700 hover:border-red-300"
          onClick={() => setConfirming(true)}
          aria-label="Delete job"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export default function EmployerJobsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('');
  const { data, isLoading } = useMyJobs(page, statusFilter || undefined);
  const deleteJob = useDeleteJob();

  const jobs = data?.jobs ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Job Listings</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pagination?.total ?? 0} job{(pagination?.total ?? 0) !== 1 ? 's' : ''} posted
          </p>
        </div>
        <Link href="/employer/jobs/new" className={cn(buttonVariants(), 'flex items-center gap-2')}>
          <Plus className="h-4 w-4" />
          Post a Job
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
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

      {/* Jobs list */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-8 w-8 text-gray-400" />}
          title="No jobs found"
          description={
            statusFilter
              ? `No ${statusFilter} jobs. Try a different filter.`
              : 'Post your first job listing to start receiving applications.'
          }
          action={
            !statusFilter ? (
              <Link href="/employer/jobs/new" className={buttonVariants()}>
                Post a Job
              </Link>
            ) : (
              <button
                onClick={() => setStatusFilter('')}
                className={buttonVariants({ variant: 'outline' })}
              >
                Clear filter
              </button>
            )
          }
        />
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {jobs.map((job) => (
            <JobRow
              key={job._id}
              job={job}
              onDelete={() => deleteJob.mutate(job._id)}
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

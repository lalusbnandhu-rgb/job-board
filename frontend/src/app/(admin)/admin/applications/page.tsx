'use client';

import { useState } from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useAdminApplications } from '@/hooks/use-admin';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import type { AdminApplication } from '@/types/admin';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'applied', label: 'Applied' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_STYLE: Record<string, string> = {
  applied: 'bg-blue-50 text-blue-700 border-blue-200',
  reviewed: 'bg-amber-50 text-amber-700 border-amber-200',
  shortlisted: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

function ApplicationRow({ application }: { application: AdminApplication }) {
  const job = application.jobId;
  const seeker = application.seekerId;

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-gray-900">
            {seeker?.email ?? 'Unknown applicant'}
          </p>
        </div>
        <p className="text-xs text-gray-400">
          {job ? (
            <>
              <span>{job.companyId?.name ?? 'Unknown company'}</span>
              {' · '}
              <span>{job.title}</span>
            </>
          ) : (
            'Job deleted'
          )}
          {' · Applied '}
          {new Date(application.createdAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
        </p>
      </div>

      {job && (
        <Link
          href={`/jobs/${job.slug}`}
          target="_blank"
          className="shrink-0 text-gray-400 hover:text-blue-600"
          title="View job listing"
          aria-label={`View job listing: ${job.title}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      )}

      <span
        className={cn(
          'shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
          STATUS_STYLE[application.status] ?? 'bg-gray-50 text-gray-600 border-gray-200',
        )}
      >
        {application.status}
      </span>
    </div>
  );
}

export default function AdminApplicationsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading, isError } = useAdminApplications(page, status || undefined);

  const applications = data?.applications ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Applications</h1>
        <p className="mt-1 text-sm text-gray-500">
          {pagination?.total ?? 0} applications in total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-red-100 bg-red-50">
          <p className="text-sm text-red-600">Failed to load applications. Please try again.</p>
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8 text-gray-400" />}
          title="No applications found"
          description="Try adjusting your filters."
        />
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {applications.map((app) => (
            <ApplicationRow key={app._id} application={app} />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <Pagination meta={pagination} onPageChange={setPage} />
      )}
    </div>
  );
}

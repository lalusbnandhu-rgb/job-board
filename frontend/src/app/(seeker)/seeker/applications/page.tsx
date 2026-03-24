'use client';

import { useState } from 'react';
import { Briefcase, Filter } from 'lucide-react';
import { useMyApplications } from '@/hooks/use-applications';
import { ApplicationCard } from '@/components/seeker/application-card';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { ApplicationStatus } from '@/types/seeker';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

const STATUS_FILTERS: { label: string; value: ApplicationStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Applied', value: 'applied' },
  { label: 'Reviewed', value: 'reviewed' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'Rejected', value: 'rejected' },
];

export default function ApplicationsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');

  const { data, isLoading, isPlaceholderData } = useMyApplications(
    page,
    statusFilter || undefined,
  );

  const applications = data?.applications ?? [];
  const pagination = data?.pagination;

  const handleStatusChange = (status: ApplicationStatus | '') => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track the status of all your job applications.
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-gray-100 bg-white p-1.5 shadow-sm">
        <Filter className="mx-2 h-4 w-4 shrink-0 text-gray-400" />
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handleStatusChange(value)}
            className={cn(
              'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              statusFilter === value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-8 w-8 text-gray-400" />}
          title={statusFilter ? `No ${statusFilter} applications` : 'No applications yet'}
          description={
            statusFilter
              ? `You don't have any applications with "${statusFilter}" status.`
              : 'Start applying to jobs that match your skills and experience.'
          }
          action={
            !statusFilter ? (
              <Link href="/jobs" className={buttonVariants()}>
                Browse jobs
              </Link>
            ) : (
              <button
                onClick={() => handleStatusChange('')}
                className={buttonVariants({ variant: 'outline' })}
              >
                Clear filter
              </button>
            )
          }
        />
      ) : (
        <div className={cn('space-y-3', isPlaceholderData && 'opacity-60')}>
          {applications.map((app) => (
            <ApplicationCard key={app._id} application={app} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination meta={pagination} onPageChange={setPage} />
      )}
    </div>
  );
}

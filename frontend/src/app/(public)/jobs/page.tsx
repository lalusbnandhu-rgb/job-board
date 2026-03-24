'use client';

import { useState, useCallback } from 'react';
import { useJobs } from '@/hooks/use-jobs';
import { JobCard } from '@/components/jobs/job-card';
import { JobFilters } from '@/components/jobs/job-filters';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import type { JobFilters as IJobFilters } from '@/types/jobs';
import type { Metadata } from 'next';

// Note: metadata must be in a server component — moved to metadata.ts pattern
// For this client component we set it in the layout

export default function JobsPage() {
  const [filters, setFilters] = useState<IJobFilters>({ page: 1, limit: 20 });

  const { data, isLoading, isError } = useJobs(filters);

  const handlePageChange = useCallback(
    (page: number) => setFilters((f) => ({ ...f, page })),
    [],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Find your next role
          </h1>
          <p className="mt-1 text-gray-500">
            {data?.pagination.total
              ? `${data.pagination.total.toLocaleString()} jobs available`
              : 'Browsing open positions'}
          </p>
          <div className="mt-6">
            <JobFilters filters={filters} onChange={setFilters} />
          </div>
        </div>
      </div>

      {/* ── Job list ─────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {isLoading && (
          <div className="flex justify-center py-24">
            <Spinner size="lg" />
          </div>
        )}

        {isError && (
          <EmptyState
            icon="⚠️"
            title="Could not load jobs"
            description="Something went wrong while fetching listings. Please try again."
            action={
              <button
                onClick={() => setFilters((f) => ({ ...f }))}
                className="text-sm text-blue-600 hover:underline"
              >
                Retry
              </button>
            }
          />
        )}

        {!isLoading && !isError && data && (
          <>
            {data.jobs.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No jobs match your search"
                description="Try adjusting your filters or search terms to find more results."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.jobs.map((job) => (
                  <JobCard key={job._id} job={job} />
                ))}
              </div>
            )}

            {data.pagination && (
              <div className="mt-10">
                <Pagination
                  meta={data.pagination}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

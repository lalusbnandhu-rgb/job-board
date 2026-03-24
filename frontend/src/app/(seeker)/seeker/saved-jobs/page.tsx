'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { useSavedJobs, useUnsaveJob } from '@/hooks/use-seeker';
import { JobCard } from '@/components/jobs/job-card';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SavedJobsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isPlaceholderData } = useSavedJobs(page);
  const unsaveJob = useUnsaveJob();

  const jobs = data?.jobs ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saved Jobs</h1>
        <p className="mt-1 text-sm text-gray-500">Jobs you&apos;ve bookmarked for later.</p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-8 w-8 text-gray-400" />}
          title="No saved jobs"
          description="Browse open roles and save the ones you want to revisit."
          action={
            <Link href="/jobs" className={buttonVariants()}>
              Browse jobs
            </Link>
          }
        />
      ) : (
        <div className={cn('grid grid-cols-1 gap-4 lg:grid-cols-2', isPlaceholderData && 'opacity-60')}>
          {jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              isSaved
              onSave={() => unsaveJob.mutate(job._id)}
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

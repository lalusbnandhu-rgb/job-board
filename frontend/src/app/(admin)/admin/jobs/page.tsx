'use client';

import { useState } from 'react';
import { Search, Trash2, Briefcase, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useAdminJobs, useAdminDeleteJob } from '@/hooks/use-admin';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AdminJob } from '@/types/admin';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  closed: 'bg-red-50 text-red-700 border-red-200',
};

function JobRow({ job, onDelete }: { job: AdminJob; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-gray-900">{job.title}</p>
          <Link
            href={`/jobs/${job.slug}`}
            target="_blank"
            className="shrink-0 text-gray-400 hover:text-blue-600"
            title="View listing"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
        <p className="text-xs text-gray-400">
          {job.companyId?.name ?? 'Unknown company'} · {job.category} · {job.type}
          {' · '}
          {new Date(job.createdAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
        </p>
      </div>

      <span className="shrink-0 text-xs text-gray-500">
        {job.applicationCount} app{job.applicationCount !== 1 ? 's' : ''}
      </span>

      <span
        className={cn(
          'shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium',
          STATUS_STYLE[job.status] ?? 'bg-gray-50 text-gray-600 border-gray-200',
        )}
      >
        {job.status}
      </span>

      {confirming ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-red-600">Delete?</span>
          <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={() => { onDelete(); setConfirming(false); }}
          >
            Confirm
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 text-red-600 hover:text-red-700"
          onClick={() => setConfirming(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export default function AdminJobsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useAdminJobs(page, status || undefined, search || undefined);
  const deleteMutation = useAdminDeleteJob();

  const jobs = data?.jobs ?? [];
  const pagination = data?.pagination;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Job Listings</h1>
        <p className="mt-1 text-sm text-gray-500">
          {pagination?.total ?? 0} listings in total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search job title..."
              className="h-9 rounded-lg border border-gray-200 bg-white pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
          {search && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
            >
              Clear
            </Button>
          )}
        </form>

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
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-8 w-8 text-gray-400" />}
          title="No jobs found"
          description="Try adjusting your filters."
        />
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {jobs.map((job) => (
            <JobRow
              key={job._id}
              job={job}
              onDelete={() => deleteMutation.mutate(job._id)}
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

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MapPin, Clock, Bookmark, BookmarkCheck, Wifi } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { JobTypeBadge, JobExperienceBadge } from './job-type-badge';
import { SalaryDisplay } from './salary-display';
import type { Job } from '@/types/jobs';

interface JobCardProps {
  job: Job;
  isSaved?: boolean;
  onSave?: (jobId: string) => void;
  className?: string;
}

export function JobCard({ job, isSaved = false, onSave, className }: JobCardProps) {
  const router = useRouter();
  const company = job.companyId;

  return (
    <article
      onClick={() => router.push(`/jobs/${job.slug}`)}
      className={cn(
        'group relative flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6',
        'shadow-sm transition-all hover:shadow-md hover:border-blue-100 hover:-translate-y-0.5 cursor-pointer',
        className,
      )}
    >
      {/* Save button */}
      {onSave && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSave(job._id);
          }}
          aria-label={isSaved ? 'Unsave job' : 'Save job'}
          className={cn(
            'absolute right-5 top-5 rounded-lg p-1.5 transition-colors',
            isSaved
              ? 'text-blue-600 hover:bg-blue-50'
              : 'text-gray-300 hover:bg-gray-50 hover:text-gray-500',
          )}
        >
          {isSaved ? (
            <BookmarkCheck className="h-5 w-5" />
          ) : (
            <Bookmark className="h-5 w-5" />
          )}
        </button>
      )}

      {/* Company + header */}
      <div className="flex items-start gap-4 pr-8">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
          {company?.logo ? (
            <Image
              src={company.logo}
              alt={`${company.name} logo`}
              fill
              className="object-contain p-1"
              sizes="48px"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-300">
              {company?.name?.charAt(0) ?? '?'}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <span className="block text-base font-bold text-gray-900 group-hover:text-blue-600 line-clamp-2 transition-colors">
            {job.title}
          </span>
          {company?.slug ? (
            <Link
              href={`/companies/${company.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {company.name}
            </Link>
          ) : (
            <span className="text-sm text-gray-500">{company?.name ?? 'Unknown company'}</span>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {job.location}
        </span>
        {job.isRemote && (
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <Wifi className="h-3.5 w-3.5" />
            Remote
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {formatDistanceToNow(job.createdAt)}
        </span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <JobTypeBadge type={job.type} />
        <JobExperienceBadge level={job.experienceLevel} />
      </div>

      {/* Salary */}
      <div className="text-sm font-semibold text-gray-700">
        <SalaryDisplay
          min={job.salaryMin}
          max={job.salaryMax}
          currency={job.salaryCurrency}
          className="text-gray-600 font-medium"
        />
      </div>

      {/* Tags */}
      {job.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-gray-50 pt-3">
          {job.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-500"
            >
              {tag}
            </span>
          ))}
          {job.tags.length > 4 && (
            <span className="rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-400">
              +{job.tags.length - 4}
            </span>
          )}
        </div>
      )}
    </article>
  );
}

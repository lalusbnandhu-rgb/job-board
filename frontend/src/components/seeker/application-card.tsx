import Link from 'next/link';
import { Building2, Calendar, FileText } from 'lucide-react';
import type { Application } from '@/types/seeker';
import type { Job } from '@/types/jobs';
import { ApplicationStatusBadge } from './application-status-badge';
import { formatDate } from '@/lib/date-utils';

interface ApplicationCardProps {
  application: Application;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const job = application.jobId as Job | null;
  const jobTitle = job?.title ?? 'Unknown Position';
  const companyName = job?.companyId?.name ?? 'Unknown Company';
  const jobSlug = job?.slug;

  return (
    <article className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        {/* Left: job info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {jobSlug ? (
              <Link
                href={`/jobs/${jobSlug}`}
                className="truncate text-base font-semibold text-gray-900 hover:text-blue-600"
              >
                {jobTitle}
              </Link>
            ) : (
              <span className="truncate text-base font-semibold text-gray-900">{jobTitle}</span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {companyName}
            </span>
            {job?.location && (
              <span className="text-gray-400">·</span>
            )}
            {job?.location && <span>{job.location}</span>}
          </div>

          {application.employerNote && (
            <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <span className="font-medium">Employer note:</span> {application.employerNote}
            </p>
          )}
        </div>

        {/* Right: status */}
        <ApplicationStatusBadge status={application.status} className="shrink-0" />
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          Applied {formatDate(application.createdAt)}
        </span>
        {application.resumeUrl && (
          <a
            href={application.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
          >
            <FileText className="h-3.5 w-3.5" />
            View resume
          </a>
        )}
      </div>
    </article>
  );
}

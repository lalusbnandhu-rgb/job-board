'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Wifi,
  Building2,
  Calendar,
  Users,
  ArrowLeft,
  ExternalLink,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useJob } from '@/hooks/use-jobs';
import { JobTypeBadge, JobExperienceBadge } from '@/components/jobs/job-type-badge';
import { SalaryDisplay } from '@/components/jobs/salary-display';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatDate, formatDistanceToNow } from '@/lib/date-utils';
import { useAuthStore } from '@/store/auth.store';
import { useCheckApplied } from '@/hooks/use-applications';
import { ApplyModal } from '@/components/jobs/apply-modal';

interface JobDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = use(params);
  const { data: job, isLoading, isError } = useJob(slug);
  const user = useAuthStore((s) => s.user);

  const [applyOpen, setApplyOpen] = useState(false);

  const isSeeker = user?.role === 'seeker';
  // Only check applied status for seekers once the job has loaded
  const { data: alreadyApplied } = useCheckApplied(isSeeker ? (job?._id ?? '') : '');

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-5xl mb-4">😕</p>
        <h1 className="text-2xl font-bold text-gray-900">Job not found</h1>
        <p className="mt-2 text-gray-500">
          This listing may have been removed or the link is incorrect.
        </p>
        <Link href="/jobs" className="mt-6 inline-block text-blue-600 hover:underline">
          ← Browse all jobs
        </Link>
      </div>
    );
  }

  const company = job.companyId;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* ── Back navigation ─────────────────────────────────────── */}
        <Link
          href="/jobs"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── Main content ──────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job header card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <div className="flex items-start gap-5">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                  {company.logo ? (
                    <Image
                      src={company.logo}
                      alt={`${company.name} logo`}
                      fill
                      className="object-contain p-1.5"
                      sizes="64px"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-300">
                      {company.name.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                    {job.title}
                  </h1>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                    <Link
                      href={`/companies/${company.slug}`}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {company.name}
                    </Link>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                    </span>
                    {job.isRemote && (
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <Wifi className="h-3.5 w-3.5" />
                        Remote
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <JobTypeBadge type={job.type} />
                    <JobExperienceBadge level={job.experienceLevel} />
                    <Badge variant="ghost">{job.category}</Badge>
                  </div>
                </div>
              </div>

              {/* Salary */}
              <div className="mt-5 border-t border-gray-50 pt-5">
                <SalaryDisplay
                  min={job.salaryMin}
                  max={job.salaryMax}
                  currency={job.salaryCurrency}
                  className="text-xl font-bold text-gray-800"
                />
              </div>
            </div>

            {/* Description */}
            <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                About this role
              </h2>
              <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </div>
            </section>

            {/* Requirements */}
            <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Requirements
              </h2>
              <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed">
                {job.requirements}
              </div>
            </section>

            {/* Tags */}
            {job.tags.length > 0 && (
              <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-gray-900">Skills & Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          <aside className="space-y-5">
            {/* Apply CTA */}
            <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sticky top-6">
              {isSeeker ? (
                alreadyApplied ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Already applied
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setApplyOpen(true)}
                  >
                    Apply now
                  </Button>
                )
              ) : user ? (
                <p className="text-center text-sm text-gray-500">
                  Only job seekers can apply.
                </p>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/register"
                    className={`${buttonVariants({ size: 'lg' })} w-full justify-center`}
                  >
                    Apply now
                  </Link>
                  <p className="text-center text-xs text-gray-400">
                    You&apos;ll need to create an account
                  </p>
                </div>
              )}

              <div className="mt-5 space-y-3 border-t border-gray-50 pt-5 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Posted {formatDistanceToNow(job.createdAt)}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  {job.applicationCount} applicant
                  {job.applicationCount !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-gray-400" />
                  {job.viewCount} view{job.viewCount !== 1 ? 's' : ''}
                </div>
                {job.expiresAt && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <Calendar className="h-4 w-4" />
                    Expires {formatDate(job.expiresAt)}
                  </div>
                )}
              </div>
            </div>

            {/* Company card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-bold text-gray-900">About the company</h3>

              <div className="flex items-center gap-3 mb-4">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                  {company.logo ? (
                    <Image
                      src={company.logo}
                      alt={company.name}
                      fill
                      className="object-contain p-1"
                      sizes="40px"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-base font-bold text-gray-300">
                      {company.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{company.name}</p>
                  {company.location && (
                    <p className="text-xs text-gray-500">{company.location}</p>
                  )}
                </div>
              </div>

              {company.description && (
                <p className="mb-4 text-sm text-gray-500 line-clamp-3">
                  {company.description}
                </p>
              )}

              <div className="flex flex-col gap-2">
                <Link
                  href={`/companies/${company.slug}`}
                  className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
                >
                  <Building2 className="h-4 w-4" />
                  View company profile
                </Link>
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Company website
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Apply modal — rendered at root level so it overlays everything */}
      {isSeeker && applyOpen && (
        <ApplyModal
          jobId={job._id}
          jobTitle={job.title}
          onClose={() => setApplyOpen(false)}
        />
      )}
    </div>
  );
}

'use client';

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Building2,
  ExternalLink,
  ArrowLeft,
  BadgeCheck,
  Briefcase,
} from 'lucide-react';
import { useCompany } from '@/hooks/use-companies';
import { JobCard } from '@/components/jobs/job-card';
import { Spinner } from '@/components/ui/spinner';

const SIZE_LABELS: Record<string, string> = {
  startup: 'Startup',
  small: '1–50 employees',
  medium: '51–200 employees',
  large: '201–1 000 employees',
  enterprise: '1 000+ employees',
};

interface CompanyDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { slug } = use(params);
  const { data, isLoading, isError } = useCompany(slug);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-5xl mb-4">🏢</p>
        <h1 className="text-2xl font-bold text-gray-900">Company not found</h1>
        <p className="mt-2 text-gray-500">
          This company profile may have been removed or the link is incorrect.
        </p>
        <Link href="/companies" className="mt-6 inline-block text-blue-600 hover:underline">
          ← Browse all companies
        </Link>
      </div>
    );
  }

  const { company, jobs } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* ── Back navigation ──────────────────────────────────── */}
        <Link
          href="/companies"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to companies
        </Link>

        {/* ── Company header card ──────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm mb-6">
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
              {company.logo ? (
                <Image
                  src={company.logo}
                  alt={`${company.name} logo`}
                  fill
                  sizes="80px"
                  className="object-contain p-2"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-300">
                  {company.name.charAt(0)}
                </span>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-gray-900">{company.name}</h1>
                {company.isVerified && (
                  <BadgeCheck className="h-5 w-5 text-blue-500" aria-label="Verified company" />
                )}
              </div>

              {company.industry && (
                <p className="mt-0.5 text-gray-500 font-medium">{company.industry}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500">
                {company.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {company.location}
                  </span>
                )}
                {company.size && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 shrink-0" />
                    {SIZE_LABELS[company.size] ?? company.size}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
                  <Briefcase className="h-4 w-4 shrink-0" />
                  {jobs.length} open role{jobs.length !== 1 ? 's' : ''}
                </span>
              </div>

              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {company.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          {company.description && (
            <div className="mt-6 border-t border-gray-50 pt-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
                About
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {company.description}
              </p>
            </div>
          )}
        </div>

        {/* ── Open roles ───────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Open roles
            <span className="ml-2 text-base font-normal text-gray-400">({jobs.length})</span>
          </h2>

          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold text-gray-700">No open roles right now</p>
              <p className="mt-1 text-sm text-gray-500">
                Check back later or{' '}
                <Link href="/jobs" className="text-blue-600 hover:underline">
                  browse all jobs
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {jobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

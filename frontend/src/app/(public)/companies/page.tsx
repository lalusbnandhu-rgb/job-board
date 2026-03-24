'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, Building2, Briefcase, ExternalLink, BadgeCheck } from 'lucide-react';
import { useCompanies } from '@/hooks/use-companies';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import type { Company } from '@/types/company';

const SIZE_LABELS: Record<string, string> = {
  startup: 'Startup',
  small: '1–50 employees',
  medium: '51–200 employees',
  large: '201–1 000 employees',
  enterprise: '1 000+ employees',
};

function CompanyCard({ company }: { company: Company }) {
  return (
    <Link
      href={`/companies/${company.slug}`}
      className={cn(
        'group flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6',
        'shadow-sm transition-all hover:shadow-md hover:border-blue-100 hover:-translate-y-0.5',
      )}
    >
      {/* Logo + name row */}
      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
          {company.logo ? (
            <Image
              src={company.logo}
              alt={`${company.name} logo`}
              fill
              sizes="56px"
              className="object-contain p-1.5"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xl font-bold text-gray-300">
              {company.name.charAt(0)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {company.name}
            </span>
            {company.isVerified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" aria-label="Verified company" />
            )}
          </div>
          {company.industry && (
            <span className="text-sm text-gray-500">{company.industry}</span>
          )}
        </div>
      </div>

      {/* Description */}
      {company.description && (
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {company.description}
        </p>
      )}

      {/* Meta chips */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-500">
        {company.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {company.location}
          </span>
        )}
        {company.size && (
          <span className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            {SIZE_LABELS[company.size] ?? company.size}
          </span>
        )}
        {company.website && (
          <span className="flex items-center gap-1.5 truncate max-w-[180px]">
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            {company.website.replace(/^https?:\/\//, '')}
          </span>
        )}
      </div>

      {/* Open jobs pill */}
      <div className="mt-auto flex items-center gap-1.5 self-start rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
        <Briefcase className="h-3.5 w-3.5" />
        {company.activeJobCount === 0
          ? 'No open roles'
          : `${company.activeJobCount} open role${company.activeJobCount !== 1 ? 's' : ''}`}
      </div>
    </Link>
  );
}

export default function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Simple debounce on search input
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
    const timeout = setTimeout(() => setDebouncedSearch(value), 400);
    return () => clearTimeout(timeout);
  }, []);

  const { data, isLoading, isError } = useCompanies({
    search: debouncedSearch || undefined,
    page,
    limit: 18,
  });

  const handlePageChange = useCallback((p: number) => setPage(p), []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page header ────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <h1 className="text-3xl font-extrabold text-gray-900">Companies</h1>
          <p className="mt-1 text-gray-500">
            {data?.pagination.total
              ? `${data.pagination.total.toLocaleString()} companies hiring right now`
              : 'Discover great places to work'}
          </p>

          {/* Search */}
          <div className="relative mt-6 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search companies…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ── Company grid ────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {isLoading && (
          <div className="flex justify-center py-24">
            <Spinner size="lg" />
          </div>
        )}

        {isError && (
          <EmptyState
            icon="⚠️"
            title="Could not load companies"
            description="Something went wrong while fetching companies. Please try again."
          />
        )}

        {!isLoading && !isError && data && (
          <>
            {data.companies.length === 0 ? (
              <EmptyState
                icon="🏢"
                title="No companies found"
                description={
                  debouncedSearch
                    ? `No results for "${debouncedSearch}". Try a different search.`
                    : 'No companies are listed yet.'
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.companies.map((company) => (
                  <CompanyCard key={company._id} company={company} />
                ))}
              </div>
            )}

            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="mt-10">
                <Pagination meta={data.pagination} onPageChange={handlePageChange} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

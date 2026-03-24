'use client';

import Link from 'next/link';
import { Briefcase, Users, CheckCircle, Plus, ArrowRight, AlertCircle } from 'lucide-react';
import { useEmployerStats, useMyCompany, useMyJobs } from '@/hooks/use-employer';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function EmployerDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useEmployerStats();
  const { data: company, isLoading: companyLoading } = useMyCompany();
  const { data: jobsData, isLoading: jobsLoading } = useMyJobs(1);

  const isLoading = statsLoading || companyLoading || jobsLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const recentJobs = jobsData?.jobs.slice(0, 4) ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {company ? `Welcome, ${company.name}` : 'Employer Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your job listings and applicants.
          </p>
        </div>
        <Link
          href="/jobs/new"
          className={cn(buttonVariants(), 'flex items-center gap-2')}
        >
          <Plus className="h-4 w-4" />
          Post a Job
        </Link>
      </div>

      {/* Company profile banner */}
      {!company && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="flex-1 text-sm text-amber-800">
            <p className="font-medium">Set up your company profile first</p>
            <p className="mt-0.5 text-amber-700">
              You need a company profile before you can post jobs.
            </p>
          </div>
          <Link
            href="/employer/company"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'shrink-0 text-amber-800 border-amber-300 hover:bg-amber-100 text-xs h-8 px-3',
            )}
          >
            Create profile
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Jobs"
          value={stats?.totalJobs ?? 0}
          icon={<Briefcase className="h-5 w-5" />}
          description="All posted jobs"
        />
        <StatCard
          label="Active Jobs"
          value={stats?.activeJobs ?? 0}
          icon={<CheckCircle className="h-5 w-5" />}
          description="Currently open"
        />
        <StatCard
          label="Total Applications"
          value={stats?.totalApplications ?? 0}
          icon={<Users className="h-5 w-5" />}
          description="Across all jobs"
        />
        <StatCard
          label="Shortlisted"
          value={stats?.applicationsByStatus.shortlisted ?? 0}
          icon={<CheckCircle className="h-5 w-5" />}
          description="Ready to advance"
        />
      </div>

      {/* Application breakdown */}
      {stats && stats.totalApplications > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Application Breakdown</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                { key: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-700' },
                { key: 'reviewed', label: 'Reviewed', color: 'bg-amber-100 text-amber-700' },
                { key: 'shortlisted', label: 'Shortlisted', color: 'bg-green-100 text-green-700' },
                { key: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
              ] as const
            ).map(({ key, label, color }) => (
              <div key={key} className={cn('rounded-xl p-4 text-center', color)}>
                <p className="text-2xl font-bold">{stats.applicationsByStatus[key]}</p>
                <p className="mt-0.5 text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent jobs */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Job Listings</h2>
          {(stats?.totalJobs ?? 0) > 4 && (
            <Link
              href="/employer/jobs"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {recentJobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-8 w-8 text-gray-400" />}
            title="No jobs posted yet"
            description="Post your first job listing to start receiving applications."
            action={
              <Link href="/jobs/new" className={buttonVariants()}>
                Post a Job
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {recentJobs.map((job) => (
              <div
                key={job._id}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{job.title}</p>
                  <p className="text-sm text-gray-500">{job.location}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {job.applicationCount} applicant{job.applicationCount !== 1 ? 's' : ''}
                  </span>
                  <Link
                    href={`/employer/jobs/${job._id}/applicants`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    View <ArrowRight className="inline h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Briefcase, FileText, Bookmark, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useProfile, useSavedJobs } from '@/hooks/use-seeker';
import { useMyApplications } from '@/hooks/use-applications';
import { StatCard } from '@/components/ui/stat-card';
import { ApplicationCard } from '@/components/seeker/application-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SeekerDashboardPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: applicationsData, isLoading: applicationsLoading } = useMyApplications(1);
  const { data: savedJobsData, isLoading: savedLoading } = useSavedJobs(1);

  const isLoading = profileLoading || applicationsLoading || savedLoading;

  const totalApplications = applicationsData?.pagination.total ?? 0;
  const totalSaved = savedJobsData?.pagination.total ?? 0;
  const recentApplications = applicationsData?.applications.slice(0, 3) ?? [];

  const profileComplete = !!(
    profile?.headline &&
    profile?.bio &&
    profile?.skills.length > 0 &&
    profile?.resumeUrl
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{profile?.firstName ? `, ${profile.firstName}` : ''}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s a snapshot of your job search activity.
        </p>
      </div>

      {/* Profile completion banner */}
      {!profileComplete && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="flex-1 text-sm text-amber-800">
            <p className="font-medium">Complete your profile to attract employers</p>
            <p className="mt-0.5 text-amber-700">
              Add a headline, bio, skills and upload your resume to stand out.
            </p>
          </div>
          <Link
            href="/seeker/profile"
            className={cn(buttonVariants({ variant: 'outline' }), 'shrink-0 text-amber-800 border-amber-300 hover:bg-amber-100 text-xs h-8 px-3')}
          >
            Complete profile
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Applications Sent"
          value={totalApplications}
          icon={<FileText className="h-5 w-5" />}
          description="Total job applications"
        />
        <StatCard
          label="Saved Jobs"
          value={totalSaved}
          icon={<Bookmark className="h-5 w-5" />}
          description="Jobs saved for later"
        />
        <StatCard
          label="Profile Skills"
          value={profile?.skills.length ?? 0}
          icon={<User className="h-5 w-5" />}
          description="Skills on your profile"
        />
      </div>

      {/* Recent applications */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
          {totalApplications > 3 && (
            <Link
              href="/seeker/applications"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {recentApplications.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-8 w-8 text-gray-400" />}
            title="No applications yet"
            description="Start applying to jobs that match your skills and experience."
            action={
              <Link href="/jobs" className={buttonVariants()}>
                Browse jobs
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {recentApplications.map((app) => (
              <ApplicationCard key={app._id} application={app} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

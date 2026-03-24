'use client';

import { Users, Briefcase, FileText, TrendingUp, UserPlus, PlusCircle } from 'lucide-react';
import { useAdminStats } from '@/hooks/use-admin';
import { StatCard } from '@/components/ui/stat-card';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) return null;

  const roleRows = [
    { label: 'Job Seekers', count: stats.usersByRole.seeker, color: 'bg-blue-500' },
    { label: 'Employers', count: stats.usersByRole.employer, color: 'bg-violet-500' },
    { label: 'Admins', count: stats.usersByRole.admin, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Live stats across the entire platform.</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={<Users className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          label="Total Jobs"
          value={stats.totalJobs}
          icon={<Briefcase className="h-5 w-5 text-violet-600" />}
        />
        <StatCard
          label="Total Applications"
          value={stats.totalApplications}
          icon={<FileText className="h-5 w-5 text-green-600" />}
        />
        <StatCard
          label="Active Jobs"
          value={stats.activeJobs}
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          label="New Users Today"
          value={stats.newUsersToday}
          icon={<UserPlus className="h-5 w-5 text-orange-500" />}
        />
        <StatCard
          label="New Jobs Today"
          value={stats.newJobsToday}
          icon={<PlusCircle className="h-5 w-5 text-cyan-600" />}
        />
      </div>

      {/* Users by role */}
      <Card>
        <CardHeader>
          <CardTitle>Users by Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roleRows.map(({ label, count, color }) => {
              const pct = stats.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0;
              return (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{label}</span>
                    <span className="text-gray-500">
                      {count.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${color} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

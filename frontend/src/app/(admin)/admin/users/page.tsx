'use client';

import { useState } from 'react';
import { Search, ShieldOff, ShieldCheck, User } from 'lucide-react';
import { useAdminUsers, useBanUser } from '@/hooks/use-admin';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AdminUser } from '@/types/admin';

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'seeker', label: 'Seekers' },
  { value: 'employer', label: 'Employers' },
  { value: 'admin', label: 'Admins' },
];

const ROLE_BADGE: Record<string, string> = {
  seeker: 'bg-blue-50 text-blue-700 border-blue-200',
  employer: 'bg-violet-50 text-violet-700 border-violet-200',
  admin: 'bg-red-50 text-red-700 border-red-200',
};

function UserRow({ user, onToggleBan }: { user: AdminUser; onToggleBan: () => void }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
        <User className="h-4 w-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{user.email}</p>
        <p className="text-xs text-gray-400">
          Joined {new Date(user.createdAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
          {!user.isEmailVerified && ' · Email unverified'}
        </p>
      </div>
      <span
        className={cn(
          'rounded-full border px-2 py-0.5 text-xs font-medium shrink-0',
          ROLE_BADGE[user.role],
        )}
      >
        {user.role}
      </span>
      <span
        className={cn(
          'rounded-full border px-2 py-0.5 text-xs font-medium shrink-0',
          user.isActive
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200',
        )}
      >
        {user.isActive ? 'Active' : 'Banned'}
      </span>
      {user.role !== 'admin' && (
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleBan}
          className={cn(
            'shrink-0',
            user.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700',
          )}
        >
          {user.isActive ? (
            <>
              <ShieldOff className="mr-1.5 h-3.5 w-3.5" /> Ban
            </>
          ) : (
            <>
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Unban
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useAdminUsers(page, role || undefined, search || undefined);
  const banMutation = useBanUser();

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-500">
          {pagination?.total ?? 0} registered users
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
              placeholder="Search by email..."
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
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ROLE_OPTIONS.map((o) => (
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
      ) : users.length === 0 ? (
        <EmptyState
          icon={<User className="h-8 w-8 text-gray-400" />}
          title="No users found"
          description="Try adjusting your filters."
        />
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {users.map((user) => (
            <UserRow
              key={user._id}
              user={user}
              onToggleBan={() =>
                banMutation.mutate({ id: user._id, ban: user.isActive })
              }
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

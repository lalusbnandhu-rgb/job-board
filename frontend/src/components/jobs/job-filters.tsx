'use client';

import { useCallback } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  JOB_CATEGORIES,
  JOB_TYPES,
  JOB_EXPERIENCE_LEVELS,
  type JobFilters,
  type JobCategory,
  type JobType,
  type JobExperienceLevel,
} from '@/types/jobs';

interface JobFiltersProps {
  filters: JobFilters;
  onChange: (filters: JobFilters) => void;
  className?: string;
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
};

function FilterSelect({ label, className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'h-11 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        'hover:border-gray-300 transition-colors cursor-pointer',
        !props.value && 'text-gray-400',
        className,
      )}
      aria-label={label}
      {...props}
    >
      {children}
    </select>
  );
}

const hasActiveFilters = (f: JobFilters): boolean =>
  !!(f.search || f.category || f.type || f.experienceLevel || f.isRemote || f.location);

export function JobFilters({ filters, onChange, className }: JobFiltersProps) {
  const update = useCallback(
    (partial: Partial<JobFilters>) => onChange({ ...filters, ...partial, page: 1 }),
    [filters, onChange],
  );

  const clearAll = useCallback(
    () => onChange({ page: 1, limit: filters.limit }),
    [filters.limit, onChange],
  );

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Search + location row */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search job title, skills, keywords…"
            value={filters.search ?? ''}
            onChange={(e) => update({ search: e.target.value })}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="w-56">
          <Input
            type="text"
            placeholder="Location"
            value={filters.location ?? ''}
            onChange={(e) => update({ location: e.target.value })}
            leftIcon={<MapPin className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Filter chips row */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterSelect
          label="Category"
          value={filters.category ?? ''}
          onChange={(e) => update({ category: e.target.value as JobCategory | '' })}
        >
          <option value="">All categories</option>
          {JOB_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Job type"
          value={filters.type ?? ''}
          onChange={(e) => update({ type: e.target.value as JobType | '' })}
        >
          <option value="">All types</option>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Experience level"
          value={filters.experienceLevel ?? ''}
          onChange={(e) =>
            update({ experienceLevel: e.target.value as JobExperienceLevel | '' })
          }
        >
          <option value="">All levels</option>
          {JOB_EXPERIENCE_LEVELS.map((l) => (
            <option key={l} value={l}>
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </option>
          ))}
        </FilterSelect>

        {/* Remote toggle */}
        <button
          type="button"
          onClick={() => update({ isRemote: filters.isRemote ? undefined : true })}
          className={cn(
            'h-11 rounded-xl border px-4 text-sm font-medium transition-all',
            filters.isRemote
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
          )}
        >
          🌐 Remote only
        </button>

        {/* Clear filters */}
        {hasActiveFilters(filters) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

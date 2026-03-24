import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { JobType, JobExperienceLevel, JobStatus } from '@/types/jobs';

const typeConfig: Record<JobType, { label: string; variant: BadgeProps['variant'] }> = {
  'full-time': { label: 'Full-time', variant: 'success' },
  'part-time': { label: 'Part-time', variant: 'warning' },
  contract: { label: 'Contract', variant: 'default' },
  internship: { label: 'Internship', variant: 'ghost' },
};

const expConfig: Record<JobExperienceLevel, { label: string; variant: BadgeProps['variant'] }> = {
  entry: { label: 'Entry Level', variant: 'ghost' },
  mid: { label: 'Mid Level', variant: 'default' },
  senior: { label: 'Senior', variant: 'warning' },
};

const statusConfig: Record<JobStatus, { label: string; variant: BadgeProps['variant'] }> = {
  active: { label: 'Active', variant: 'success' },
  paused: { label: 'Paused', variant: 'warning' },
  closed: { label: 'Closed', variant: 'danger' },
};

export function JobTypeBadge({ type }: { type: JobType }) {
  const { label, variant } = typeConfig[type];
  return <Badge variant={variant}>{label}</Badge>;
}

export function JobExperienceBadge({ level }: { level: JobExperienceLevel }) {
  const { label, variant } = expConfig[level];
  return <Badge variant={variant}>{label}</Badge>;
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const { label, variant } = statusConfig[status];
  return <Badge variant={variant}>{label}</Badge>;
}

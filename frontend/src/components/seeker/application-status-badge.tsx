import { Badge } from '@/components/ui/badge';
import type { ApplicationStatus } from '@/types/seeker';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; variant: BadgeVariant }
> = {
  applied: { label: 'Applied', variant: 'default' },
  reviewed: { label: 'Reviewed', variant: 'warning' },
  shortlisted: { label: 'Shortlisted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
};

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export function ApplicationStatusBadge({ status, className }: ApplicationStatusBadgeProps) {
  const { label, variant } = STATUS_CONFIG[status] ?? { label: status, variant: 'ghost' };
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

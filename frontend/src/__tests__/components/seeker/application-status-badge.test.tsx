import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ApplicationStatusBadge } from '@/components/seeker/application-status-badge';
import type { ApplicationStatus } from '@/types/seeker';

describe('ApplicationStatusBadge', () => {
  const cases: { status: ApplicationStatus; label: string }[] = [
    { status: 'applied', label: 'Applied' },
    { status: 'reviewed', label: 'Reviewed' },
    { status: 'shortlisted', label: 'Shortlisted' },
    { status: 'rejected', label: 'Rejected' },
  ];

  it.each(cases)('renders "$label" for status "$status"', ({ status, label }) => {
    render(<ApplicationStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('applies a custom className', () => {
    const { container } = render(
      <ApplicationStatusBadge status="applied" className="my-class" />,
    );
    expect(container.firstChild).toHaveClass('my-class');
  });
});

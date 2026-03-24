import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ApplicantCard } from '@/components/employer/applicant-card';
import type { EmployerApplication } from '@/types/employer';

const mockApplication: EmployerApplication = {
  _id: 'app-1',
  jobId: 'job-1',
  seekerId: { _id: 'seeker-1', email: 'jane@example.com' },
  coverLetter: 'I am passionate about building great products.',
  resumeUrl: 'https://example.com/resume.pdf',
  status: 'applied',
  seekerProfile: {
    userId: 'seeker-1',
    firstName: 'Jane',
    lastName: 'Doe',
    headline: 'Full Stack Developer',
  },
  createdAt: new Date(Date.now() - 86_400_000).toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('ApplicantCard', () => {
  it('renders the seeker full name', () => {
    render(
      <ApplicantCard
        application={mockApplication}
        onStatusChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('renders the seeker headline', () => {
    render(
      <ApplicantCard
        application={mockApplication}
        onStatusChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
  });

  it('renders a truncated cover letter', () => {
    render(
      <ApplicantCard
        application={mockApplication}
        onStatusChange={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/passionate about building great products/i),
    ).toBeInTheDocument();
  });

  it('renders a resume link', () => {
    render(
      <ApplicantCard
        application={mockApplication}
        onStatusChange={vi.fn()}
      />,
    );
    const link = screen.getByRole('link', { name: /view resume/i });
    expect(link).toHaveAttribute('href', 'https://example.com/resume.pdf');
  });

  it('shows employer note when provided', () => {
    const appWithNote: EmployerApplication = {
      ...mockApplication,
      employerNote: 'Strong candidate — schedule interview.',
    };
    render(
      <ApplicantCard application={appWithNote} onStatusChange={vi.fn()} />,
    );
    expect(screen.getByText(/Strong candidate/)).toBeInTheDocument();
  });

  it('falls back to email when no seeker profile is present', () => {
    const appNoProfile: EmployerApplication = {
      ...mockApplication,
      seekerProfile: null,
    };
    render(
      <ApplicantCard application={appNoProfile} onStatusChange={vi.fn()} />,
    );
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('calls onStatusChange when status is changed', async () => {
    const onStatusChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ApplicantCard
        application={mockApplication}
        onStatusChange={onStatusChange}
      />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Shortlisted'));

    expect(onStatusChange).toHaveBeenCalledWith('app-1', 'shortlisted');
  });
});

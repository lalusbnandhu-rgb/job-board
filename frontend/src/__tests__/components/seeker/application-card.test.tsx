import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ApplicationCard } from '@/components/seeker/application-card';
import type { Application } from '@/types/seeker';
import type { Job } from '@/types/jobs';

const mockJob: Job = {
  _id: 'job-1',
  title: 'Senior React Developer',
  slug: 'senior-react-developer',
  description: 'Build great UIs',
  requirements: 'React, TypeScript',
  location: 'Remote',
  isRemote: true,
  type: 'full-time',
  category: 'Engineering',
  salaryCurrency: 'USD',
  experienceLevel: 'senior',
  status: 'active',
  tags: [],
  viewCount: 100,
  applicationCount: 5,
  createdAt: new Date(Date.now() - 86_400_000).toISOString(),
  updatedAt: new Date().toISOString(),
  companyId: {
    _id: 'co-1',
    name: 'Acme Corp',
    slug: 'acme-corp',
  },
};

const mockApplication: Application = {
  _id: 'app-1',
  jobId: mockJob,
  seekerId: 'seeker-1',
  coverLetter: 'I am a great fit because...',
  resumeUrl: 'https://example.com/resume.pdf',
  status: 'shortlisted',
  createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('ApplicationCard', () => {
  it('renders job title as a link when slug is present', () => {
    render(<ApplicationCard application={mockApplication} />);
    const link = screen.getByRole('link', { name: 'Senior React Developer' });
    expect(link).toHaveAttribute('href', '/jobs/senior-react-developer');
  });

  it('renders company name', () => {
    render(<ApplicationCard application={mockApplication} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('renders application status badge', () => {
    render(<ApplicationCard application={mockApplication} />);
    expect(screen.getByText('Shortlisted')).toBeInTheDocument();
  });

  it('renders a resume link when resumeUrl is present', () => {
    render(<ApplicationCard application={mockApplication} />);
    const resumeLink = screen.getByRole('link', { name: /view resume/i });
    expect(resumeLink).toHaveAttribute('href', 'https://example.com/resume.pdf');
  });

  it('shows employer note when provided', () => {
    const appWithNote: Application = {
      ...mockApplication,
      employerNote: 'Great profile!',
    };
    render(<ApplicationCard application={appWithNote} />);
    expect(screen.getByText(/Great profile!/)).toBeInTheDocument();
  });

  it('handles jobId as string (not populated)', () => {
    const appWithStringJobId: Application = {
      ...mockApplication,
      jobId: 'job-id-string',
    };
    render(<ApplicationCard application={appWithStringJobId} />);
    expect(screen.getByText('Unknown Position')).toBeInTheDocument();
    expect(screen.getByText('Unknown Company')).toBeInTheDocument();
  });
});

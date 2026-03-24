import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatCard } from '@/components/ui/stat-card';
import { Briefcase } from 'lucide-react';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Applications" value={42} icon={<Briefcase />} />);
    expect(screen.getByText('Applications')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders optional description', () => {
    render(
      <StatCard
        label="Jobs"
        value={10}
        icon={<Briefcase />}
        description="This month"
      />,
    );
    expect(screen.getByText('This month')).toBeInTheDocument();
  });

  it('renders positive trend with + prefix', () => {
    render(
      <StatCard
        label="Views"
        value={100}
        icon={<Briefcase />}
        trend={{ value: 15, label: 'vs last week' }}
      />,
    );
    expect(screen.getByText('+15% vs last week')).toBeInTheDocument();
  });

  it('renders negative trend without + prefix', () => {
    render(
      <StatCard
        label="Views"
        value={100}
        icon={<Briefcase />}
        trend={{ value: -5, label: 'vs last week' }}
      />,
    );
    expect(screen.getByText('-5% vs last week')).toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test-utils';
import { SalaryDisplay } from '@/components/jobs/salary-display';

describe('SalaryDisplay', () => {
  it('shows "Salary not disclosed" when no values given', () => {
    render(<SalaryDisplay />);
    expect(screen.getByText('Salary not disclosed')).toBeInTheDocument();
  });

  it('shows a range when both min and max are provided', () => {
    render(<SalaryDisplay min={80_000} max={120_000} currency="USD" />);
    expect(screen.getByText(/\$80k – \$120k/)).toBeInTheDocument();
  });

  it('shows "Up to" prefix when only max is provided', () => {
    render(<SalaryDisplay max={90_000} currency="USD" />);
    expect(screen.getByText(/Up to \$90k/)).toBeInTheDocument();
  });

  it('shows min value with no prefix when only min is provided', () => {
    render(<SalaryDisplay min={50_000} currency="GBP" />);
    expect(screen.getByText(/£50k/)).toBeInTheDocument();
    expect(screen.queryByText(/Up to/)).not.toBeInTheDocument();
  });

  it('uses the correct currency symbol for EUR', () => {
    render(<SalaryDisplay min={60_000} max={80_000} currency="EUR" />);
    expect(screen.getByText(/€60k – €80k/)).toBeInTheDocument();
  });
});

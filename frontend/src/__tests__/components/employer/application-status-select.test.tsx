import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ApplicationStatusSelect } from '@/components/employer/application-status-select';

describe('ApplicationStatusSelect', () => {
  it('renders the current status value', () => {
    render(
      <ApplicationStatusSelect value="applied" onValueChange={vi.fn()} />,
    );
    expect(screen.getByText('Applied')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <ApplicationStatusSelect value="applied" onValueChange={vi.fn()} disabled />,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('shows all status options when opened', async () => {
    const user = userEvent.setup();
    render(
      <ApplicationStatusSelect value="applied" onValueChange={vi.fn()} />,
    );

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByText('Reviewed')).toBeInTheDocument();
    expect(screen.getByText('Shortlisted')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('calls onValueChange when a status is selected', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ApplicationStatusSelect value="applied" onValueChange={onValueChange} />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Shortlisted'));

    expect(onValueChange).toHaveBeenCalledWith('shortlisted');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test-utils';
import { Pagination } from '@/components/ui/pagination';
import type { PaginationMeta } from '@/types/pagination';

const meta = (overrides: Partial<PaginationMeta> = {}): PaginationMeta => ({
  total: 100,
  page: 1,
  limit: 10,
  totalPages: 10,
  hasNextPage: true,
  hasPrevPage: false,
  ...overrides,
});

describe('Pagination', () => {
  it('renders nothing when there is only 1 page', () => {
    const { container } = render(
      <Pagination meta={meta({ totalPages: 1, hasNextPage: false })} onPageChange={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('disables the Previous button on first page', () => {
    render(<Pagination meta={meta()} onPageChange={() => {}} />);
    const prevBtn = screen.getByLabelText('Previous page');
    expect(prevBtn).toBeDisabled();
  });

  it('disables the Next button on last page', () => {
    render(
      <Pagination
        meta={meta({ page: 10, hasNextPage: false, hasPrevPage: true })}
        onPageChange={() => {}}
      />,
    );
    const nextBtn = screen.getByLabelText('Next page');
    expect(nextBtn).toBeDisabled();
  });

  it('calls onPageChange with previous page number', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        meta={meta({ page: 5, hasPrevPage: true, hasNextPage: true })}
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Previous page'));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('calls onPageChange with next page number', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        meta={meta({ page: 3, hasPrevPage: true, hasNextPage: true })}
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Next page'));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('marks the current page button with aria-current="page"', () => {
    render(<Pagination meta={meta({ page: 2 })} onPageChange={() => {}} />);
    const currentPageBtn = screen.getByRole('button', { name: '2' });
    expect(currentPageBtn).toHaveAttribute('aria-current', 'page');
  });

  it('displays "Showing X–Y of Z results"', () => {
    render(
      <Pagination meta={meta({ page: 2, total: 35, limit: 10 })} onPageChange={() => {}} />,
    );
    expect(screen.getByText(/11–20/)).toBeInTheDocument();
    expect(screen.getByText(/35/)).toBeInTheDocument();
  });
});

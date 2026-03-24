import {
  parsePagination,
  buildPaginationMeta,
} from '../../utils/pagination';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '../../constants/jobs';

describe('parsePagination', () => {
  it('returns defaults when no arguments given', () => {
    const { page, limit, skip } = parsePagination();
    expect(page).toBe(DEFAULT_PAGE);
    expect(limit).toBe(DEFAULT_LIMIT);
    expect(skip).toBe(0);
  });

  it('parses valid page and limit strings', () => {
    const { page, limit, skip } = parsePagination('3', '10');
    expect(page).toBe(3);
    expect(limit).toBe(10);
    expect(skip).toBe(20); // (3 - 1) * 10
  });

  it('clamps limit to MAX_LIMIT', () => {
    const { limit } = parsePagination('1', '9999');
    expect(limit).toBe(MAX_LIMIT);
  });

  it('clamps page to minimum of 1 for zero input', () => {
    const { page } = parsePagination('0');
    expect(page).toBe(1);
  });

  it('clamps page to minimum of 1 for negative input', () => {
    const { page } = parsePagination('-5');
    expect(page).toBe(1);
  });

  it('falls back to defaults for non-numeric strings', () => {
    const { page, limit } = parsePagination('abc', 'xyz');
    expect(page).toBe(DEFAULT_PAGE);
    expect(limit).toBe(DEFAULT_LIMIT);
  });

  it('calculates skip as (page - 1) * limit', () => {
    const { skip } = parsePagination('5', '15');
    expect(skip).toBe((5 - 1) * 15);
  });
});

describe('buildPaginationMeta', () => {
  it('builds correct meta for a middle page', () => {
    const meta = buildPaginationMeta(45, 2, 10);

    expect(meta.total).toBe(45);
    expect(meta.page).toBe(2);
    expect(meta.limit).toBe(10);
    expect(meta.totalPages).toBe(5);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPrevPage).toBe(true);
  });

  it('first page has no previous page', () => {
    const meta = buildPaginationMeta(30, 1, 10);
    expect(meta.hasPrevPage).toBe(false);
    expect(meta.hasNextPage).toBe(true);
  });

  it('last page has no next page', () => {
    const meta = buildPaginationMeta(30, 3, 10);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(true);
  });

  it('single page has no next or prev', () => {
    const meta = buildPaginationMeta(5, 1, 20);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(false);
    expect(meta.totalPages).toBe(1);
  });

  it('rounds up totalPages for uneven division', () => {
    const meta = buildPaginationMeta(21, 1, 10);
    expect(meta.totalPages).toBe(3);
  });

  it('returns 0 totalPages for 0 total items', () => {
    const meta = buildPaginationMeta(0, 1, 10);
    expect(meta.totalPages).toBe(0);
    expect(meta.hasNextPage).toBe(false);
  });
});

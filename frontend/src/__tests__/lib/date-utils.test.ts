import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatDistanceToNow, formatDate } from '@/lib/date-utils';

describe('formatDistanceToNow', () => {
  const now = new Date('2024-06-15T12:00:00Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => vi.useRealTimers());

  it('returns "just now" for times less than 1 minute ago', () => {
    const date = new Date(now - 30_000).toISOString();
    expect(formatDistanceToNow(date)).toBe('just now');
  });

  it('returns minutes for < 1 hour', () => {
    const date = new Date(now - 45 * 60_000).toISOString();
    expect(formatDistanceToNow(date)).toBe('45m ago');
  });

  it('returns hours for < 24 hours', () => {
    const date = new Date(now - 5 * 3_600_000).toISOString();
    expect(formatDistanceToNow(date)).toBe('5h ago');
  });

  it('returns days for < 7 days', () => {
    const date = new Date(now - 3 * 86_400_000).toISOString();
    expect(formatDistanceToNow(date)).toBe('3d ago');
  });

  it('returns weeks for < 5 weeks', () => {
    const date = new Date(now - 14 * 86_400_000).toISOString();
    expect(formatDistanceToNow(date)).toBe('2w ago');
  });

  it('returns months for < 12 months', () => {
    const date = new Date(now - 90 * 86_400_000).toISOString();
    expect(formatDistanceToNow(date)).toBe('3mo ago');
  });
});

describe('formatDate', () => {
  it('formats an ISO date to a readable string', () => {
    const result = formatDate('2024-03-15T00:00:00Z');
    expect(result).toContain('March');
    expect(result).toContain('2024');
  });
});

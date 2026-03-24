import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock next/image — renders a plain <img> in tests
vi.mock('next/image', () => ({
  default: ({ src, alt, fill: _fill, sizes: _sizes, ...rest }: { src: string; alt: string; fill?: boolean; sizes?: string; [key: string]: unknown }) =>
    React.createElement('img', { src, alt, ...rest }),
}));

// Mock next/navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

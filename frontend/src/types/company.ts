import type { PaginationMeta } from './pagination';

export const COMPANY_SIZES = ['startup', 'small', 'medium', 'large', 'enterprise'] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

export interface Company {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: CompanySize;
  location?: string;
  isVerified: boolean;
  activeJobCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyListResponse {
  companies: Company[];
  pagination: PaginationMeta;
}

export interface CompanyFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CompanyDetail extends Company {
  // same shape — jobs returned separately
}

import { z } from 'zod';

/** Validates a 24-character hex MongoDB ObjectId */
export const objectId = () =>
  z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

/** Validates a numeric-only query param string (used for page/limit before parsePagination) */
export const numericString = () =>
  z.string().regex(/^\d+$/, 'Must be a positive integer').optional();

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/** Validates and replaces req.body with parsed output */
export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };

/** Validates req.query — keeps values as strings so parsePagination still works */
export const validateQuery =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        message: 'Invalid query parameters',
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }
    // Cast is safe — Zod has already validated and stripped unknown keys
    req.query = result.data as Record<string, string>;
    next();
  };

/** Validates req.params (e.g. MongoDB ObjectId format on /:id routes) */
export const validateParams =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({
        message: 'Invalid path parameter',
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }
    next();
  };

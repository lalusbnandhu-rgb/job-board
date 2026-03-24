import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/user.model';
import { ApiError } from '../utils/errors';

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'You do not have permission to access this resource'),
      );
    }
    next();
  };

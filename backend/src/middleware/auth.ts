import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token';
import { User } from '../models/user.model';
import { ApiError } from '../utils/errors';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.id).select(
      '_id email role isEmailVerified isActive',
    );

    if (!user) return next(new ApiError(401, 'User not found'));
    if (!user.isActive) return next(new ApiError(403, 'Account is disabled'));

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
    };

    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

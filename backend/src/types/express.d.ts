import { UserRole } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        isEmailVerified: boolean;
        isActive: boolean;
      };
    }
  }
}

export {};

import rateLimit from 'express-rate-limit';

const msg = (message: string) => ({ message, code: 'RATE_LIMIT_EXCEEDED' });

/** 10 attempts per 15 min — brute-force protection on login.
 *  Override via LOGIN_RATE_LIMIT_MAX env var for E2E test environments. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env['LOGIN_RATE_LIMIT_MAX'] ?? '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: msg('Too many login attempts. Please try again in 15 minutes.'),
});

/** 5 registrations per hour per IP.
 *  Override via REGISTER_RATE_LIMIT_MAX env var for E2E test environments. */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env['REGISTER_RATE_LIMIT_MAX'] ?? '5', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: msg('Too many accounts created from this IP. Please try again later.'),
});

/** 3 requests per hour — for forgot-password and reset-password */
export const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg('Too many password reset attempts. Please try again later.'),
});

/** 10 file uploads per hour per user */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg('Too many file uploads. Please try again later.'),
});

/** 30 job applications per hour per seeker */
export const applicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg('Too many applications submitted. Please slow down.'),
});

/** 20 job postings per hour per employer */
export const jobCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg('Too many job postings. Please try again later.'),
});

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import { env } from './config/env';
import { ApiError } from './utils/errors';
import authRouter from './routes/auth.routes';
import jobRouter from './routes/job.routes';
import seekerRouter from './routes/seeker.routes';
import applicationRouter from './routes/application.routes';
import employerRouter from './routes/employer.routes';
import adminRouter from './routes/admin.routes';
import companyRouter from './routes/company.routes';
import notificationRouter from './routes/notification.routes';

export const app = express();

// ── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobRouter);
app.use('/api/seeker', seekerRouter);
app.use('/api/applications', applicationRouter);
app.use('/api/employer', employerRouter);
app.use('/api/admin', adminRouter);
app.use('/api/companies', companyRouter);
app.use('/api/notifications', notificationRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }
  console.error(err.stack);
  res.status(500).json({
    message:
      env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

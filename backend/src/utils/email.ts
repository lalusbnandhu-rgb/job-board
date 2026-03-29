import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import { env } from '../config/env';

// ── Template loader ───────────────────────────────────────────────────────────

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

/** Exposed for test teardown only — clears the in-process template cache. */
export const clearTemplateCache = (): void => templateCache.clear();

const loadTemplate = (name: string): HandlebarsTemplateDelegate => {
  if (templateCache.has(name)) return templateCache.get(name)!;
  const filePath = path.join(__dirname, '..', 'templates', `${name}.hbs`);
  let source: string;
  try {
    source = fs.readFileSync(filePath, 'utf8');
  } catch {
    throw new Error(`Email template "${name}" not found at ${filePath}`);
  }
  const compiled = Handlebars.compile(source);
  templateCache.set(name, compiled);
  return compiled;
};

const createTransport = () => {
  if (env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT ?? 587,
      secure: (env.EMAIL_PORT ?? 587) === 465,
      auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
    });
  }
  // Dev fallback — logs email to console instead of sending
  return null;
};

const send = async (to: string, subject: string, html: string) => {
  const transporter = createTransport();

  if (!transporter) {
    if (env.NODE_ENV !== 'production') {
      console.log('\n📧 ─── DEV EMAIL (not sent — configure EMAIL_* env vars) ───');
      console.log(`To:      ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('────────────────────────────────────────────────────────────\n');
    }
    return;
  }

  await transporter.sendMail({
    from: `"JobBoard" <${env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

// ── Templates ─────────────────────────────────────────────────────────────────

export const sendVerificationEmail = async (to: string, token: string) => {
  const url = `${env.CLIENT_URL}/auth/verify-email?token=${token}`;
  await send(
    to,
    'Verify your JobBoard account',
    `
    <div style="font-family:sans-serif;max-width:500px;margin:auto">
      <h2 style="color:#2563eb">Verify your email</h2>
      <p>Click the button below to verify your JobBoard account.</p>
      <a href="${url}"
         style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;
                border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
        Verify Email
      </a>
      <p style="color:#6b7280;font-size:14px">Link expires in 24 hours.</p>
      <p style="color:#9ca3af;font-size:12px">If you didn't create an account, ignore this email.</p>
    </div>
    `,
  );
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; message: string }> = {
  reviewed: {
    label: 'Under Review',
    color: '#2563eb',
    message: 'Your application is being reviewed by the hiring team.',
  },
  shortlisted: {
    label: 'Shortlisted',
    color: '#16a34a',
    message: "Great news — you've been shortlisted! The employer will be in touch soon.",
  },
  rejected: {
    label: 'Not Moving Forward',
    color: '#dc2626',
    message:
      'After careful consideration, the employer has decided not to move forward with your application at this time.',
  },
};

/** Returns true for statuses that warrant an email notification to the seeker. */
export const isNotifiableStatus = (status: string): boolean => status in STATUS_CONFIG;

export const sendApplicationStatusEmail = async (
  to: string,
  seekerName: string,
  jobTitle: string,
  newStatus: string,
  employerNote?: string,
): Promise<void> => {
  const config = STATUS_CONFIG[newStatus];
  if (!config) return; // 'applied' status has no email notification

  const template = loadTemplate('application-status');
  const html = template({
    seekerName,
    jobTitle,
    statusLabel: config.label,
    statusColor: config.color,
    statusMessage: config.message,
    employerNote: employerNote ?? null,
    applicationsUrl: `${env.CLIENT_URL}/seeker/applications`,
    clientUrl: env.CLIENT_URL,
  });

  const safeTitle = jobTitle.replace(/[\r\n]/g, ' ');
  await send(to, `Application update: ${safeTitle}`, html);
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const url = `${env.CLIENT_URL}/auth/reset-password?token=${token}`;
  await send(
    to,
    'Reset your JobBoard password',
    `
    <div style="font-family:sans-serif;max-width:500px;margin:auto">
      <h2 style="color:#2563eb">Reset your password</h2>
      <p>Click the button below to set a new password for your JobBoard account.</p>
      <a href="${url}"
         style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;
                border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
        Reset Password
      </a>
      <p style="color:#6b7280;font-size:14px">Link expires in 1 hour.</p>
      <p style="color:#9ca3af;font-size:12px">If you didn't request a reset, ignore this email.</p>
    </div>
    `,
  );
};

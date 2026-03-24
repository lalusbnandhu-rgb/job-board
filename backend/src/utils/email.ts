import nodemailer from 'nodemailer';
import { env } from '../config/env';

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
    console.log('\n📧 ─── DEV EMAIL (not sent — configure EMAIL_* env vars) ───');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html}`);
    console.log('────────────────────────────────────────────────────────────\n');
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

export const sendApplicationStatusEmail = async (
  to: string,
  seekerName: string,
  jobTitle: string,
  newStatus: string,
  employerNote?: string,
): Promise<void> => {
  const statusConfig: Record<string, { label: string; color: string; message: string }> = {
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

  const config = statusConfig[newStatus];
  if (!config) return; // 'applied' has no notification

  await send(
    to,
    `Application update: ${jobTitle}`,
    `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;color:#111827">
      <h2 style="color:${config.color};margin-bottom:4px">Application ${config.label}</h2>
      <p style="color:#6b7280;font-size:14px;margin-top:0">Hi ${seekerName},</p>
      <p>${config.message}</p>
      <div style="border-left:4px solid ${config.color};padding:12px 16px;background:#f9fafb;
                  border-radius:0 8px 8px 0;margin:16px 0">
        <p style="margin:0;font-weight:600">${jobTitle}</p>
      </div>
      ${
        employerNote
          ? `<p style="margin-top:16px"><strong>Note from the employer:</strong></p>
             <p style="background:#f3f4f6;padding:12px 16px;border-radius:8px;font-size:14px;
                        margin:0">${employerNote}</p>`
          : ''
      }
      <p style="color:#6b7280;font-size:13px;margin-top:24px">
        View all your applications on your
        <a href="${env.CLIENT_URL}/seeker/applications" style="color:#2563eb">JobBoard dashboard</a>.
      </p>
    </div>
    `,
  );
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

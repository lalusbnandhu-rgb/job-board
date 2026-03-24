# Job Board — Project Specification

## Overview

A full-featured job board platform where **Employers** post jobs and **Job Seekers** apply, built to
demonstrate real-world fullstack skills for freelancing portfolios.

---

## Tech Stack

| Layer         | Technology                                      |
|---------------|-------------------------------------------------|
| Frontend      | Next.js 15 (App Router), TypeScript             |
| UI Library    | Shadcn/UI + TailwindCSS v4                      |
| State Mgmt    | Zustand + TanStack Query (React Query)          |
| Backend       | Node.js + Express.js (REST API)                 |
| Database      | MongoDB + Mongoose ODM                          |
| Auth          | JWT (Access + Refresh Tokens) + bcrypt          |
| File Uploads  | Multer + Cloudinary (resume/avatar uploads)     |
| Email         | Nodemailer + Handlebars templates               |
| Validation    | Zod (shared frontend + backend)                 |
| Containerised | Docker + Docker Compose                         |
| Deployment    | Vercel (frontend) + Render (backend) + Atlas DB |

---

## User Roles

| Role       | Description                                                  |
|------------|--------------------------------------------------------------|
| Guest      | Browse jobs, view listings (no auth required)                |
| Job Seeker | Register, complete profile, upload resume, apply to jobs     |
| Employer   | Register company, post/manage jobs, view & manage applicants |
| Admin      | Manage users, moderate listings, view analytics dashboard    |

---

## Core Features

### Authentication
- [ ] Register / Login (email + password)
- [ ] Role selection at registration (Seeker or Employer)
- [ ] JWT refresh token rotation
- [ ] Email verification on signup
- [ ] Password reset via email link
- [ ] OAuth (Google sign-in) — optional enhancement

### Job Seeker Features
- [ ] Create and edit profile (bio, skills, location, experience level)
- [ ] Upload/replace resume (PDF, max 5MB via Cloudinary)
- [ ] Upload profile avatar
- [ ] Browse and search jobs (keyword, location, category, type)
- [ ] Filter jobs (full-time, part-time, remote, contract)
- [ ] Save / bookmark jobs
- [ ] Apply to a job with cover letter
- [ ] Track application status (Applied, Reviewed, Shortlisted, Rejected)
- [ ] Notification when application status changes

### Employer Features
- [ ] Create and edit company profile (name, logo, description, website, size)
- [ ] Post new job listing (title, description, requirements, salary range, type)
- [ ] Set job status (Active, Paused, Closed)
- [ ] View all applicants for each job
- [ ] Download applicant resumes
- [ ] Update applicant status (Reviewed, Shortlisted, Rejected)
- [ ] Send email notification to applicant on status change
- [ ] Dashboard with job analytics (views, application count per job)

### Admin Features
- [ ] View all users, jobs, and applications
- [ ] Ban / unban users
- [ ] Delete inappropriate job listings
- [ ] View platform-wide analytics (total jobs, applications, new users per day)

---

## Pages & Routes

### Public (Next.js App Router)

| Route                    | Description                              |
|--------------------------|------------------------------------------|
| `/`                      | Landing page — hero, features, stats     |
| `/jobs`                  | Job listings with search & filter        |
| `/jobs/[id]`             | Single job detail page                   |
| `/companies`             | Browse companies                         |
| `/companies/[id]`        | Company profile page                     |
| `/auth/login`            | Login page                               |
| `/auth/register`         | Registration page (role selection)       |
| `/auth/forgot-password`  | Forgot password page                     |
| `/auth/reset-password`   | Reset password page (token in query)     |

### Job Seeker (Protected)

| Route                    | Description                              |
|--------------------------|------------------------------------------|
| `/seeker/dashboard`      | Overview — saved jobs, recent activity   |
| `/seeker/profile`        | Edit profile and skills                  |
| `/seeker/applications`   | List all applications + status tracking  |
| `/seeker/saved-jobs`     | Bookmarked job listings                  |

### Employer (Protected)

| Route                    | Description                              |
|--------------------------|------------------------------------------|
| `/employer/dashboard`    | Analytics — job views, applicant counts  |
| `/employer/company`      | Edit company profile                     |
| `/employer/jobs`         | List all posted jobs                     |
| `/employer/jobs/new`     | Create new job listing                   |
| `/employer/jobs/[id]/edit` | Edit existing job listing              |
| `/employer/jobs/[id]/applicants` | View and manage applicants       |

### Admin (Protected)

| Route                    | Description                              |
|--------------------------|------------------------------------------|
| `/admin/dashboard`       | Platform analytics overview              |
| `/admin/users`           | Manage all users                         |
| `/admin/jobs`            | Manage all job listings                  |

---

## Data Models (Mongoose)

### User
```
{
  _id, email, passwordHash,
  role: 'seeker' | 'employer' | 'admin',
  isEmailVerified: Boolean,
  isActive: Boolean,
  createdAt, updatedAt
}
```

### SeekerProfile
```
{
  userId (ref: User),
  firstName, lastName, avatar (Cloudinary URL),
  headline, bio, location,
  skills: [String],
  experienceLevel: 'entry' | 'mid' | 'senior',
  resumeUrl (Cloudinary URL), resumeFileName,
  savedJobs: [ref: Job]
}
```

### Company
```
{
  ownerId (ref: User),
  name, slug, logo (Cloudinary URL),
  description, website, industry,
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise',
  location, isVerified: Boolean
}
```

### Job
```
{
  companyId (ref: Company),
  postedBy (ref: User),
  title, slug, description, requirements,
  location, isRemote: Boolean,
  type: 'full-time' | 'part-time' | 'contract' | 'internship',
  category: String,
  salaryMin, salaryMax, salaryCurrency,
  experienceLevel: 'entry' | 'mid' | 'senior',
  status: 'active' | 'paused' | 'closed',
  viewCount: Number,
  applicationCount: Number,
  expiresAt, createdAt, updatedAt
}
```

### Application
```
{
  jobId (ref: Job),
  seekerId (ref: User),
  coverLetter: String,
  resumeUrl: String,
  status: 'applied' | 'reviewed' | 'shortlisted' | 'rejected',
  employerNote: String,
  appliedAt, updatedAt
}
```

### Notification
```
{
  userId (ref: User),
  type: 'application_status' | 'new_applicant' | 'system',
  message: String,
  link: String,
  isRead: Boolean,
  createdAt
}
```

---

## API Endpoints (Express REST)

### Auth — `/api/auth`
```
POST   /register         Register new user
POST   /login            Login, returns access + refresh token
POST   /refresh          Refresh access token
POST   /logout           Invalidate refresh token
POST   /verify-email     Verify email with token
POST   /forgot-password  Send reset email
POST   /reset-password   Set new password
GET    /me               Get current user info
```

### Seeker Profile — `/api/seeker`
```
GET    /profile          Get own profile
PUT    /profile          Update profile
POST   /avatar           Upload avatar
POST   /resume           Upload resume
GET    /saved-jobs       Get saved jobs
POST   /saved-jobs/:jobId     Save a job
DELETE /saved-jobs/:jobId     Unsave a job
```

### Employer / Company — `/api/company`
```
GET    /                 Get own company
POST   /                 Create company profile
PUT    /                 Update company profile
POST   /logo             Upload company logo
GET    /:slug            Get public company profile
```

### Jobs — `/api/jobs`
```
GET    /                 List jobs (search, filter, paginate) — public
GET    /:id              Get single job — public
POST   /                 Create job (employer only)
PUT    /:id              Update job (owner only)
DELETE /:id              Delete job (owner/admin only)
GET    /employer/mine    Get employer's own jobs
```

### Applications — `/api/applications`
```
POST   /                 Apply to a job (seeker only)
GET    /mine             Get seeker's own applications
GET    /job/:jobId       Get all applicants for a job (employer only)
PUT    /:id/status       Update application status (employer only)
```

### Admin — `/api/admin`
```
GET    /stats            Platform analytics
GET    /users            List all users (paginated)
PUT    /users/:id/ban    Ban / unban user
GET    /jobs             List all jobs
DELETE /jobs/:id         Delete a job
```

---

## Folder Structure

```
job-board/
├── SPEC.md                      ← This file
│
├── docker-compose.yml           ← Orchestrates all services
├── .env.example                 ← Environment variable template
│
├── frontend/                    ← Next.js 15 App
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── app/                 ← App Router pages
│   │   │   ├── (public)/        ← Guest routes
│   │   │   ├── (seeker)/        ← Seeker protected routes
│   │   │   ├── (employer)/      ← Employer protected routes
│   │   │   ├── (admin)/         ← Admin protected routes
│   │   │   └── api/             ← Next.js API routes (auth proxy)
│   │   ├── components/
│   │   │   ├── ui/              ← Shadcn/UI base components
│   │   │   ├── jobs/            ← Job card, job list, filters
│   │   │   ├── employer/        ← Employer-specific components
│   │   │   ├── seeker/          ← Seeker-specific components
│   │   │   └── shared/          ← Navbar, footer, sidebar, modals
│   │   ├── lib/
│   │   │   ├── api.ts           ← Axios instance + interceptors
│   │   │   ├── auth.ts          ← Auth helpers
│   │   │   └── utils.ts
│   │   ├── hooks/               ← Custom React hooks
│   │   ├── store/               ← Zustand stores
│   │   ├── types/               ← Shared TypeScript types
│   │   └── schemas/             ← Zod validation schemas
│
└── backend/                     ← Express.js API
    ├── Dockerfile
    ├── package.json
    ├── src/
    │   ├── server.ts            ← Entry point
    │   ├── app.ts               ← Express app setup
    │   ├── config/
    │   │   ├── db.ts            ← MongoDB connection
    │   │   ├── cloudinary.ts
    │   │   └── env.ts           ← Env validation with Zod
    │   ├── routes/              ← Route definitions
    │   ├── controllers/         ← Request handlers
    │   ├── services/            ← Business logic
    │   ├── models/              ← Mongoose models
    │   ├── middleware/
    │   │   ├── auth.ts          ← JWT verify middleware
    │   │   ├── role.ts          ← Role guard middleware
    │   │   ├── upload.ts        ← Multer config
    │   │   └── errorHandler.ts
    │   ├── utils/
    │   │   ├── email.ts         ← Nodemailer helpers
    │   │   └── token.ts         ← JWT helpers
    │   └── types/               ← TypeScript types
    └── tests/                   ← Jest unit + integration tests
```

---

## Docker Setup

### Services in `docker-compose.yml`
```
- frontend   → Next.js dev server on port 3000
- backend    → Express API on port 5000
- mongodb    → MongoDB on port 27017 (local dev only)
- mongo-express → MongoDB GUI on port 8081 (dev only)
```

### Quick Start Commands
```bash
# First time setup — builds images and starts all services
docker compose up --build

# Start existing containers
docker compose up

# Stop all services
docker compose down

# Rebuild a single service
docker compose up --build backend

# View logs
docker compose logs -f backend

# Access MongoDB shell
docker compose exec mongodb mongosh
```

---

## Environment Variables

```bash
# Backend
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/jobboard
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
CLIENT_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Engineering Standards

> These rules govern every phase. Code that violates them must be fixed before merging.

---

### 1. TypeScript Standards

- **Strict mode** is ON (`strict: true`) — no `any`, no `@ts-ignore` without a documented reason
- **Explicit return types** on all exported functions and service methods
- **Discriminated unions** over string enums where values need to carry data
- **Zod** is the single source of truth for runtime validation; infer TS types from schemas (`z.infer<>`)
- **No implicit `undefined`** — use optional chaining and nullish coalescing (`?.`, `??`)
- **Type-only imports** where applicable: `import type { Foo } from './foo'`

```ts
// ✅ Good
export const getJob = async (id: string): Promise<IJob> => { ... };

// ❌ Bad
export const getJob = async (id) => { ... };
```

---

### 2. Naming Conventions

| Artifact              | Convention         | Example                            |
|-----------------------|--------------------|------------------------------------|
| React components      | PascalCase         | `JobCard`, `FilterPanel`           |
| Hooks                 | camelCase + `use`  | `useJobs`, `useAuth`               |
| Files (components)    | kebab-case         | `job-card.tsx`, `filter-panel.tsx` |
| Files (non-component) | kebab-case         | `auth.service.ts`, `job.model.ts`  |
| Constants             | SCREAMING_SNAKE    | `MAX_FILE_SIZE`, `JOB_CATEGORIES`  |
| Types / Interfaces    | PascalCase + `I`   | `IJob`, `IUser`, `JobFilters`      |
| Zod schemas           | camelCase + Schema | `createJobSchema`, `loginSchema`   |
| API route handlers    | verb-first camel   | `getJobs`, `createJob`             |
| DB collections        | plural camelCase   | `users`, `jobs`, `applications`    |

---

### 3. File & Folder Structure Rules

#### Backend
```
src/
  models/       — Mongoose model + IDocument interface (one file per model)
  services/     — Pure business logic, no req/res, fully testable
  controllers/  — Thin: receive req → call service → send res
  routes/       — Router + Zod schema validation + middleware chain
  middleware/   — Reusable Express middleware only
  utils/        — Pure utility functions (no side effects if possible)
  config/       — Env, DB, external service init
  types/        — Shared TS types and Express augmentation
```

- **One responsibility per file** — never mix model + service in one file
- **Services have no Express knowledge** — no `Request`, `Response` imports
- **Controllers have no DB knowledge** — no Mongoose imports

#### Frontend
```
src/
  app/          — Next.js routing only (pages + layouts, minimal logic)
  components/
    ui/         — Primitive, headless-style components (Button, Input, etc.)
                  No business logic. No API calls.
    [feature]/  — Feature-specific compositions (jobs/, seeker/, employer/)
    shared/     — Cross-feature shared components (Navbar, Sidebar, etc.)
  hooks/        — Custom hooks encapsulating data-fetching or logic
  lib/          — Pure utilities + Axios instance
  store/        — Zustand stores (state only, no side effects)
  schemas/      — Zod schemas + inferred types
  types/        — Global TypeScript types
```

- **Pages are orchestrators** — they compose components and call hooks, not APIs directly
- **Hooks own data fetching** — use TanStack Query hooks (`useQuery`, `useMutation`)
- **Components are display-only** — receive data via props, emit events via callbacks
- **No inline styles** — TailwindCSS classes only; use `cn()` for conditional classes

---

### 4. Component Design Rules

#### Atomic structure
```
ui/         → atoms (Button, Input, Badge, Spinner)
[feature]/  → molecules (JobCard, ApplicantRow) — composed from atoms
shared/     → organisms (Navbar, JobFilters) — composed from molecules
app/        → pages — composed from organisms + hooks
```

#### Reusability checklist before writing a component
- [ ] Does it have **one clear purpose**?
- [ ] Are **all data inputs props** (not internal fetches)?
- [ ] Is it **presentation-only** (no side effects in render)?
- [ ] Does it have a **meaningful displayName**?
- [ ] Are **callbacks named `onXxx`**? (`onApply`, `onSave`)

```tsx
// ✅ Reusable — pure display, data from outside
interface JobCardProps {
  job: JobSummary;
  isSaved?: boolean;
  onSave?: (jobId: string) => void;
}

// ❌ Tightly coupled — hard to reuse or test
const JobCard = () => {
  const { data } = useQuery(...); // fetches its own data
  ...
};
```

---

### 5. API Response Standards

All API responses follow a consistent shape:

#### Success — single resource
```json
{ "user": { ... } }
```

#### Success — list/paginated
```json
{
  "jobs": [ ... ],
  "pagination": {
    "total": 142,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### Error
```json
{ "message": "Human-readable error description" }
```

#### Validation error
```json
{
  "message": "Validation failed",
  "errors": { "email": ["Invalid email address"] }
}
```

#### HTTP Status codes used
| Code | Meaning                           |
|------|-----------------------------------|
| 200  | OK                                |
| 201  | Created                           |
| 204  | No content (DELETE success)       |
| 400  | Bad request / validation failed   |
| 401  | Unauthenticated                   |
| 403  | Authenticated but not authorised  |
| 404  | Resource not found                |
| 409  | Conflict (duplicate resource)     |
| 422  | Unprocessable entity              |
| 429  | Rate limit exceeded               |
| 500  | Internal server error             |

---

### 6. Security Standards

> ✅ = implemented · ⏳ = planned for a future phase · ❌ = known gap (do not skip)

---

#### 6.1 Transport & Headers

| Rule | Status |
|------|--------|
| **Helmet** sets secure HTTP headers (X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy) on every response | ✅ |
| **CORS** origin restricted to `CLIENT_URL` env var — credentials-enabled, explicit methods/headers whitelist | ✅ |
| **Helmet CSP** (Content-Security-Policy) configured explicitly — default-src 'self', script-src 'self', no unsafe-inline | ⏳ Phase 9 |
| **HTTPS only** in staging/production — `CLIENT_URL` must be `https://` in non-development envs | ⏳ Phase 9 |
| All API responses include `Cache-Control: no-store` for authenticated endpoints | ⏳ Phase 9 |

**CORS configuration reference (already in `app.ts`):**
```ts
app.use(cors({
  origin: env.CLIENT_URL,          // single, explicit origin — never '*'
  credentials: true,               // required for refresh token cookie (future)
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
```

---

#### 6.2 Rate Limiting

All limits are applied with `express-rate-limit`. IPs behind a proxy use `req.ip` (trust proxy enabled).

| Route group | Limit | Window | Status |
|-------------|-------|--------|--------|
| Global `/api/*` | 100 req | 15 min | ✅ |
| `POST /api/auth/login` | 10 req | 15 min | ⏳ Phase 9 |
| `POST /api/auth/register` | 5 req | 1 hour | ⏳ Phase 9 |
| `POST /api/auth/forgot-password` | 3 req | 1 hour | ⏳ Phase 9 |
| `POST /api/auth/reset-password` | 3 req | 1 hour | ⏳ Phase 9 |
| `POST /api/seeker/avatar` | 10 req | 1 hour | ⏳ Phase 9 |
| `POST /api/seeker/resume` | 10 req | 1 hour | ⏳ Phase 9 |
| `POST /api/applications` | 30 req | 1 hour | ⏳ Phase 9 |
| `POST /api/jobs` (employer) | 20 req | 1 hour | ⏳ Phase 9 |

Rate limit responses return HTTP **429** with a `Retry-After` header. The error body follows the standard `{ error, code }` shape:
```json
{ "error": "Too many requests. Please try again later.", "code": "RATE_LIMIT_EXCEEDED" }
```

---

#### 6.3 Authentication & Token Security

| Rule | Status |
|------|--------|
| **Passwords hashed** with bcrypt, cost factor 12 | ✅ |
| **Password requirements**: min 8 chars, ≥1 uppercase, ≥1 digit | ✅ |
| **JWT access tokens**: 15-minute expiry, signed with `JWT_SECRET` | ✅ |
| **JWT refresh tokens**: 7-day expiry, signed with `JWT_REFRESH_SECRET` (different secret) | ✅ |
| **Refresh tokens stored as SHA-256 hashes** in DB — raw value never persisted | ✅ |
| **Refresh token rotation** on every use — old token invalidated, new one issued | ✅ |
| **Max 5 concurrent sessions** per user — oldest token evicted on overflow | ✅ |
| **All sessions cleared** when password is reset | ✅ |
| `JWT_SECRET` and `JWT_REFRESH_SECRET` must be different — validated at startup | ⏳ Phase 9 |
| Both secrets must be ≥ 32 chars — enforced by Zod in `config/env.ts` | ✅ |
| **Account lockout**: after 10 consecutive failed login attempts, lock for 30 min | ⏳ Phase 9 |
| Store `failedLoginAttempts` + `lockUntil` on User model | ⏳ Phase 9 |
| **Email verification required** before first login | ✅ |
| **Password reset tokens expire** in 1 hour — single use | ✅ |
| httpOnly cookie for refresh token (upgrade from localStorage) | ⏳ Post-MVP |

**Account lockout schema fields (to add in Phase 9):**
```ts
failedLoginAttempts: { type: Number, default: 0 }
lockUntil: { type: Date, default: null }
```

---

#### 6.4 Input Validation & Sanitisation

| Rule | Status |
|------|--------|
| **All request bodies validated with Zod** via `validate()` middleware before reaching service layer | ✅ |
| **Query parameters validated** with Zod on all list/filter endpoints (page, limit, status enums) | ⏳ Phase 9 |
| **MongoDB ObjectId format** validated (`z.string().regex(/^[a-f\d]{24}$/i)`) for all `:id` params | ⏳ Phase 9 |
| **Never pass raw `req.query` / `req.params` to Mongoose** — always parse through schema first | ✅ (body) · ⏳ (params) |
| **No `$where` / `eval`** in any Mongoose query — zero raw user input to query operators | ✅ |
| **Salary values capped** — `salaryMax` ≤ 10,000,000 in job schema | ⏳ Phase 9 |
| **HTML in rich-text fields** (description, bio) stripped server-side before storage | ⏳ Phase 9 |
| **Skills array** deduplicated and trimmed before save | ⏳ Phase 9 |

**Validate query params pattern (to use in Phase 9):**
```ts
const listQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['applied','reviewed','shortlisted','rejected']).optional(),
});
// In route: validate({ query: listQuerySchema })
```

---

#### 6.5 Authorisation

| Rule | Status |
|------|--------|
| Every protected route applies `authenticate` then `requireRole()` middleware | ✅ |
| **Resource ownership** checked in service layer — user can only mutate their own resources | ✅ (jobs/profile) · ⏳ (applications) |
| Employers can only update/delete **their own** job listings | ✅ |
| Seekers can only read **their own** applications and profile | ✅ |
| Admin role bypasses ownership checks on jobs (delete any) | ✅ |
| **Never trust client-supplied `userId`** — always derive from `req.user._id` (decoded JWT) | ✅ |

---

#### 6.6 File Upload Security

| Rule | Status |
|------|--------|
| **MIME type whitelist**: avatars → `image/jpeg`, `image/png`, `image/webp`; resumes → `application/pdf` | ✅ |
| **File size limits**: avatar 2 MB, resume 5 MB — enforced by Multer before buffer reaches service | ✅ |
| **Memory storage** — files never written to disk on the server | ✅ |
| **Magic bytes validation** — verify actual file signature, not just MIME header (e.g., PDF starts with `%PDF`) | ⏳ Phase 9 |
| **Old file deleted from Cloudinary** before new upload replaces it | ✅ |
| **Rate limit** on upload endpoints (see §6.2) | ⏳ Phase 9 |
| File names sanitised before storing `resumeFileName` — strip path traversal characters | ⏳ Phase 9 |

**Magic bytes check pattern (to add in Phase 9):**
```ts
function assertPdf(buffer: Buffer) {
  if (buffer.slice(0, 4).toString() !== '%PDF')
    throw new ApiError(400, 'File is not a valid PDF');
}
```

---

#### 6.7 Error Handling & Information Leakage

| Rule | Status |
|------|--------|
| **Stack traces never sent to client** in production — only safe `message` | ✅ |
| **Email enumeration prevention** on forgot-password — always returns 200 | ✅ |
| **Generic error on invalid credentials** — "Invalid email or password" (not "user not found") | ✅ |
| Zod validation errors return field map — acceptable for UX, not a vulnerability | ✅ |
| Morgan access logs use `combined` format in production, `dev` in development | ✅ |
| **Audit log** for sensitive events (failed logins, role violations, admin actions) | ⏳ Phase 9 |

---

#### 6.8 Infrastructure & Docker Security

| Rule | Status |
|------|--------|
| All services on an isolated **custom bridge network** — not `host` | ✅ |
| **Mongo Express** exposed on port 8081 in dev only — remove from production `docker-compose.prod.yml` | ⏳ Phase 9 |
| **MongoDB port 27017** not exposed to host in production — internal service name only | ⏳ Phase 9 |
| **MongoDB authentication** (`MONGO_INITDB_ROOT_USERNAME` / `PASSWORD`) set in production compose | ⏳ Phase 9 |
| **No secrets committed to git** — `.env` in `.gitignore`, only `.env.example` tracked | ✅ |
| Container resource limits (`mem_limit`, `cpus`) set for production deploy | ⏳ Phase 9 |
| Separate `docker-compose.prod.yml` that strips dev tools and enforces HTTPS | ⏳ Phase 9 |

---

#### 6.9 Frontend Security

| Rule | Status |
|------|--------|
| **Access token in Zustand memory only** — never `localStorage`, never cookies | ✅ |
| **Refresh token in `localStorage`** (acceptable SPA trade-off; httpOnly cookie in prod upgrade) | ✅ |
| **Silent 401 refresh** with queued requests — prevents parallel refresh race condition | ✅ |
| **All user-generated content escaped** by React's default JSX rendering | ✅ |
| API base URL from `NEXT_PUBLIC_API_URL` env var only — never hardcoded | ✅ |
| No sensitive data in URL query params (password-reset token is single-use, acceptable) | ✅ |
| `next/headers` CSP header set in `next.config.ts` | ⏳ Phase 9 |
| Dependency audit (`pnpm audit`) run before each release | ⏳ Phase 9 |

---

#### 6.10 Environment Variable Requirements

| Variable | Requirement | Notes |
|----------|-------------|-------|
| `JWT_SECRET` | ≥ 32 chars, random | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | ≥ 32 chars, random, **different from JWT_SECRET** | `openssl rand -hex 32` |
| `MONGODB_URI` | Includes auth credentials in production | `mongodb://user:pass@host:27017/db` |
| `CLIENT_URL` | Must be `https://` in production | Validated by Zod |
| `NODE_ENV` | `production` in production — gates stack traces | |
| `CLOUDINARY_*` | Required in production — dev falls back to placeholder | |
| `EMAIL_*` | Required in production — dev falls back to console log | |

Generate secrets:
```bash
openssl rand -hex 32   # 64 hex chars — use for JWT_SECRET and JWT_REFRESH_SECRET
```

---

### 7. Error Handling Standards

#### Backend
- All async route handlers wrapped by `express-async-errors` — no try/catch needed in controllers
- Throw `ApiError(statusCode, message)` for known errors in services
- Unknown errors are caught by the global error handler in `app.ts`
- Log full stack traces server-side; send safe message to client

```ts
// ✅ In service
if (!job) throw new ApiError(404, 'Job not found');

// ✅ Controller stays clean
export const getJob = async (req: Request, res: Response) => {
  const job = await jobService.getById(req.params.id);
  res.json({ job });
};
```

#### Frontend
- **TanStack Query** handles loading / error states for all data fetching
- Every `useMutation` has an `onError` callback that sets user-visible error state
- **No silent failures** — all caught errors must be surfaced to the user (toast or inline)
- Use a `useToast` hook for transient notifications (success / error)

---

### 8. Pagination Standard

All list endpoints accept these query params:

```
GET /api/jobs?page=1&limit=20&sort=createdAt&order=desc
```

Backend returns:

```ts
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
```

Frontend uses TanStack Query's `keepPreviousData: true` for smooth pagination UX.

---

### 9. Data Fetching Patterns (Frontend)

- **Always use a custom hook** — never call `api.get(...)` directly in a page or component
- **TanStack Query** for all server state; **Zustand** for client-only state

```ts
// ✅ Always wrap in a hook
export const useJobs = (filters: JobFilters) =>
  useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobsApi.list(filters),
    staleTime: 30_000,
  });

// ❌ Don't fetch in component directly
const MyPage = () => {
  useEffect(() => { api.get('/jobs').then(...) }, []);
};
```

---

### 10. Git Commit Convention

```
feat: add job search with filters
fix: correct pagination total count
refactor: extract JobCard into reusable component
style: align filter panel spacing
test: add auth service unit tests
docs: update spec with security standards
chore: upgrade mongoose to v8.9
```

---

## Development Milestones

| Phase | Status      | Scope                                              |
|-------|-------------|----------------------------------------------------|
| 1     | ✅ Done     | Project scaffold, Docker setup, DB connection      |
| 2     | ✅ Done     | Auth system (register, login, JWT, email verify)   |
| 3     | ✅ Done     | Job listings — CRUD, search, filter, pagination    |
| 4     | ✅ Done     | Seeker profile, resume upload, apply flow          |
| 5     | ✅ Done     | Employer dashboard, job create/edit, applicant management |
| 6     | ✅ Done     | Email notifications on status change, admin panel + analytics |
| 7     | ⏳ Pending  | UI polish, responsive design, dark mode            |
| 8     | ⏳ Pending  | Full test coverage                                 |
| 9     | ⏳ Pending  | Security hardening, production hardening, full test coverage |

### Phase 9 Security Hardening Checklist

#### Rate Limiting (§6.2)
- [ ] Per-route rate limiters for `login`, `register`, `forgot-password`, `reset-password`
- [ ] Rate limiters for upload endpoints (`/seeker/avatar`, `/seeker/resume`)
- [ ] Rate limiter for `POST /applications`

#### Authentication Hardening (§6.3)
- [ ] Validate `JWT_SECRET !== JWT_REFRESH_SECRET` on startup (`config/env.ts`)
- [ ] Account lockout: add `failedLoginAttempts` + `lockUntil` to User model
- [ ] Increment `failedLoginAttempts` on bad password; lock at 10; auto-unlock after 30 min
- [ ] Reset `failedLoginAttempts` to 0 on successful login

#### Input Validation (§6.4)
- [ ] Zod query-param schema for all list endpoints (`page`, `limit`, status enums, sort)
- [ ] MongoDB ObjectId regex validator (`z.string().regex(/^[a-f\d]{24}$/i)`) for all `:id` params
- [ ] Cap `salaryMax` ≤ 10,000,000 in job schema
- [ ] Deduplicate + trim skills array in seeker service before upsert
- [ ] Strip HTML tags from `description`, `bio`, `requirements` before storage (use `sanitize-html`)

#### File Upload Security (§6.6)
- [ ] Magic bytes validation for PDF (`%PDF` signature) and images (JPEG `FFD8FF`, PNG `89504E47`)
- [ ] Sanitise `resumeFileName` — strip path separators and non-ASCII before storing

#### Transport & Headers (§6.1)
- [ ] Explicit Helmet CSP in `app.ts` — `default-src 'self'`, no `unsafe-inline`
- [ ] `Cache-Control: no-store` header on all authenticated API responses
- [ ] Validate `CLIENT_URL` is `https://` when `NODE_ENV === 'production'` in env config
- [ ] `next.config.ts` security headers (CSP, X-Frame-Options, HSTS) via `headers()` function

#### Infrastructure (§6.8)
- [ ] `docker-compose.prod.yml` — remove Mongo Express, close MongoDB host port, add auth, add TLS
- [ ] MongoDB auth: `MONGO_INITDB_ROOT_USERNAME` + `MONGO_INITDB_ROOT_PASSWORD` in prod compose
- [ ] Container resource limits (`mem_limit: 512m`, `cpus: '0.5'`) on all services
- [ ] `pnpm audit --prod` step in CI pipeline before build

#### Observability (§6.7)
- [ ] Structured audit log for: failed logins, role violations, admin actions (use `winston` or `pino`)
- [ ] Log `userId`, `ip`, `route`, `method`, `statusCode` on every 4xx response

---

## Nice-to-Have Enhancements (Post-MVP)

- [ ] Full-text search with MongoDB Atlas Search
- [ ] Google OAuth login
- [ ] Skill-based job recommendations
- [ ] Job alert subscriptions (email digest)
- [ ] Public seeker profile shareable link
- [ ] Employer featured job listings (paid tier)
- [ ] CV builder / export to PDF

---

*Spec version: 3.0 | Stack: Next.js 15 + Express + MongoDB + Docker | pnpm workspace*

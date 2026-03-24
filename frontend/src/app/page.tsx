import Link from 'next/link';
import {
  Search,
  Briefcase,
  Users,
  Building2,
  ArrowRight,
  CheckCircle2,
  Code2,
  Palette,
  BarChart3,
  Megaphone,
  DollarSign,
  Settings,
  Shield,
  Headphones,
  Database,
  Cloud,
} from 'lucide-react';
import { Navbar } from '@/components/shared/navbar';

// ── Static data ───────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Open Positions', value: '2,400+' },
  { label: 'Companies Hiring', value: '380+' },
  { label: 'Placements Made', value: '12,000+' },
  { label: 'Job Categories', value: '14' },
];

const HOW_IT_WORKS_SEEKER = [
  {
    step: '01',
    title: 'Create your profile',
    desc: 'Upload your resume, add your skills, and write a short bio. It takes under 5 minutes.',
  },
  {
    step: '02',
    title: 'Discover opportunities',
    desc: 'Search by keyword, location, category, or remote preference. Save roles you like.',
  },
  {
    step: '03',
    title: 'Apply with one click',
    desc: 'Send your application with a cover letter. Track every status update from your dashboard.',
  },
];

const HOW_IT_WORKS_EMPLOYER = [
  {
    step: '01',
    title: 'Set up your company',
    desc: 'Build your company profile with logo, description, and culture highlights.',
  },
  {
    step: '02',
    title: 'Post your listing',
    desc: 'Write a detailed job post with salary range, requirements, and tags to attract the right talent.',
  },
  {
    step: '03',
    title: 'Manage applicants',
    desc: 'Review applications, shortlist candidates, and update statuses — all from one dashboard.',
  },
];

const CATEGORIES = [
  { label: 'Engineering', icon: Code2, color: 'bg-blue-50 text-blue-600' },
  { label: 'Design', icon: Palette, color: 'bg-purple-50 text-purple-600' },
  { label: 'Data & Analytics', icon: BarChart3, color: 'bg-cyan-50 text-cyan-600' },
  { label: 'Marketing', icon: Megaphone, color: 'bg-orange-50 text-orange-600' },
  { label: 'Finance', icon: DollarSign, color: 'bg-green-50 text-green-600' },
  { label: 'Operations', icon: Settings, color: 'bg-amber-50 text-amber-600' },
  { label: 'Security', icon: Shield, color: 'bg-red-50 text-red-600' },
  { label: 'Customer Support', icon: Headphones, color: 'bg-teal-50 text-teal-600' },
  { label: 'DevOps', icon: Cloud, color: 'bg-indigo-50 text-indigo-600' },
  { label: 'Product', icon: Database, color: 'bg-pink-50 text-pink-600' },
];

const FEATURES = [
  {
    icon: CheckCircle2,
    title: 'Verified companies',
    desc: 'Every employer goes through a verification process before their listings go live.',
  },
  {
    icon: Briefcase,
    title: 'Full-time & contract',
    desc: 'Filter by job type — full-time, part-time, contract, or internship in one place.',
  },
  {
    icon: Users,
    title: 'Real-time status',
    desc: 'Applicants receive email updates when employers review, shortlist, or reject applications.',
  },
  {
    icon: Building2,
    title: 'Company profiles',
    desc: "See team size, industry, and culture before you apply — not after you're hired.",
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
        {/* Subtle grid overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            2,400+ open positions right now
          </span>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Find work that{' '}
            <span className="relative">
              <span className="relative z-10 text-yellow-300">excites you</span>
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-2 w-full rounded bg-yellow-300/30"
              />
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100 sm:text-xl">
            JobBoard connects ambitious professionals with the companies building the future.
            Search thousands of roles — remote, hybrid, and on-site.
          </p>

          {/* Search bar — submits to /jobs?search=... */}
          <form action="/jobs" className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                name="search"
                type="text"
                placeholder="Job title, keyword, or company…"
                className="h-14 w-full rounded-2xl bg-white pl-12 pr-4 text-base text-gray-900 shadow-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-8 font-bold text-gray-900 shadow-lg transition hover:bg-yellow-300 active:scale-95"
            >
              Search Jobs
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>

          <p className="mt-4 text-sm text-blue-200">
            Popular:{' '}
            {['Engineering', 'Design', 'Remote', 'Product', 'DevOps'].map((term, i) => (
              <span key={term}>
                <Link
                  href={`/jobs?${term === 'Remote' ? 'isRemote=true' : `category=${encodeURIComponent(term)}`}`}
                  className="text-white underline underline-offset-2 hover:text-yellow-300"
                >
                  {term}
                </Link>
                {i < 4 && <span className="mx-1.5 opacity-40">·</span>}
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-gray-200 lg:grid-cols-4">
          {STATS.map(({ label, value }) => (
            <div key={label} className="px-6 py-7 text-center">
              <p className="text-3xl font-extrabold text-gray-900">{value}</p>
              <p className="mt-1 text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Browse by category ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Browse by category</h2>
            <p className="mt-2 text-gray-500">
              Find roles across every discipline — from startups to enterprise.
            </p>
          </div>
          <Link
            href="/jobs"
            className="hidden items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 sm:flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map(({ label, icon: Icon, color }) => (
            <Link
              key={label}
              href={`/jobs?category=${encodeURIComponent(label)}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`rounded-xl p-3 ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Why JobBoard ────────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Why JobBoard?</h2>
            <p className="mt-2 text-gray-500">
              Built from the ground up for both seekers and employers.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{title}</p>
                  <p className="mt-1 text-sm text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Get started in minutes</h2>
          <p className="mt-2 text-gray-500">Two paths, one platform.</p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Seekers */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-blue-600 p-2.5">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">For Job Seekers</h3>
            </div>
            <ol className="space-y-6">
              {HOW_IT_WORKS_SEEKER.map(({ step, title, desc }) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {step}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">{title}</p>
                    <p className="mt-0.5 text-sm text-gray-600">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Find a job <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Employers */}
          <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-violet-600 p-2.5">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">For Employers</h3>
            </div>
            <ol className="space-y-6">
              {HOW_IT_WORKS_EMPLOYER.map(({ step, title, desc }) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                    {step}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">{title}</p>
                    <p className="mt-0.5 text-sm text-gray-600">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link
              href="/register?role=employer"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              Post a job <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to make your next move?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Join thousands of professionals who found their next role on JobBoard.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-bold text-blue-700 shadow-lg transition hover:bg-blue-50"
            >
              Browse open roles
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Create free account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xl font-extrabold tracking-tight">
            Job<span className="text-blue-600">Board</span>
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/jobs" className="hover:text-gray-900">
              Browse Jobs
            </Link>
            <Link href="/register?role=employer" className="hover:text-gray-900">
              For Employers
            </Link>
            <Link href="/login" className="hover:text-gray-900">
              Sign In
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} JobBoard. Portfolio project.
          </p>
        </div>
      </footer>
    </div>
  );
}

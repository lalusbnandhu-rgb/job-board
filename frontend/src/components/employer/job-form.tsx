'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SkillsInput } from '@/components/ui/skills-input';
import {
  JOB_TYPES,
  JOB_EXPERIENCE_LEVELS,
  JOB_STATUSES,
  JOB_CATEGORIES,
  SALARY_CURRENCIES,
} from '@/types/jobs';
import type { Job } from '@/types/jobs';

// ── Zod schema (mirrors backend createJobSchema) ─────────────────────────────

const jobFormSchema = z
  .object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(150),
    description: z.string().min(50, 'Description must be at least 50 characters').max(10_000),
    requirements: z.string().min(20, 'Requirements must be at least 20 characters').max(5_000),
    location: z.string().min(2, 'Location is required').max(100),
    isRemote: z.boolean().default(false),
    type: z.enum(JOB_TYPES, { required_error: 'Job type is required' }),
    category: z.enum(JOB_CATEGORIES, { required_error: 'Category is required' }),
    salaryMin: z.coerce.number().int().min(0).max(10_000_000).optional().or(z.literal('')),
    salaryMax: z.coerce.number().int().min(0).max(10_000_000).optional().or(z.literal('')),
    salaryCurrency: z.enum(SALARY_CURRENCIES).default('USD'),
    experienceLevel: z.enum(JOB_EXPERIENCE_LEVELS, { required_error: 'Experience level is required' }),
    status: z.enum(JOB_STATUSES).optional(),
    tags: z.array(z.string().max(30)).max(10).default([]),
    expiresAt: z.string().optional(),
  })
  .refine(
    (d) => {
      const min = d.salaryMin === '' ? undefined : d.salaryMin;
      const max = d.salaryMax === '' ? undefined : d.salaryMax;
      if (min !== undefined && max !== undefined) return max >= min;
      return true;
    },
    { message: 'Max salary must be ≥ min salary', path: ['salaryMax'] },
  );

export type JobFormValues = z.infer<typeof jobFormSchema>;

// ── Label helpers ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
};

const LEVEL_LABELS: Record<string, string> = {
  entry: 'Entry level',
  mid: 'Mid level',
  senior: 'Senior level',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  closed: 'Closed',
};

// ── Shared form section wrapper ───────────────────────────────────────────────

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ── Shared select style ───────────────────────────────────────────────────────

const selectClass =
  'flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 hover:border-gray-300';

const textareaClass =
  'flex w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 hover:border-gray-300';

// ── Props ─────────────────────────────────────────────────────────────────────

interface JobFormProps {
  /** Existing job data when editing */
  defaultJob?: Job;
  onSubmit: (data: JobFormValues) => Promise<void>;
  isSubmitting: boolean;
  isError: boolean;
  submitLabel: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JobForm({ defaultJob, onSubmit, isSubmitting, isError, submitLabel }: JobFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: '',
      description: '',
      requirements: '',
      location: '',
      isRemote: false,
      type: 'full-time',
      category: 'Engineering',
      salaryMin: '',
      salaryMax: '',
      salaryCurrency: 'USD',
      experienceLevel: 'mid',
      status: 'active',
      tags: [],
      expiresAt: '',
    },
  });

  // Pre-populate fields when editing
  useEffect(() => {
    if (defaultJob) {
      reset({
        title: defaultJob.title,
        description: defaultJob.description,
        requirements: defaultJob.requirements,
        location: defaultJob.location,
        isRemote: defaultJob.isRemote,
        type: defaultJob.type,
        category: defaultJob.category,
        salaryMin: defaultJob.salaryMin ?? '',
        salaryMax: defaultJob.salaryMax ?? '',
        salaryCurrency: (defaultJob.salaryCurrency as (typeof SALARY_CURRENCIES)[number]) ?? 'USD',
        experienceLevel: defaultJob.experienceLevel,
        status: defaultJob.status,
        tags: defaultJob.tags ?? [],
        expiresAt: defaultJob.expiresAt
          ? new Date(defaultJob.expiresAt).toISOString().split('T')[0]
          : '',
      });
    }
  }, [defaultJob, reset]);

  const descriptionValue = watch('description');
  const requirementsValue = watch('requirements');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic info */}
      <FormSection
        title="Job Details"
        description="Core information that appears on the listing."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="title" required>
              Job Title
            </Label>
            <Input
              id="title"
              placeholder="e.g. Senior Frontend Engineer"
              {...register('title')}
              error={errors.title?.message}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="type" required>
              Job Type
            </Label>
            <select id="type" className={selectClass} {...register('type')}>
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            {errors.type && <p className="text-xs text-red-600">{errors.type.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category" required>
              Category
            </Label>
            <select id="category" className={selectClass} {...register('category')}>
              {JOB_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-600">{errors.category.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="experienceLevel" required>
              Experience Level
            </Label>
            <select id="experienceLevel" className={selectClass} {...register('experienceLevel')}>
              {JOB_EXPERIENCE_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {LEVEL_LABELS[l]}
                </option>
              ))}
            </select>
            {errors.experienceLevel && (
              <p className="text-xs text-red-600">{errors.experienceLevel.message}</p>
            )}
          </div>

          {/* Status — only shown when editing */}
          {defaultJob && (
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select id="status" className={selectClass} {...register('status')}>
                {JOB_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </FormSection>

      {/* Location */}
      <FormSection title="Location">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="location" required>
              Office Location
            </Label>
            <Input
              id="location"
              placeholder="e.g. London, UK"
              {...register('location')}
              error={errors.location?.message}
            />
          </div>
          <div className="flex items-center gap-3 pt-7">
            <input
              id="isRemote"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 accent-blue-600"
              {...register('isRemote')}
            />
            <Label htmlFor="isRemote" className="cursor-pointer select-none">
              Remote / fully remote option available
            </Label>
          </div>
        </div>
      </FormSection>

      {/* Salary */}
      <FormSection
        title="Compensation"
        description="Optional — leave blank to show 'Competitive salary'."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="salaryMin">Min Salary</Label>
            <Input
              id="salaryMin"
              type="number"
              min={0}
              placeholder="e.g. 60000"
              {...register('salaryMin')}
              error={errors.salaryMin?.message}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salaryMax">Max Salary</Label>
            <Input
              id="salaryMax"
              type="number"
              min={0}
              placeholder="e.g. 90000"
              {...register('salaryMax')}
              error={errors.salaryMax?.message}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salaryCurrency">Currency</Label>
            <select id="salaryCurrency" className={selectClass} {...register('salaryCurrency')}>
              {SALARY_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FormSection>

      {/* Description */}
      <FormSection
        title="Job Description"
        description="Describe the role, responsibilities, and what a typical day looks like."
      >
        <div className="space-y-1.5">
          <textarea
            id="description"
            rows={10}
            placeholder="What will the successful candidate be doing day-to-day?..."
            className={textareaClass}
            {...register('description')}
          />
          <div className="flex items-center justify-between">
            {errors.description ? (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-gray-400">{descriptionValue?.length ?? 0} / 10,000</p>
          </div>
        </div>
      </FormSection>

      {/* Requirements */}
      <FormSection
        title="Requirements"
        description="List qualifications, skills, and experience expected from applicants."
      >
        <div className="space-y-1.5">
          <textarea
            id="requirements"
            rows={6}
            placeholder="- 3+ years of React experience&#10;- Strong TypeScript skills&#10;- Comfortable with REST APIs..."
            className={textareaClass}
            {...register('requirements')}
          />
          <div className="flex items-center justify-between">
            {errors.requirements ? (
              <p className="text-xs text-red-600">{errors.requirements.message}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-gray-400">{requirementsValue?.length ?? 0} / 5,000</p>
          </div>
        </div>
      </FormSection>

      {/* Tags */}
      <FormSection
        title="Tags"
        description="Add up to 10 keywords to help seekers find this listing (e.g. React, Node.js, Remote)."
      >
        <Controller
          name="tags"
          control={control}
          render={({ field }) => (
            <SkillsInput
              value={field.value}
              onChange={field.onChange}
              placeholder="e.g. React, TypeScript, AWS"
              maxSkills={10}
              error={errors.tags?.message}
            />
          )}
        />
      </FormSection>

      {/* Expiry */}
      <FormSection
        title="Listing Expiry"
        description="Optional — the listing will close automatically on this date."
      >
        <div className="space-y-1.5 max-w-xs">
          <Label htmlFor="expiresAt">Expiry Date</Label>
          <Input id="expiresAt" type="date" {...register('expiresAt')} />
        </div>
      </FormSection>

      {/* Save bar */}
      <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        {isError ? (
          <span className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            Failed to save. Please check the form and try again.
          </span>
        ) : isDirty ? (
          <span className="flex items-center gap-2 text-sm text-amber-600">
            <CheckCircle2 className="h-4 w-4 opacity-0" />
            You have unsaved changes.
          </span>
        ) : (
          <span />
        )}
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

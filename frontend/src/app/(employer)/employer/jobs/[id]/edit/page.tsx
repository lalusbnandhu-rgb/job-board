'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { JobForm } from '@/components/employer/job-form';
import { useJobById, useUpdateJob } from '@/hooks/use-employer';
import { Spinner } from '@/components/ui/spinner';
import type { JobFormValues } from '@/components/employer/job-form';

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: job, isLoading } = useJobById(id);
  const updateJob = useUpdateJob(id);

  const handleSubmit = async (data: JobFormValues) => {
    const payload = {
      ...data,
      salaryMin: data.salaryMin === '' ? undefined : Number(data.salaryMin),
      salaryMax: data.salaryMax === '' ? undefined : Number(data.salaryMax),
      expiresAt: data.expiresAt
        ? new Date(data.expiresAt).toISOString()
        : undefined,
    };
    await updateJob.mutateAsync(payload);
    router.push('/employer/jobs');
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-24 text-center text-gray-500">
        <p>Job not found or you don&apos;t have permission to edit it.</p>
        <Link
          href="/employer/jobs"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/employer/jobs"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Job Listing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Changes are published immediately after saving.
        </p>
      </div>

      <JobForm
        defaultJob={job}
        onSubmit={handleSubmit}
        isSubmitting={updateJob.isPending}
        isError={updateJob.isError}
        submitLabel="Save Changes"
      />
    </div>
  );
}

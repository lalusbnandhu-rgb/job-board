'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { JobForm } from '@/components/employer/job-form';
import { useCreateJob } from '@/hooks/use-employer';
import type { JobFormValues } from '@/components/employer/job-form';

export default function NewJobPage() {
  const router = useRouter();
  const createJob = useCreateJob();

  const handleSubmit = async (data: JobFormValues) => {
    const payload = {
      ...data,
      salaryMin: data.salaryMin === '' ? undefined : Number(data.salaryMin),
      salaryMax: data.salaryMax === '' ? undefined : Number(data.salaryMax),
      expiresAt: data.expiresAt
        ? new Date(data.expiresAt).toISOString()
        : undefined,
    };
    await createJob.mutateAsync(payload);
    router.push('/employer/jobs');
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your listing will be live immediately after posting.
        </p>
      </div>

      <JobForm
        onSubmit={handleSubmit}
        isSubmitting={createJob.isPending}
        isError={createJob.isError}
        submitLabel="Post Job"
      />
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import Image from 'next/image';
import { useMyCompany, useUpsertCompany, useUploadCompanyLogo } from '@/hooks/use-employer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { COMPANY_SIZES } from '@/types/employer';

const companySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(2000).optional(),
  website: z
    .string()
    .url('Enter a valid URL (e.g. https://acme.com)')
    .optional()
    .or(z.literal('')),
  industry: z.string().max(80).optional(),
  size: z.enum(COMPANY_SIZES).optional().or(z.literal('')),
  location: z.string().max(100).optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

const SIZE_LABELS: Record<string, string> = {
  startup: 'Startup (1–10)',
  small: 'Small (11–50)',
  medium: 'Medium (51–200)',
  large: 'Large (201–1000)',
  enterprise: 'Enterprise (1000+)',
};

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

export default function EmployerCompanyPage() {
  const { data: company, isLoading } = useMyCompany();
  const upsertCompany = useUpsertCompany();
  const uploadLogo = useUploadCompanyLogo();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      description: '',
      website: '',
      industry: '',
      size: '',
      location: '',
    },
  });

  useEffect(() => {
    if (company) {
      reset({
        name: company.name ?? '',
        description: company.description ?? '',
        website: company.website ?? '',
        industry: company.industry ?? '',
        size: company.size ?? '',
        location: company.location ?? '',
      });
    }
  }, [company, reset]);

  const onSubmit = async (data: CompanyFormValues) => {
    await upsertCompany.mutateAsync(data);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    reset(data);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadLogo.mutateAsync(file);
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your company profile is shown to job seekers on every listing.
        </p>
      </div>

      {/* Logo upload */}
      <FormSection
        title="Company Logo"
        description="Square image recommended. JPG, PNG or WebP · Max 2MB."
      >
        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24 shrink-0">
            {company?.logo ? (
              <Image
                src={company.logo}
                alt="Company logo"
                fill
                className="rounded-xl object-cover border border-gray-200"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-blue-50 border border-gray-200">
                <Building2 className="h-10 w-10 text-blue-300" />
              </div>
            )}
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadLogo.isPending}
              className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
              aria-label="Change logo"
            >
              {uploadLogo.isPending ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <div className="text-sm text-gray-500">
            <p>Click the camera icon to upload or replace your logo.</p>
            {company?.isVerified && (
              <p className="mt-1 flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Verified company
              </p>
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>
      </FormSection>

      {/* Company details form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Company Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name" required>
                Company Name
              </Label>
              <Input
                id="name"
                placeholder="Acme Corp"
                {...register('name')}
                error={errors.name?.message}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://acme.com"
                {...register('website')}
                error={errors.website?.message}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g. Software, Healthcare, Finance"
                {...register('industry')}
                error={errors.industry?.message}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="size">Company Size</Label>
              <select
                id="size"
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 hover:border-gray-300"
                {...register('size')}
              >
                <option value="">Select size</option>
                {COMPANY_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {SIZE_LABELS[size] ?? size}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Headquarters</Label>
              <Input
                id="location"
                placeholder="e.g. San Francisco, CA"
                {...register('location')}
                error={errors.location?.message}
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="About"
          description="Describe your company, culture, and mission (max 2000 characters)."
        >
          <div className="space-y-1.5">
            <textarea
              placeholder="Tell job seekers what your company is about..."
              rows={6}
              className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 hover:border-gray-300"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>
        </FormSection>

        {/* Save bar */}
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          {saveSuccess ? (
            <span className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Company profile saved!
            </span>
          ) : upsertCompany.isError ? (
            <span className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              Failed to save. Please try again.
            </span>
          ) : (
            <span className="text-sm text-gray-400">
              {isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
            </span>
          )}
          <Button type="submit" isLoading={upsertCompany.isPending} disabled={!isDirty}>
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}

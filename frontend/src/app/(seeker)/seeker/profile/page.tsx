'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, FileText, Upload, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useProfile, useUpdateProfile, useUploadAvatar, useUploadResume, useDeleteResume } from '@/hooks/use-seeker';
import { profileSchema, type ProfileFormData } from '@/schemas/seeker.schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SkillsInput } from '@/components/ui/skills-input';
import { Spinner } from '@/components/ui/spinner';
import { JOB_EXPERIENCE_LEVELS } from '@/types/jobs';

const EXPERIENCE_LABEL: Record<string, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior Level',
};

function FormSection({ title, description, children }: {
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

export default function SeekerProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const uploadResume = useUploadResume();
  const deleteResume = useDeleteResume();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      headline: '',
      bio: '',
      location: '',
      skills: [],
      experienceLevel: '',
    },
  });

  // Populate form once profile loads
  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        headline: profile.headline ?? '',
        bio: profile.bio ?? '',
        location: profile.location ?? '',
        skills: profile.skills ?? [],
        experienceLevel: profile.experienceLevel ?? '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    await updateProfile.mutateAsync(data);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    reset(data); // clear dirty state
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadAvatar.mutateAsync(file);
    e.target.value = '';
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadResume.mutateAsync(file);
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
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Keep your profile up to date to attract the right employers.
        </p>
      </div>

      {/* Avatar + resume uploads */}
      <FormSection
        title="Photo & Resume"
        description="Upload a professional photo and your latest resume."
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-24 w-24">
              {profile?.avatar ? (
                <Image
                  src={profile.avatar}
                  alt="Profile photo"
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                  {profile?.firstName?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                aria-label="Change photo"
              >
                {uploadAvatar.isPending ? (
                  <Spinner size="sm" className="text-white" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400">JPG, PNG or WebP · Max 2MB</p>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Resume */}
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <FileText className="h-8 w-8 shrink-0 text-gray-400" />
              <div className="min-w-0 flex-1">
                {profile?.resumeFileName ? (
                  <>
                    <p className="truncate text-sm font-medium text-gray-900">
                      {profile.resumeFileName}
                    </p>
                    {profile.resumeUrl && (
                      <a
                        href={profile.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        View resume
                      </a>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">No resume uploaded yet</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                {profile?.resumeFileName && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={deleteResume.isPending}
                    onClick={() => deleteResume.mutate()}
                    aria-label="Delete resume"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    Delete
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={uploadResume.isPending}
                  onClick={() => resumeInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {profile?.resumeFileName ? 'Replace' : 'Upload'}
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-400">PDF only · Max 5MB</p>
            <input
              ref={resumeInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleResumeChange}
            />
          </div>
        </div>
      </FormSection>

      {/* Profile form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Personal Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" required>First Name</Label>
              <Input
                id="firstName"
                placeholder="Jane"
                {...register('firstName')}
                error={errors.firstName?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" required>Last Name</Label>
              <Input
                id="lastName"
                placeholder="Smith"
                {...register('lastName')}
                error={errors.lastName?.message}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="headline">Professional Headline</Label>
              <Input
                id="headline"
                placeholder="e.g. Senior React Developer · Open to work"
                {...register('headline')}
                error={errors.headline?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. New York, NY (Remote)"
                {...register('location')}
                error={errors.location?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="experienceLevel">Experience Level</Label>
              <select
                id="experienceLevel"
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 hover:border-gray-300"
                {...register('experienceLevel')}
              >
                <option value="">Select level</option>
                {JOB_EXPERIENCE_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {EXPERIENCE_LABEL[lvl] ?? lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FormSection>

        <FormSection title="Bio" description="Tell employers about yourself (max 1000 characters).">
          <div className="space-y-1.5">
            <textarea
              placeholder="Write a short professional bio..."
              rows={5}
              className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 hover:border-gray-300"
              {...register('bio')}
            />
            {errors.bio && (
              <p className="text-xs text-red-600">{errors.bio.message}</p>
            )}
          </div>
        </FormSection>

        <FormSection
          title="Skills"
          description="Add up to 30 skills. Type a skill and press Enter."
        >
          <Controller
            name="skills"
            control={control}
            render={({ field }) => (
              <SkillsInput
                value={field.value}
                onChange={field.onChange}
                error={errors.skills?.message}
              />
            )}
          />
        </FormSection>

        {/* Save bar */}
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          {saveSuccess ? (
            <span className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Profile saved successfully!
            </span>
          ) : updateProfile.isError ? (
            <span className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              Failed to save. Please try again.
            </span>
          ) : (
            <span className="text-sm text-gray-400">
              {isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
            </span>
          )}
          <Button
            type="submit"
            isLoading={updateProfile.isPending}
            disabled={!isDirty}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

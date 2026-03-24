'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, Briefcase, Building2 } from 'lucide-react';
import { AxiosError } from 'axios';
import { authApi } from '@/lib/api';
import { registerSchema, type RegisterFormData } from '@/schemas/auth.schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ApiErrorBody } from '@/types';

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'seeker' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (values: RegisterFormData) => {
    setServerError('');
    try {
      const { data } = await authApi.register({
        email: values.email,
        password: values.password,
        role: values.role,
      });
      setSuccess((data as { message: string }).message);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      const error = err as AxiosError<ApiErrorBody>;
      setServerError(
        error.response?.data?.message ?? 'Registration failed. Please try again.',
      );
    }
  };

  if (success) {
    return (
      <Card className="text-center">
        <CardContent className="pt-2">
          <div className="mb-4 text-5xl">📬</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
          <p className="text-gray-500 text-sm">{success}</p>
          <p className="text-gray-400 text-xs mt-4">Redirecting to login…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Join thousands of professionals on JobBoard</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Server error */}
          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          {/* Role selection */}
          <div>
            <Label required>I am a…</Label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {(
                [
                  {
                    value: 'seeker',
                    icon: Briefcase,
                    title: 'Job Seeker',
                    desc: "I'm looking for work",
                  },
                  {
                    value: 'employer',
                    icon: Building2,
                    title: 'Employer',
                    desc: "I'm hiring talent",
                  },
                ] as const
              ).map(({ value, icon: Icon, title, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('role', value, { shouldValidate: true })}
                  className={cn(
                    'flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-all',
                    selectedRole === value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      selectedRole === value ? 'text-blue-600' : 'text-gray-400',
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      selectedRole === value ? 'text-blue-700' : 'text-gray-700',
                    )}
                  >
                    {title}
                  </span>
                  <span className="text-xs text-gray-500">{desc}</span>
                </button>
              ))}
            </div>
            {errors.role && (
              <p className="mt-1.5 text-xs font-medium text-red-500">
                {errors.role.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" required>
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" required>
              Password
            </Label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              autoComplete="new-password"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword" required>
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat your password"
              autoComplete="new-password"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Create account
          </Button>

          <p className="text-center text-xs text-gray-400">
            By registering you agree to our{' '}
            <Link href="/terms" className="underline hover:text-gray-600">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-gray-600">
              Privacy Policy
            </Link>
          </p>
        </form>
      </CardContent>

      <CardFooter>
        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-blue-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

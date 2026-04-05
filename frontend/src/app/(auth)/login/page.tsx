'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { loginSchema, type LoginFormData } from '@/schemas/auth.schemas';
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
import type { LoginResponse, ApiErrorBody } from '@/types';
import { AxiosError } from 'axios';

const REMEMBERED_EMAIL_KEY = 'rememberedEmail';

function getSavedEmail(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '';
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [rememberUsername, setRememberUsername] = useState(() => !!getSavedEmail());
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: getSavedEmail() },
  });

  const onSubmit = async (values: LoginFormData) => {
    setServerError('');
    try {
      const { data } = await authApi.login(values);
      const res = data as LoginResponse;

      if (rememberUsername) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, values.email);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      const sessionExpiry = (Date.now() + 24 * 60 * 60 * 1000).toString();
      if (keepSignedIn) {
        localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('sessionExpiry', sessionExpiry);
      } else {
        sessionStorage.setItem('refreshToken', res.refreshToken);
        sessionStorage.setItem('sessionExpiry', sessionExpiry);
      }

      setAuth(
        {
          id: res.user.id,
          email: res.user.email,
          role: res.user.role,
          isEmailVerified: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        res.accessToken,
      );

      const redirect =
        res.user.role === 'employer'
          ? '/employer/dashboard'
          : res.user.role === 'admin'
            ? '/admin/dashboard'
            : '/seeker/dashboard';

      router.push(redirect);
    } catch (err) {
      const error = err as AxiosError<ApiErrorBody>;
      setServerError(
        error.response?.data?.message ?? 'Login failed. Please try again.',
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your JobBoard account</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Server error */}
          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

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
            <div className="flex items-center justify-between mb-1.5">
              <Label htmlFor="password" required className="mb-0">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
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

          {/* Remember / Keep signed in */}
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberUsername}
                onChange={(e) => setRememberUsername(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Remember username</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Keep me signed in</span>
            </label>
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <p className="text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-blue-600 hover:underline"
          >
            Create one
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

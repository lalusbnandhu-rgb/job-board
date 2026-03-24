'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { SeekerSidebar } from '@/components/seeker/sidebar';
import { Spinner } from '@/components/ui/spinner';

export default function SeekerLayout({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) return;
    if (user === null) {
      router.replace(`/login?next=${pathname}`);
    } else if (user.role !== 'seeker') {
      router.replace('/');
    }
  }, [user, isHydrated, router, pathname]);

  // Wait for Zustand to rehydrate from localStorage before redirecting
  if (!isHydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user.role !== 'seeker') return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SeekerSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}

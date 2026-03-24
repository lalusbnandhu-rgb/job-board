'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { useAuthInit } from '@/hooks/use-auth-init';

/** Inner component so useAuthInit has access to QueryClientProvider context */
function AuthInitialiser({ children }: { children: React.ReactNode }) {
  useAuthInit();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
          mutations: { retry: 0 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitialiser>{children}</AuthInitialiser>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

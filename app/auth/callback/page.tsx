'use client';

import { useAuth } from 'react-oidc-context';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      router.replace('/');
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-gray-500">Completing sign in...</p>
      </div>
    </div>
  );
}

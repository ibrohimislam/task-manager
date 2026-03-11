'use client';

import { useAuth } from 'react-oidc-context';
import { useEffect } from 'react';
import { useAppConfig } from './AuthProvider';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator) {
      auth.signinRedirect();
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.activeNavigator]);

  if (auth.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-red-800">
            Authentication Error
          </h2>
          <p className="mb-4 text-sm text-red-700">
            {auth.error.message}
          </p>
          <button
            onClick={() => auth.signinRedirect()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export function useRoles(): string[] {
  const auth = useAuth();
  const { clientId } = useAppConfig();

  if (!auth.user?.access_token) return [];

  try {
    const payload = JSON.parse(atob(auth.user.access_token.split('.')[1]));
    const realmRoles: string[] = payload.realm_access?.roles ?? [];
    const clientRoles: string[] =
      payload.resource_access?.[clientId]?.roles ?? [];
    return [...new Set([...realmRoles, ...clientRoles])];
  } catch {
    return [];
  }
}

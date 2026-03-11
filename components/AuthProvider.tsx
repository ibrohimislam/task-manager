'use client';

import { createContext, useContext, useMemo } from 'react';
import { AuthProvider as OidcAuthProvider } from 'react-oidc-context';
import { buildOidcConfig, type KeycloakConfig } from '@/lib/oidc-config';

interface AppConfigCtx {
  issuer: string;
  clientId: string;
  basePath: string;
}

const AppConfigContext = createContext<AppConfigCtx>({
  issuer: '',
  clientId: '',
  basePath: '',
});

export function useAppConfig() {
  return useContext(AppConfigContext);
}

export default function AuthProvider({
  children,
  keycloakUrl,
  realm,
  clientId,
  basePath = '',
}: {
  children: React.ReactNode;
  basePath?: string;
} & KeycloakConfig) {
  const oidcConfig = useMemo(
    () => buildOidcConfig({ keycloakUrl, realm, clientId }, basePath),
    [keycloakUrl, realm, clientId, basePath],
  );

  const ctx = useMemo<AppConfigCtx>(
    () => ({
      issuer: `${keycloakUrl}/realms/${realm}`,
      clientId,
      basePath,
    }),
    [keycloakUrl, realm, clientId, basePath],
  );

  return (
    <AppConfigContext.Provider value={ctx}>
      <OidcAuthProvider {...oidcConfig}>{children}</OidcAuthProvider>
    </AppConfigContext.Provider>
  );
}

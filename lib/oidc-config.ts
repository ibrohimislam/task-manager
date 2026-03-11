import type { AuthProviderProps } from 'react-oidc-context';

export interface KeycloakConfig {
  keycloakUrl: string;
  realm: string;
  clientId: string;
}

export function buildOidcConfig(
  config: KeycloakConfig,
  basePath: string,
): AuthProviderProps {
  const authority = `${config.keycloakUrl}/realms/${config.realm}`;

  return {
    authority,
    client_id: config.clientId,
    redirect_uri:
      typeof window !== 'undefined'
        ? `${window.location.origin}${basePath}/auth/callback`
        : '',
    post_logout_redirect_uri:
      typeof window !== 'undefined'
        ? `${window.location.origin}${basePath}`
        : '',
    scope: 'openid profile email',
    automaticSilentRenew: true,
    onSigninCallback: () => {
      window.history.replaceState({}, document.title, basePath || '/');
    },
  };
}

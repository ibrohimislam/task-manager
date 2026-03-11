import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

export interface KeycloakTokenPayload extends JWTPayload {
  realm_access?: { roles: string[] };
  resource_access?: Record<string, { roles: string[] }>;
  preferred_username?: string;
  email?: string;
  name?: string;
}

const keycloakUrl = process.env.KEYCLOAK_URL ?? '';
const realm = process.env.KEYCLOAK_REALM ?? '';
const issuer = `${keycloakUrl}/realms/${realm}`;
const jwksUri = `${issuer}/protocol/openid-connect/certs`;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(jwksUri));
  }
  return jwks;
}

export async function verifyToken(
  token: string,
): Promise<KeycloakTokenPayload> {
  const { payload } = await jwtVerify(token, getJWKS(), {
    issuer,
  });
  return payload as KeycloakTokenPayload;
}

export function extractRoles(payload: KeycloakTokenPayload): string[] {
  const realmRoles = payload.realm_access?.roles ?? [];
  const clientId = process.env.KEYCLOAK_CLIENT_ID ?? '';
  const clientRoles = payload.resource_access?.[clientId]?.roles ?? [];
  return [...new Set([...realmRoles, ...clientRoles])];
}

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyToken,
  extractRoles,
  type KeycloakTokenPayload,
} from './verify-token';

export interface AuthResult {
  payload: KeycloakTokenPayload;
  roles: string[];
}

export async function requireAuth(
  request: NextRequest,
  requiredRoles?: string[],
): Promise<AuthResult | NextResponse> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header' },
      { status: 401 },
    );
  }

  const token = authHeader.slice(7);

  let payload: KeycloakTokenPayload;
  try {
    payload = await verifyToken(token);
  } catch {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 },
    );
  }

  const roles = extractRoles(payload);

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((r) => roles.includes(r));
    if (!hasRole) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 },
      );
    }
  }

  return { payload, roles };
}

export function isAuthError(
  result: AuthResult | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}

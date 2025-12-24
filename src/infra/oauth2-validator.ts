import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { HttpRequest } from '@azure/functions';
import type { AuthContext } from '../app/auth-context';

export type OAuth2ValidatorOptions = {
  jwksUri: string;
  issuer: string;
  audience: string;
  rolesClaim?: string;
};

export class OAuth2Validator {
  private jwks: ReturnType<typeof createRemoteJWKSet>;
  private issuer: string;
  private audience: string;
  private rolesClaim?: string;

  constructor(options: OAuth2ValidatorOptions) {
    this.jwks = createRemoteJWKSet(new URL(options.jwksUri));
    this.issuer = options.issuer;
    this.audience = options.audience;
    this.rolesClaim = options.rolesClaim;
  }

  private extractToken(request: HttpRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
    return parts[1];
  }

  private normalizeStrings(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean);
    if (typeof value === 'string')
      return value
        .split(/\s+/)
        .map((v) => v.trim())
        .filter(Boolean);
    return [];
  }

  async validate(request: HttpRequest): Promise<AuthContext> {
    const token = this.extractToken(request);
    if (!token) return { authenticated: false, scopes: [], roles: [] };

    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
      });

      const scopes = this.normalizeStrings(payload.scope ?? (payload as any).permissions);
      const rolesFromClaim = this.rolesClaim
        ? this.normalizeStrings((payload as any)[this.rolesClaim])
        : [];
      const fallbackRoles = this.normalizeStrings((payload as any).roles);

      return {
        authenticated: true,
        scopes,
        roles: Array.from(new Set([...rolesFromClaim, ...fallbackRoles])),
        subject: typeof payload.sub === 'string' ? payload.sub : undefined,
      };
    } catch (error) {
      console.warn('Token validation failed:', (error as Error).message);
      return { authenticated: false, scopes: [], roles: [] };
    }
  }

  hasScope(authContext: AuthContext, scope: string): boolean {
    return authContext.authenticated && authContext.scopes.includes(scope);
  }

  hasRole(authContext: AuthContext, role: string): boolean {
    return authContext.authenticated && authContext.roles.includes(role);
  }
}

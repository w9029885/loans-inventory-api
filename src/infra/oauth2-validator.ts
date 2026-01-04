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
    if (!token) {
      console.log('[OAuth2Validator] No token found in request');
      return { authenticated: false, scopes: [], roles: [] };
    }

    console.log('[OAuth2Validator] Validating token, length:', token.length);

    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
      });

      console.log('[OAuth2Validator] Token verified successfully');
      console.log('[OAuth2Validator] Payload keys:', Object.keys(payload));
      console.log('[OAuth2Validator] scope:', payload.scope);
      console.log('[OAuth2Validator] permissions:', (payload as any).permissions);
      console.log('[OAuth2Validator] rolesClaim:', this.rolesClaim, '-> value:', this.rolesClaim ? (payload as any)[this.rolesClaim] : 'N/A');

      // Combine both scope (space-separated string) AND permissions (array) 
      const scopeScopes = this.normalizeStrings(payload.scope);
      const permissionScopes = this.normalizeStrings((payload as any).permissions);
      const scopes = Array.from(new Set([...scopeScopes, ...permissionScopes]));
      
      const rolesFromClaim = this.rolesClaim
        ? this.normalizeStrings((payload as any)[this.rolesClaim])
        : [];
      const fallbackRoles = this.normalizeStrings((payload as any).roles);

      const result = {
        authenticated: true,
        scopes,
        roles: Array.from(new Set([...rolesFromClaim, ...fallbackRoles])),
        subject: typeof payload.sub === 'string' ? payload.sub : undefined,
      };

      console.log('[OAuth2Validator] Auth context:', result);
      return result;
    } catch (error) {
      console.warn('[OAuth2Validator] Token validation failed:', (error as Error).message);
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

/**
 * Authentication context representing the caller's identity and permissions.
 * This keeps the app layer independent from infrastructure details.
 */
export type AuthContext = {
  authenticated: boolean;
  scopes: string[];
  roles: string[];
  subject?: string;
};

export type UserRole =
  "guest" | "portal-admin" | "support-engineer" | "manager" | "client-admin" | "client-employee";

export type AppPage =
  | "landing"
  | "login"
  | "register"
  | "recover"
  | "home"
  | "knowledge"
  | "article"
  | "video"
  | "editor"
  | "structure"
  | "tags"
  | "files"
  | "search"
  | "companies"
  | "company"
  | "company-types"
  | "users"
  | "client-users"
  | "administration"
  | "integrations"
  | "audit"
  | "fields"
  | "access-denied";

export interface AppLocation {
  page: AppPage;
  role: UserRole;
}

export interface RoleProfile {
  role: UserRole;
  label: string;
  shortLabel: string;
  description: string;
  capabilities: string[];
}

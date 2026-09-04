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
  | "file-preview"
  | "search"
  | "companies"
  | "company"
  | "company-types"
  | "users"
  | "client-users"
  | "administration"
  | "access-settings"
  | "integrations"
  | "audit"
  | "fields"
  | "access-denied";

export interface AppLocation {
  companyId?: string;
  companyType?: string;
  page: AppPage;
  resource?: string;
  returnPage?: AppPage;
  returnResource?: string;
  role: UserRole;
}

export type Navigate = (page: AppPage, resource?: string) => void;

export type Authenticate = (role: UserRole, companyId?: string) => void;

export interface RoleProfile {
  role: UserRole;
  label: string;
  shortLabel: string;
  description: string;
  capabilities: string[];
}

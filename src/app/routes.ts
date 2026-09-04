import { demoResources } from "./demo-resources";
import type { AppLocation, AppPage, RoleProfile, UserRole } from "./types";
import { articles, canRoleAccessArticle, canRoleAccessFile, files } from "../data/platform-data";
import { getPrototypeCompanies, getPrototypeUsers } from "../data/prototype-entities";

const authenticatedRoles: readonly UserRole[] = [
  "portal-admin",
  "support-engineer",
  "manager",
  "client-admin",
  "client-employee",
];
const staffRoles: readonly UserRole[] = ["portal-admin", "support-engineer", "manager"];
const authorRoles: readonly UserRole[] = ["portal-admin", "support-engineer"];

export const roleProfiles: RoleProfile[] = [
  {
    role: "guest",
    label: "Гость",
    shortLabel: "Гость",
    description: "Вход, регистрация и восстановление доступа к закрытому порталу.",
    capabilities: ["Авторизация", "Регистрация", "Восстановление"],
  },
  {
    role: "portal-admin",
    label: "Администратор портала",
    shortLabel: "Администратор",
    description: "Полный доступ к базе знаний, компаниям, пользователям и настройкам.",
    capabilities: ["Полный доступ", "Публикация", "Настройки"],
  },
  {
    role: "support-engineer",
    label: "Инженер ТП / автор",
    shortLabel: "Инженер ТП",
    description: "Создание материалов, импорт Word, публикация и работа с клиентами.",
    capabilities: ["Редактор", "Импорт DOCX", "Компании"],
  },
  {
    role: "manager",
    label: "Менеджер",
    shortLabel: "Менеджер",
    description: "Просмотр внутренней базы, компаний и пользователей без администрирования.",
    capabilities: ["Просмотр БЗ", "Компании", "Пользователи"],
  },
  {
    role: "client-admin",
    label: "Администратор клиента",
    shortLabel: "Администратор клиента",
    description: "Клиентская база знаний и управление сотрудниками своей компании.",
    capabilities: ["Клиентская БЗ", "Поиск", "Сотрудники"],
  },
  {
    role: "client-employee",
    label: "Сотрудник клиента",
    shortLabel: "Сотрудник клиента",
    description: "Разрешённые статьи, видео с таймкодами и полнотекстовый поиск.",
    capabilities: ["Статьи", "Видео", "Поиск"],
  },
];

export interface PageDefinition {
  id: AppPage;
  label: string;
  roles: readonly UserRole[];
}

export const pageDefinitions: PageDefinition[] = [
  { id: "landing", label: "Главная", roles: ["guest"] },
  { id: "login", label: "Вход", roles: ["guest"] },
  { id: "register", label: "Регистрация", roles: ["guest"] },
  { id: "recover", label: "Восстановление доступа", roles: ["guest"] },
  { id: "home", label: "Рабочее пространство", roles: authenticatedRoles },
  { id: "knowledge", label: "База знаний", roles: authenticatedRoles },
  { id: "article", label: "Статья", roles: authenticatedRoles },
  { id: "video", label: "Статья с видео", roles: authenticatedRoles },
  { id: "editor", label: "Редактор статьи", roles: authorRoles },
  { id: "structure", label: "Структура базы знаний", roles: ["portal-admin"] },
  { id: "tags", label: "Теги и группы", roles: ["portal-admin"] },
  { id: "files", label: "Реестр файлов", roles: ["portal-admin"] },
  { id: "file-preview", label: "Просмотр файла", roles: authenticatedRoles },
  { id: "search", label: "Поиск", roles: authenticatedRoles },
  { id: "companies", label: "Компании", roles: staffRoles },
  { id: "company", label: "Карточка компании", roles: staffRoles },
  { id: "company-types", label: "Типы компаний", roles: ["portal-admin"] },
  { id: "users", label: "Пользователи", roles: staffRoles },
  { id: "client-users", label: "Сотрудники компании", roles: ["client-admin"] },
  { id: "administration", label: "Администрирование", roles: ["portal-admin"] },
  { id: "access-settings", label: "Доступ к материалам", roles: ["portal-admin"] },
  { id: "integrations", label: "Интеграции", roles: ["portal-admin"] },
  { id: "audit", label: "Журнал действий", roles: ["portal-admin"] },
  { id: "fields", label: "Поля компании", roles: ["portal-admin"] },
  { id: "access-denied", label: "Нет доступа", roles: authenticatedRoles },
];

const pageIds = new Set(pageDefinitions.map(({ id }) => id));

export const roleProfile = (role: UserRole): RoleProfile => {
  const profile = roleProfiles.find((candidate) => candidate.role === role);
  if (!profile) throw new Error(`PROTOTYPE_ROLE_MISSING: профиль роли ${role} отсутствует`);
  return profile;
};

export const canOpenPage = (page: AppPage, role: UserRole): boolean => {
  const definition = pageDefinitions.find((candidate) => candidate.id === page);
  return Boolean(definition?.roles.includes(role));
};

const activeCompanyStorageKey = "maxsoft-prototype-active-company";
const demoUserForRole: Partial<Record<UserRole, string>> = {
  "client-admin": "anna-smirnova",
  "client-employee": "oleg-gurov",
};

const readActiveCompanies = () => {
  const stored = window.sessionStorage.getItem(activeCompanyStorageKey);
  return stored ? (JSON.parse(stored) as Partial<Record<UserRole, string>>) : {};
};

export const setActiveClientCompany = (role: UserRole, companyId?: string) => {
  const activeCompanies = readActiveCompanies();
  if (companyId) activeCompanies[role] = companyId;
  else delete activeCompanies[role];
  window.sessionStorage.setItem(activeCompanyStorageKey, JSON.stringify(activeCompanies));
};

export const companyContextForRole = (role: UserRole, explicitCompanyId?: string) => {
  if (role !== "client-admin" && role !== "client-employee") return {};
  const companies = getPrototypeCompanies();
  const activeCompanyId = explicitCompanyId ?? readActiveCompanies()[role];
  const demoUserId = demoUserForRole[role];
  const demoUser = getPrototypeUsers().find((candidate) => candidate.id === demoUserId);
  const company = activeCompanyId
    ? companies.find((candidate) => candidate.id === activeCompanyId)
    : companies.find((candidate) => candidate.name === demoUser?.company);
  if (!company)
    throw new Error(`ACC_ACTIVE_COMPANY_MISSING: компания для роли ${role} не найдена`);
  return { companyId: company.id, companyType: company.type };
};

export const canOpenLocation = (
  page: AppPage,
  role: UserRole,
  resource?: string,
  companyType?: string,
): boolean => {
  if (!canOpenPage(page, role)) return false;
  if (page === "article" || page === "video") {
    const article = articles.find((candidate) => candidate.id === (resource ?? demoResources[page]));
    return Boolean(
      article &&
        canRoleAccessArticle(article, role, companyType) &&
        (page === "video" ? article.kind === "video" : article.kind === "article"),
    );
  }
  if (page === "file-preview") {
    const file = files.find((candidate) => candidate.name === (resource ?? demoResources.file));
    return Boolean(file && canRoleAccessFile(file, role, companyType));
  }
  if (page === "editor" && resource)
    return articles.some((candidate) => candidate.id === resource);
  if (page === "company" && resource)
    return getPrototypeCompanies().some((company) => company.id === resource);
  return true;
};

export const pagesForRole = (role: UserRole): PageDefinition[] =>
  pageDefinitions.filter((page) => page.roles.includes(role) && page.id !== "access-denied");

export const startPageForRole = (role: UserRole): AppPage => (role === "guest" ? "landing" : "home");

export const readLocation = (): AppLocation => {
  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get("role") as UserRole | null;
  const pageParam = params.get("page") as AppPage | null;
  const resource = params.get("resource")?.trim() || undefined;
  const returnPageParam = params.get("returnPage") as AppPage | null;
  const returnResource = params.get("returnResource")?.trim() || undefined;
  const role = roleProfiles.some((profile) => profile.role === roleParam) ? roleParam! : "guest";
  const companyContext = companyContextForRole(role);
  const requestedPage = pageParam && pageIds.has(pageParam) ? pageParam : startPageForRole(role);
  const canOpenRequestedLocation = canOpenLocation(
    requestedPage,
    role,
    resource,
    companyContext.companyType,
  );
  if (
    role === "guest" &&
    requestedPage !== "landing" &&
    !canOpenRequestedLocation
  ) {
    return {
      page: "login",
      returnPage: requestedPage,
      returnResource: resource,
      role,
    };
  }
  return {
    ...companyContext,
    page: canOpenRequestedLocation
      ? requestedPage
      : role === "guest"
        ? "landing"
        : "access-denied",
    resource: canOpenRequestedLocation ? resource : undefined,
    returnPage: returnPageParam && pageIds.has(returnPageParam) ? returnPageParam : undefined,
    returnResource,
    role,
  };
};

export const writeLocation = (location: AppLocation, replace = false) => {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("page", location.page);
  url.searchParams.set("role", location.role);
  if (location.resource) url.searchParams.set("resource", location.resource);
  if (location.returnPage) url.searchParams.set("returnPage", location.returnPage);
  if (location.returnResource) url.searchParams.set("returnResource", location.returnResource);
  window.history[replace ? "replaceState" : "pushState"]({}, "", url);
};

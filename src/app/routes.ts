import type { AppLocation, AppPage, RoleProfile, UserRole } from "./types";

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
  { id: "search", label: "Поиск", roles: authenticatedRoles },
  { id: "companies", label: "Компании", roles: staffRoles },
  { id: "company", label: "Карточка компании", roles: staffRoles },
  { id: "company-types", label: "Типы компаний", roles: ["portal-admin"] },
  { id: "users", label: "Пользователи", roles: staffRoles },
  { id: "client-users", label: "Сотрудники компании", roles: ["client-admin"] },
  { id: "administration", label: "Администрирование", roles: ["portal-admin"] },
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

export const pagesForRole = (role: UserRole): PageDefinition[] =>
  pageDefinitions.filter((page) => page.roles.includes(role) && page.id !== "access-denied");

export const startPageForRole = (role: UserRole): AppPage => (role === "guest" ? "landing" : "home");

export const readLocation = (): AppLocation => {
  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get("role") as UserRole | null;
  const pageParam = params.get("page") as AppPage | null;
  const role = roleProfiles.some((profile) => profile.role === roleParam) ? roleParam! : "guest";
  const requestedPage = pageParam && pageIds.has(pageParam) ? pageParam : startPageForRole(role);
  return {
    page: canOpenPage(requestedPage, role) ? requestedPage : role === "guest" ? "landing" : "access-denied",
    role,
  };
};

export const writeLocation = (location: AppLocation, replace = false) => {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("page", location.page);
  url.searchParams.set("role", location.role);
  window.history[replace ? "replaceState" : "pushState"]({}, "", url);
};

import type { AppPage, UserRole } from "../app/types";
import { prototypeStorageKeys, readPrototypeValue } from "./prototype-store";

export interface ArticleSummary {
  id: string;
  title: string;
  description: string;
  section: string;
  tags: string[];
  updated: string;
  status: "Опубликована" | "Черновик";
  kind: "article" | "video";
  allowedCompanyTypes: string[] | "all";
}

export interface CompanyRecord {
  id: string;
  name: string;
  shortName: string;
  inn: string;
  kpp: string;
  legalAddress: string;
  primaryEmail: string;
  phone: string;
  type: string;
  status: "Активна" | "Приостановлена";
  statusUntil: string;
  contract: string;
  contractDate: string;
  project: string;
  bitrixUrl: string;
  users: number;
  domains: string[];
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  position: string;
  status: "Активен" | "Заблокирован" | "Приглашён" | "Доступ отозван";
  lastLogin: string;
}

export const articles: ArticleSummary[] = [
  {
    id: "network-license",
    title: "Настройка сетевой лицензии",
    description: "Подготовка сервера лицензий, подключение рабочих мест и диагностика соединения.",
    section: "НАВИСА / Установка",
    tags: ["НАВИСА", "Лицензирование"],
    updated: "Сегодня, 10:42",
    status: "Опубликована",
    kind: "article",
    allowedCompanyTypes: "all",
  },
  {
    id: "cad-integration",
    title: "Настройка интеграции с САПР-комплексом",
    description: "Видеоинструкция с быстрыми переходами по ключевым этапам настройки.",
    section: "НАВИСА / Настройка",
    tags: ["НАВИСА", "Интеграция"],
    updated: "Вчера, 16:18",
    status: "Опубликована",
    kind: "video",
    allowedCompanyTypes: ["Клиент", "ВИП-клиент", "Интегратор"],
  },
  {
    id: "project-template",
    title: "Подготовка шаблона проекта",
    description: "Рекомендуемая структура проекта и правила совместной работы.",
    section: "Продукты / Общие рекомендации",
    tags: ["Проекты", "Стандарты"],
    updated: "29 августа",
    status: "Опубликована",
    kind: "article",
    allowedCompanyTypes: ["Клиент", "ВИП-клиент", "Интегратор"],
  },
  {
    id: "server-migration",
    title: "Перенос сервера лицензий",
    description: "Черновик регламента миграции лицензий без остановки рабочих мест.",
    section: "НАВИСА / Администрирование",
    tags: ["Лицензирование"],
    updated: "28 августа",
    status: "Черновик",
    kind: "article",
    allowedCompanyTypes: [],
  },
  {
    id: "update-2026",
    title: "Обновление компонентов до версии 2026",
    description: "Контрольный список перед обновлением и проверка совместимости модулей.",
    section: "НАВИСА / Обновление",
    tags: ["НАВИСА", "Обновление"],
    updated: "27 августа",
    status: "Опубликована",
    kind: "article",
    allowedCompanyTypes: ["ВИП-клиент"],
  },
];

export const companies: CompanyRecord[] = [
  {
    id: "severprom",
    name: "ООО «СеверПромБИМ»",
    shortName: "СеверПромБИМ",
    inn: "2463128457",
    kpp: "246301001",
    legalAddress: "г. Красноярск, ул. Проектная, 12",
    primaryEmail: "info@severprom.ru",
    phone: "+7 (391) 212-45-80",
    type: "Клиент",
    status: "Активна",
    statusUntil: "2026-12-31",
    contract: "№ MS-2026/184",
    contractDate: "2026-01-12",
    project: "Пилотник НАВИСА-2026",
    bitrixUrl: "https://maxsoft.bitrix24.ru/crm/company/details/184/",
    users: 18,
    domains: ["severprom.ru", "knowledge.severprom.ru"],
  },
  {
    id: "integrator-pro",
    name: "АО «Интегратор Про»",
    shortName: "Интегратор Про",
    inn: "7702149021",
    kpp: "770201001",
    legalAddress: "г. Москва, ул. Техническая, 8",
    primaryEmail: "portal@integrator-pro.ru",
    phone: "+7 (495) 120-40-30",
    type: "Интегратор",
    status: "Активна",
    statusUntil: "2027-03-15",
    contract: "№ MS-2026/231",
    contractDate: "2026-03-15",
    project: "Корпоративный стандарт САПР",
    bitrixUrl: "https://maxsoft.bitrix24.ru/crm/company/details/231/",
    users: 32,
    domains: ["integrator-pro.ru"],
  },
  {
    id: "vector",
    name: "ООО «Вектор Проект»",
    shortName: "Вектор Проект",
    inn: "5406817204",
    kpp: "540601001",
    legalAddress: "г. Новосибирск, Красный проспект, 24",
    primaryEmail: "office@vector-project.ru",
    phone: "+7 (383) 210-18-44",
    type: "Базовый",
    status: "Приостановлена",
    statusUntil: "2026-08-31",
    contract: "№ MS-2025/098",
    contractDate: "2025-08-31",
    project: "Вектор BIM",
    bitrixUrl: "https://maxsoft.bitrix24.ru/crm/company/details/98/",
    users: 6,
    domains: ["vector-project.ru"],
  },
];

export const companyTypes = [
  {
    name: "Базовый",
    description: "Минимальный доступ для автоматически созданных компаний.",
    companies: 4,
    articles: 57,
    isDefault: true,
  },
  {
    name: "Клиент",
    description: "Стандартный доступ для компаний с действующим договором.",
    companies: 18,
    articles: 57,
    isDefault: false,
  },
  {
    name: "ВИП-клиент",
    description: "Расширенный набор материалов для приоритетных клиентов.",
    companies: 6,
    articles: 42,
    isDefault: false,
  },
  {
    name: "Интегратор",
    description: "Доступ партнёров, внедряющих решения MaxSoft у клиентов.",
    companies: 1,
    articles: 31,
    isDefault: false,
  },
];

export const users: UserRecord[] = [
  {
    id: "gleb-saprykin",
    name: "Глеб Сапрыкин",
    email: "g.saprykin@maxsoft.ru",
    company: "Внутренний пользователь MaxSoft",
    role: "Администратор портала",
    position: "Руководитель проекта",
    status: "Активен",
    lastLogin: "Сегодня, 11:24",
  },
  {
    id: "sergey-volkov",
    name: "Сергей Волков",
    email: "s.volkov@maxsoft.ru",
    company: "Внутренний пользователь MaxSoft",
    role: "Инженер ТП / автор",
    position: "Инженер технической поддержки",
    status: "Активен",
    lastLogin: "Сегодня, 10:15",
  },
  {
    id: "elena-orlova",
    name: "Елена Орлова",
    email: "e.orlova@maxsoft.ru",
    company: "Внутренний пользователь MaxSoft",
    role: "Менеджер",
    position: "Менеджер по работе с клиентами",
    status: "Активен",
    lastLogin: "Вчера, 17:05",
  },
  {
    id: "anna-smirnova",
    name: "Анна Смирнова",
    email: "a.smirnova@severprom.ru",
    company: "ООО «СеверПромБИМ»",
    role: "Администратор клиента",
    position: "Руководитель BIM-отдела",
    status: "Активен",
    lastLogin: "Сегодня, 09:48",
  },
  {
    id: "oleg-gurov",
    name: "Олег Гуров",
    email: "o.gurov@integrator-pro.ru",
    company: "АО «Интегратор Про»",
    role: "Сотрудник клиента",
    position: "Ведущий инженер",
    status: "Активен",
    lastLogin: "Вчера, 18:31",
  },
  {
    id: "maria-krylova",
    name: "Мария Крылова",
    email: "m.krylova@severprom.ru",
    company: "ООО «СеверПромБИМ»",
    role: "Сотрудник клиента",
    position: "Инженер-проектировщик",
    status: "Приглашён",
    lastLogin: "Ещё не входил",
  },
  {
    id: "pavel-savin",
    name: "Павел Савин",
    email: "p.savin@severprom.ru",
    company: "ООО «СеверПромБИМ»",
    role: "Сотрудник клиента",
    position: "Специалист САПР",
    status: "Заблокирован",
    lastLogin: "25 августа, 14:12",
  },
];

export const tagGroups = [
  { id: "products", name: "Продукты", tags: ["НАВИСА", "Model Studio CS", "CADLib"] },
  { id: "topics", name: "Темы", tags: ["Лицензирование", "Интеграция", "Обновление", "Проекты", "Стандарты"] },
  { id: "audience", name: "Аудитория", tags: ["Администратор", "Проектировщик"] },
];

export const files = [
  { name: "инструкция_активации.pdf", type: "PDF", size: "2,4 МБ", relatedArticleIds: ["network-license", "cad-integration"], updated: "Сегодня, 10:42" },
  { name: "схема_подключения.dwg", type: "DWG", size: "8,1 МБ", relatedArticleIds: ["cad-integration"], updated: "Вчера, 16:18" },
  { name: "регламент_обновления.docx", type: "DOCX", size: "1,8 МБ", relatedArticleIds: ["network-license", "project-template", "update-2026"], updated: "29 августа" },
  { name: "дистрибутив_модуля.zip", type: "ZIP", size: "42 МБ", relatedArticleIds: ["update-2026"], updated: "27 августа" },
].map((file) => ({ ...file, uses: file.relatedArticleIds.length }));

const staffRoles: readonly UserRole[] = ["portal-admin", "support-engineer", "manager"];

export const isArticlePublished = (article: ArticleSummary) =>
  readPrototypeValue<Record<string, boolean>>(
    prototypeStorageKeys.articlePublication,
    {},
  )[article.id] ?? (article.status === "Опубликована");

export const canRoleAccessArticle = (
  article: ArticleSummary,
  role: UserRole,
  companyType?: string,
) => {
  if (staffRoles.includes(role)) return true;
  if (role !== "client-admin" && role !== "client-employee") return false;
  if (!companyType || !isArticlePublished(article)) return false;
  const configuredAccess = readPrototypeValue<Record<string, string[] | "all">>(
    prototypeStorageKeys.articleAccess,
    {},
  )[article.id];
  const allowedCompanyTypes = configuredAccess ?? article.allowedCompanyTypes;
  return allowedCompanyTypes === "all" || allowedCompanyTypes.includes(companyType);
};

export const canRoleAccessFile = (
  file: (typeof files)[number],
  role: UserRole,
  companyType?: string,
) =>
  file.relatedArticleIds.some((articleId) => {
    const article = articles.find((candidate) => candidate.id === articleId);
    return article ? canRoleAccessArticle(article, role, companyType) : false;
  });

export interface AuditEvent {
  action: string;
  category: "content" | "access" | "company" | "user" | "system";
  date: string;
  object: string;
  page: AppPage;
  result: "Успешно" | "Отклонено";
  resource?: string;
  user: string;
}

export const auditEvents: AuditEvent[] = [
  {
    user: "Анна Смирнова",
    action: "Опубликовала статью",
    category: "content",
    object: "Настройка сетевой лицензии",
    date: "Сегодня, 10:42",
    page: "article",
    result: "Успешно",
    resource: "network-license",
  },
  {
    user: "Глеб Сапрыкин",
    action: "Изменил права доступа",
    category: "access",
    object: "Интеграция с САПР-комплексом",
    date: "Сегодня, 09:15",
    page: "video",
    result: "Успешно",
    resource: "cad-integration",
  },
  {
    user: "Администратор портала",
    action: "Попытался удалить используемый тип",
    category: "company",
    object: "Тип компании «Клиент»",
    date: "Вчера, 18:44",
    page: "company-types",
    result: "Отклонено",
  },
  {
    user: "Олег Гуров",
    action: "Вошёл в систему",
    category: "system",
    object: "АО «Интегратор Про»",
    date: "Вчера, 18:31",
    page: "company",
    result: "Успешно",
    resource: "integrator-pro",
  },
  {
    user: "Анна Смирнова",
    action: "Добавила пользователя",
    category: "user",
    object: "Мария Крылова",
    date: "Вчера, 16:05",
    page: "users",
    result: "Успешно",
  },
  {
    user: "Администратор портала",
    action: "Обновил схему полей компании",
    category: "company",
    object: "Поля компании",
    date: "3 сентября, 15:42",
    page: "fields",
    result: "Успешно",
  },
  {
    user: "Администратор портала",
    action: "Создал группу тегов",
    category: "content",
    object: "Аудитория",
    date: "3 сентября, 14:18",
    page: "tags",
    result: "Успешно",
  },
];

export const companyFields = [
  { id: "name", label: "Полное наименование", required: true, unique: true, registration: true },
  { id: "shortName", label: "Сокращённое наименование", required: true, unique: true, registration: true },
  { id: "inn", label: "ИНН", required: true, unique: true, registration: true },
  { id: "kpp", label: "КПП", required: false, unique: false, registration: false },
  { id: "legalAddress", label: "Юридический адрес", required: false, unique: false, registration: false },
  { id: "domains", label: "Рабочие домены", required: true, unique: true, registration: true },
  { id: "primaryEmail", label: "Основной email", required: false, unique: true, registration: true },
  { id: "phone", label: "Телефон", required: false, unique: false, registration: true },
  { id: "type", label: "Тип компании", required: true, unique: false, registration: false },
  { id: "status", label: "Статус компании", required: true, unique: false, registration: false },
  { id: "statusUntil", label: "Срок действия статуса", required: false, unique: false, registration: false },
  { id: "contract", label: "Договор / основание", required: false, unique: false, registration: false },
  { id: "contractDate", label: "Дата договора", required: false, unique: false, registration: false },
  { id: "project", label: "Проект", required: false, unique: false, registration: false },
  { id: "bitrix", label: "Ссылка на Битрикс24", required: false, unique: true, registration: false },
].map((field) => ({
  ...field,
  visible: true,
  manager: !["bitrix", "type"].includes(field.id),
  creation: true,
  editing: true,
}));

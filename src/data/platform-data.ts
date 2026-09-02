export interface ArticleSummary {
  id: string;
  title: string;
  description: string;
  section: string;
  tags: string[];
  updated: string;
  status: "Опубликована" | "Черновик";
  kind: "article" | "video";
}

export interface CompanyRecord {
  id: string;
  name: string;
  inn: string;
  type: string;
  status: "Активна" | "Приостановлена";
  users: number;
  domain: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  status: "Активен" | "Заблокирован" | "Приглашён";
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
  },
];

export const companies: CompanyRecord[] = [
  {
    id: "severprom",
    name: "ООО «СеверПромБИМ»",
    inn: "2463128457",
    type: "Клиент",
    status: "Активна",
    users: 18,
    domain: "severprom.ru",
  },
  {
    id: "integrator-pro",
    name: "АО «Интегратор Про»",
    inn: "7702149021",
    type: "Интегратор",
    status: "Активна",
    users: 32,
    domain: "integrator-pro.ru",
  },
  {
    id: "vector",
    name: "ООО «Вектор Проект»",
    inn: "5406817204",
    type: "Базовый",
    status: "Приостановлена",
    users: 6,
    domain: "vector-project.ru",
  },
];

export const users: UserRecord[] = [
  {
    id: "anna-smirnova",
    name: "Анна Смирнова",
    email: "a.smirnova@severprom.ru",
    company: "ООО «СеверПромБИМ»",
    role: "Администратор клиента",
    status: "Активен",
  },
  {
    id: "oleg-gurov",
    name: "Олег Гуров",
    email: "o.gurov@integrator-pro.ru",
    company: "АО «Интегратор Про»",
    role: "Сотрудник клиента",
    status: "Активен",
  },
  {
    id: "maria-krylova",
    name: "Мария Крылова",
    email: "m.krylova@severprom.ru",
    company: "ООО «СеверПромБИМ»",
    role: "Сотрудник клиента",
    status: "Приглашён",
  },
  {
    id: "pavel-savin",
    name: "Павел Савин",
    email: "p.savin@severprom.ru",
    company: "ООО «СеверПромБИМ»",
    role: "Сотрудник клиента",
    status: "Заблокирован",
  },
];

export const tagGroups = [
  { id: "products", name: "Продукты", tags: ["НАВИСА", "Model Studio CS", "CADLib"] },
  { id: "topics", name: "Темы", tags: ["Лицензирование", "Интеграция", "Обновление"] },
  { id: "audience", name: "Аудитория", tags: ["Администратор", "Проектировщик"] },
];

export const files = [
  { name: "инструкция_активации.pdf", type: "PDF", size: "2,4 МБ", uses: 2, updated: "Сегодня, 10:42" },
  { name: "схема_подключения.dwg", type: "DWG", size: "8,1 МБ", uses: 1, updated: "Вчера, 16:18" },
  { name: "регламент_обновления.docx", type: "DOCX", size: "1,8 МБ", uses: 3, updated: "29 августа" },
  { name: "дистрибутив_модуля.zip", type: "ZIP", size: "42 МБ", uses: 1, updated: "27 августа" },
];

export const auditEvents = [
  {
    user: "Анна Смирнова",
    action: "Опубликовала статью",
    object: "Настройка сетевой лицензии",
    date: "Сегодня, 10:42",
  },
  {
    user: "Глеб Сапрыкин",
    action: "Изменил права доступа",
    object: "Интеграция с САПР-комплексом",
    date: "Сегодня, 09:15",
  },
  { user: "Олег Гуров", action: "Вошёл в систему", object: "АО «Интегратор Про»", date: "Вчера, 18:31" },
  { user: "Анна Смирнова", action: "Добавила пользователя", object: "Мария Крылова", date: "Вчера, 16:05" },
];

export const companyFields = [
  { id: "name", label: "Название компании", required: true, unique: true, registration: true },
  { id: "inn", label: "ИНН", required: true, unique: true, registration: true },
  { id: "domains", label: "Рабочие домены", required: true, unique: true, registration: true },
  { id: "contacts", label: "Контактные данные", required: false, unique: false, registration: true },
  { id: "contract", label: "Договор / основание", required: false, unique: false, registration: false },
  { id: "project", label: "Проект", required: false, unique: false, registration: false },
  { id: "bitrix", label: "Ссылка на Битрикс24", required: false, unique: true, registration: false },
];

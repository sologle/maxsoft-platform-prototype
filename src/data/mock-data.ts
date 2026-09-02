import type { UserRole } from "../prototype/navigation";

export interface DemoProfile {
  role: UserRole;
  label: string;
  shortLabel: string;
  description: string;
  capabilities: string[];
}

export interface FileUsageItem {
  id: string;
  title: string;
  path: string;
  articleKind: "article" | "video";
}

export const demoSelectOptions: Record<string, string[]> = {
  "выбор типа компании": ["Базовый", "Клиент", "Интегратор"],
  "SRCH-01": ["По релевантности", "По названию", "Сначала новые"],
  "KB-01": ["По названию", "Сначала новые", "Сначала обновлённые"],
  "KB-05 Статус": ["Черновик", "Опубликована"],
  "KB-06 Select Родительский раздел": ["НАВИСА", "Продукты", "Администрирование"],
  "KB-07": ["Выберите группу", "Темы", "Продукты"],
  "KB07": ["Выберите…", "Темы", "Продукты"],
  "Фильтр роль": ["Роль: Все", "Администратор", "Менеджер", "Сотрудник"],
  "Фильтр статус": ["Статус: Все", "Активен", "Заблокирован"],
  "ORG-04 Компания select": ["Выберите компанию", "ООО «СеверПромБИМ»", "АО «Интегратор Про»"],
  "ORG-04 Роль select": ["Выберите роль", "Инженер ТП / автор", "Менеджер"],
  "ORG-04 Фильтр компания": ["Компания: Все", "ООО «СеверПромБИМ»", "АО «Интегратор Про»"],
  "ORG-04 Фильтр статус": ["Статус", "Активен", "Заблокирован"],
  "ORG01 Поле Проект": ["Выберите…", "Пилотник НАВИСА-2026"],
  "ORG01 Поле Статус": ["Выберите…", "Активна", "Приостановлена"],
  "ORG01 Поле Тип": ["Выберите…", "Клиент", "Интегратор"],
  "PLAT-03 Выбор пользователя": ["Пользователь: Все", "Анна Смирнова", "Олег Гуров"],
  "PLAT-03 Выбор типа": ["Тип: Все", "Вход", "Изменение", "Экспорт"],
};

export const demoProfiles: DemoProfile[] = [
  {
    role: "guest",
    label: "Гость",
    shortLabel: "Гость",
    description: "Вход, регистрация, восстановление доступа и переход по закрытой ссылке.",
    capabilities: ["Авторизация", "Регистрация", "Восстановление"],
  },
  {
    role: "portal-admin",
    label: "Администратор портала",
    shortLabel: "Администратор",
    description: "Полный маршрут по БЗ, компаниям, пользователям и настройкам платформы.",
    capabilities: ["Полный доступ", "Публикация", "Настройки"],
  },
  {
    role: "support-engineer",
    label: "Инженер ТП / автор",
    shortLabel: "Инженер ТП",
    description: "Создание материалов, импорт Word, публикация, компании и пользователи.",
    capabilities: ["Редактор", "Импорт DOCX", "Компании"],
  },
  {
    role: "manager",
    label: "Менеджер",
    shortLabel: "Менеджер",
    description: "Просмотр staff-БЗ, компании и пользователи без административных прав.",
    capabilities: ["Просмотр БЗ", "Компании", "Пользователи"],
  },
  {
    role: "client-admin",
    label: "Администратор клиента",
    shortLabel: "Администратор клиента",
    description: "Клиентская БЗ, поиск и управление сотрудниками своей компании.",
    capabilities: ["Клиентская БЗ", "Поиск", "Сотрудники"],
  },
  {
    role: "client-employee",
    label: "Сотрудник клиента",
    shortLabel: "Сотрудник клиента",
    description: "Просмотр разрешённых статей, видео с таймкодами и поиск.",
    capabilities: ["Статьи", "Видео", "Поиск"],
  },
];

export const mockDownload = {
  filename: "maxsoft-demo-document.txt",
  content:
    "Демонстрационный файл прототипа MaxSoft. В рабочей версии здесь будет доступен исходный документ с проверкой прав.",
};

export const mockFileUsage: FileUsageItem[] = [
  {
    id: "article-integration-setup",
    title: "Настройка интеграции с САПР-комплексом",
    path: "База знаний / НАВИСА / Настройка",
    articleKind: "video",
  },
  {
    id: "article-network-license",
    title: "Настройка интеграции с САПР-комплексом",
    path: "База знаний / НАВИСА / Настройка · статья",
    articleKind: "article",
  },
];

export const mockImportFile = {
  id: "document-import-demo",
  filename: "регламент_работы_с_проектами.docx",
  sizeLabel: "1,8 МБ",
};

export const mockSearchVideo = {
  type: "ВИДЕО",
  mobileType: "ВИДЕО · НАВИСА",
  title: "Настройка интеграции с САПР-комплексом",
  snippetStart: "Видео: ",
  matchedText: "интеграция",
  snippetEnd: "с САПР по шагам и таймкодам.",
  mobileSnippet: "Видеоинструкция с быстрыми переходами по ключевым этапам настройки.",
};

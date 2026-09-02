import type { UserRole } from "../prototype/navigation";

export interface DemoProfile {
  role: UserRole;
  label: string;
  shortLabel: string;
  description: string;
  capabilities: string[];
}

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

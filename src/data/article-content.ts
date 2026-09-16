import { practiceContent } from "./practice/content";
import {
  excerptSections,
  licensingArticleId,
  licensingSections,
} from "./licensing/catalog";
export const legacyArticleSections: Record<
  string,
  Array<{ id: string; text: string; title: string }>
> = {
  "network-license": [
    {
      id: "preparation",
      title: "Перед началом работы",
      text: "Убедитесь, что сервер лицензий доступен из корпоративной сети, а системное время на сервере и рабочих станциях синхронизировано.",
    },
    {
      id: "installation",
      title: "Установка сервера лицензий",
      text: "Скачайте актуальный дистрибутив, запустите установщик от имени администратора и укажите каталог хранения лицензий.",
    },
    {
      id: "connection",
      title: "Подключение рабочего места",
      text: "Откройте настройки продукта, выберите сетевой тип лицензирования и укажите адрес сервера server.company.local:1947.",
    },
    {
      id: "diagnostics",
      title: "Диагностика",
      text: "Если лицензия не найдена, проверьте доступность порта, журнал службы и совместимость версий.",
    },
  ],
  "project-template": [
    {
      id: "preparation",
      title: "Подготовка структуры",
      text: "Создайте единый корневой каталог проекта и согласуйте правила именования файлов с командой.",
    },
    {
      id: "installation",
      title: "Шаблоны проекта",
      text: "Добавьте утверждённые шаблоны, библиотеки и общие параметры до начала моделирования.",
    },
    {
      id: "connection",
      title: "Совместная работа",
      text: "Назначьте владельцев разделов и настройте регулярную синхронизацию изменений.",
    },
    {
      id: "diagnostics",
      title: "Контроль качества",
      text: "Перед публикацией проверьте структуру, ссылки и обязательные свойства моделей.",
    },
  ],
  "server-migration": [
    {
      id: "preparation",
      title: "Подготовка миграции",
      text: "Зафиксируйте текущие лицензии, сделайте резервную копию и уведомите пользователей о техническом окне.",
    },
    {
      id: "installation",
      title: "Перенос службы",
      text: "Установите сервер лицензий на новом узле и восстановите проверенную конфигурацию.",
    },
    {
      id: "connection",
      title: "Переключение клиентов",
      text: "Обновите адрес сервера на рабочих местах и проверьте выдачу лицензий тестовой группе.",
    },
    {
      id: "diagnostics",
      title: "Завершение",
      text: "После контрольного периода отключите старую службу и сохраните журнал миграции.",
    },
  ],
  "update-2026": [
    {
      id: "preparation",
      title: "Перед обновлением",
      text: "Сделайте резервную копию проектов и проверьте системные требования версии 2026.",
    },
    {
      id: "installation",
      title: "Обновление компонентов",
      text: "Устанавливайте компоненты в согласованном порядке и фиксируйте результат каждого шага.",
    },
    {
      id: "connection",
      title: "Проверка модулей",
      text: "Откройте контрольный проект и проверьте совместимость подключённых модулей.",
    },
    {
      id: "diagnostics",
      title: "Возврат к работе",
      text: "После успешной проверки обновите рабочие места и сообщите пользователям о завершении.",
    },
  ],
};

export const getArticleContent = (id: string) => {
  if (practiceContent[id]) return practiceContent[id];
  if (id === licensingArticleId) return licensingSections;
  if (excerptSections[id])
    return licensingSections.filter((s) => excerptSections[id].includes(s.id));
  return [];
};

export const articleSearchText = (id: string) => {
  const sections = getArticleContent(id);
  if (sections.length)
    return sections
      .map((s) =>
        [
          s.title,
          s.html,
          ...(s.tabs ?? []).map((t) => `${t.title} ${t.html}`),
        ].join(" "),
      )
      .join(" ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&[^;]+;/g, " ");
  if (id === "cad-integration")
    return "Подготовка интеграционного модуля, выбор проекта, сопоставление справочников и контроль первой синхронизации. Подключение модуля, настройка обмена и проверка результата.";
  const legacy = legacyArticleSections[id];
  if (!legacy)
    throw new Error(
      "KB_CONTENT_MISSING: Содержимое материала не найдено. Обновите страницу.",
    );
  return legacy.map((s) => `${s.title} ${s.text}`).join(" ");
};

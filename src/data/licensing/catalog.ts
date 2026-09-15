import type { ArticleSummary } from "../platform-data";
import sections from "./sections.json" with { type: "json" };
export const licensingArticleId = "licensing-system";
export const licensingFileName = "лицензирование-продуктов.pdf";
export const licensingSections = sections;
export const licensingTree = {
  id: "licensing",
  name: "Лицензирование nanoCAD",
  children: [
    { id: "licensing-overview", name: "Обзор и серийные номера" },
    { id: "licensing-services", name: "Службы и файлы лицензий" },
    { id: "licensing-hardware", name: "Привязка к оборудованию" },
  ],
};
// Dates describe the demo catalogue, separately from the source's 09.07.2026 update.
const excerpts = [
  [
    "serial",
    "Серийный номер и его состав",
    "Обзор и серийные номера",
    ["serial-number", "serial-parts"],
  ],
  [
    "prefixes",
    "Таблица префиксов серийных номеров (для 25-й версии ПО)",
    "Обзор и серийные номера",
    ["prefixes"],
  ],
  [
    "types",
    "Коммерческие, оценочные и образовательные лицензии",
    "Обзор и серийные номера",
    ["license-types"],
  ],
  [
    "kinds",
    "Виды лицензий: по сетевитости и по сроку действия",
    "Обзор и серийные номера",
    ["license-kinds"],
  ],
  [
    "transition",
    "Особенности переходного периода FlexLM → nanoLM в 2025–2027 годах",
    "Службы и файлы лицензий",
    ["license-service", "transition"],
  ],
  [
    "ports",
    "Мастер сетевых лицензий: настройка портов nanoLM",
    "Службы и файлы лицензий",
    ["network-wizard"],
  ],
  [
    "files",
    "Файл лицензии: расположение в nanoLM и FlexLM",
    "Службы и файлы лицензий",
    ["license-file", "nanolm-files", "flexlm-files"],
  ],
  [
    "hardware",
    "Привязка лицензии к оборудованию: ID1, ID2 и аппаратные ключи",
    "Привязка к оборудованию",
    ["hardware"],
  ],
] as const;
export const excerptSections: Record<string, readonly string[]> =
  Object.fromEntries(excerpts.map(([id, , , ids]) => [`licensing-${id}`, ids]));
export const licensingArticles: ArticleSummary[] = [
  {
    id: licensingArticleId,
    title: "Технические данные о системе лицензирования продуктов",
    description:
      "Полная статья: серийные номера, виды лицензий, nanoLM и FlexLM, файлы и привязка к оборудованию. Автор — Иван Немков; источник обновлён 09.07.2026.",
    section: "Лицензирование nanoCAD / Обзор и серийные номера",
    tags: ["Лицензирование", "Администратор", "Стандарты", "Обновление"],
    updated: "15.09.2026, 13:00",
    updatedAt: "2026-09-15T13:00:00+03:00",
    status: "Опубликована",
    kind: "article",
    allowedCompanyTypes: "all",
  },
  ...excerpts.map(([id, title, section], index): ArticleSummary => ({
    id: `licensing-${id}`,
    title,
    description:
      "Выдержка из статьи Ивана Немкова «Технические данные о системе лицензирования продуктов». Полный источник доступен внутри материала.",
    section: `Лицензирование nanoCAD / ${section}`,
    tags: ["Лицензирование", "Администратор"],
    updated: `15.09.2026, 12:${String(index).padStart(2, "0")}`,
    updatedAt: `2026-09-15T12:${String(index).padStart(2, "0")}:00+03:00`,
    status: "Опубликована",
    kind: "article",
    allowedCompanyTypes: "all",
  })),
];

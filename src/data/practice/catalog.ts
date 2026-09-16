import type { ArticleSummary } from "../platform-data";
import type { TreeNode } from "../knowledge-structure";

export const practiceTree: TreeNode = {
  id: "practice",
  name: "Практика работы",
  children: [
    {
      id: "practice-start",
      name: "Начало работы",
      children: [
        {
          id: "practice-team",
          name: "Команда проекта",
          children: [
            {
              id: "practice-pilot-section",
              name: "Подготовка пилотного проекта и согласование результатов с участниками",
            },
          ],
        },
      ],
    },
    {
      id: "practice-knowledge",
      name: "База знаний",
      children: [
        {
          id: "practice-review-section",
          name: "Подготовка и проверка материалов",
        },
      ],
    },
    {
      id: "practice-projects",
      name: "Проектирование",
      children: [
        {
          id: "practice-model-section",
          name: "Model Studio CS: совместная работа",
        },
      ],
    },
    {
      id: "practice-support",
      name: "Сопровождение",
      children: [
        { id: "practice-triage-section", name: "Разбор вопросов команды" },
      ],
    },
  ],
};
const pilotPath =
  "Практика работы / Начало работы / Команда проекта / Подготовка пилотного проекта и согласование результатов с участниками";
const reviewPath =
  "Практика работы / База знаний / Подготовка и проверка материалов";
const modelPath =
  "Практика работы / Проектирование / Model Studio CS: совместная работа";
const supportPath = "Практика работы / Сопровождение / Разбор вопросов команды";
export const practicePlacements: Record<string, string[]> = {
  "practice-pilot": [pilotPath],
  "practice-roles": [pilotPath],
  "practice-review": [reviewPath, pilotPath],
  "practice-model": [modelPath],
  "practice-escalation": [supportPath],
  "practice-handover": [supportPath],
};
// These are authored demo scenarios, not product instructions or customer agreements.
export const practiceArticles: ArticleSummary[] = [
  {
    id: "practice-pilot",
    title: "План пилотного проекта",
    description:
      "Демонстрационный пример: цель пилота, участники и журнал наблюдений.",
    section: pilotPath,
    tags: ["Проекты", "Стандарты", "НАВИСА", "Администратор"],
    updated: "16.09.2026, 09:00",
    updatedAt: "2026-09-16T09:00:00+03:00",
    status: "Опубликована",
    kind: "article",
    allowedCompanyTypes: "all",
  },
  {
    id: "practice-roles",
    title: "Договорённости команды перед началом работы",
    description:
      "Демонстрационный пример распределения ответственности и фиксации открытых вопросов.",
    section: pilotPath,
    tags: ["Проекты", "Проектировщик"],
    updated: "16.09.2026, 09:10",
    updatedAt: "2026-09-16T09:10:00+03:00",
    status: "Опубликована",
    kind: "article",
    allowedCompanyTypes: "all",
  },
  {
    id: "practice-review",
    title:
      "Проверка материала перед передачей коллегам: содержание, источники и доступность",
    description:
      "Демонстрационный редакционный разбор. Один материал размещён в двух разделах.",
    section: reviewPath,
    tags: ["Стандарты", "Проекты", "Администратор", "Проектировщик"],
    updated: "16.09.2026, 09:20",
    updatedAt: "2026-09-16T09:20:00+03:00",
    status: "Опубликована",
    kind: "article",
    allowedCompanyTypes: "all",
  },
  {
    id: "practice-model",
    title: "Обсуждение модели с коллегами",
    description:
      "Демонстрационный пример заметок по проекту Model Studio CS, без команд настройки ПО.",
    section: modelPath,
    tags: ["Model Studio CS", "Проекты", "Проектировщик"],
    updated: "16.09.2026, 09:30",
    updatedAt: "2026-09-16T09:30:00+03:00",
    status: "Опубликована",
    kind: "article",
    allowedCompanyTypes: ["Клиент", "ВИП-клиент", "Интегратор"],
  },
  {
    id: "practice-escalation",
    title: "Подготовка вопроса для совместного разбора",
    description:
      "Демонстрационная памятка с ограничением аудитории для проверки прав доступа.",
    section: supportPath,
    tags: ["Интеграция", "Администратор"],
    updated: "16.09.2026, 09:40",
    updatedAt: "2026-09-16T09:40:00+03:00",
    status: "Опубликована",
    kind: "article",
    allowedCompanyTypes: ["ВИП-клиент"],
  },
  {
    id: "practice-handover",
    title: "Черновик памятки по передаче результатов",
    description:
      "Демонстрационный черновик для авторов: что подготовлено и что ещё требует согласования.",
    section: supportPath,
    tags: ["Проекты", "Стандарты"],
    updated: "16.09.2026, 09:50",
    updatedAt: "2026-09-16T09:50:00+03:00",
    status: "Черновик",
    kind: "article",
    allowedCompanyTypes: [],
  },
];

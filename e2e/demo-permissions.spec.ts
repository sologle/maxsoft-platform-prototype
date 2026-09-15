import { test, expect } from "@playwright/test";

test("PL-10: удаление типа сохраняет аудиторию и требует отдельной замены компаний", async ({
  page,
}) => {
  await page.goto("./?page=company-types&role=portal-admin");
  await page.evaluate(() =>
    localStorage.setItem(
      "maxsoft-prototype-article-access",
      JSON.stringify({
        "network-license": "all",
        "cad-integration": ["Интегратор", "Клиент"],
        "project-template": ["Интегратор"],
        "server-migration": [],
        "update-2026": ["ВИП-клиент"],
      }),
    ),
  );
  await page.reload();
  const card = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Интегратор", exact: true }),
  });
  await card.getByRole("button", { name: "Удалить", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Удалить тип компании" });
  await expect(dialog.getByRole("button", { name: "Удалить тип", exact: true })).toBeDisabled();
  await dialog.getByLabel("Новый тип для компаний").selectOption("Клиент");
  await expect(dialog.getByRole("button", { name: "Удалить тип", exact: true })).toBeDisabled();
  await dialog.getByLabel("Новая аудитория статей").selectOption("ВИП-клиент");
  await dialog.getByRole("button", { name: "Отмена", exact: true }).click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("maxsoft-prototype-article-access")!)["project-template"],
    ),
  ).toEqual(["Интегратор"]);
  await card.getByRole("button", { name: "Удалить", exact: true }).click();
  await dialog.getByLabel("Новый тип для компаний").selectOption("Клиент");
  await dialog.getByLabel("Новая аудитория статей").selectOption("ВИП-клиент");
  await dialog.getByRole("button", { name: "Удалить тип", exact: true }).click();
  const state = await page.evaluate(() => ({
    access: JSON.parse(localStorage.getItem("maxsoft-prototype-article-access")!),
    companies: JSON.parse(localStorage.getItem("maxsoft-prototype-companies")!),
  }));
  expect(state.access).toEqual({
    "network-license": "all",
    "cad-integration": ["Клиент"],
    "project-template": ["ВИП-клиент"],
    "server-migration": [],
    "update-2026": ["ВИП-клиент"],
  });
  expect(state.companies.find((c: { id: string }) => c.id === "integrator-pro").type).toBe(
    "Клиент",
  );
});

test("PL-12: конфликт последней аудитории останавливает всё поддерево и отмена ничего не меняет", async ({
  page,
}) => {
  const initial = {
    "network-license": ["Интегратор"],
    "cad-integration": ["Интегратор", "Клиент"],
    "project-template": ["Интегратор", "Клиент"],
    "server-migration": [],
    "update-2026": ["ВИП-клиент"],
  };
  await page.goto("./?page=access-settings&role=portal-admin");
  await page.evaluate(
    (value) => localStorage.setItem("maxsoft-prototype-article-access", JSON.stringify(value)),
    initial,
  );
  await page.reload();
  await page.getByLabel("Компания для проверки").selectOption("integrator-pro");
  await page.getByRole("button", { name: "Закрыть раздел", exact: true }).first().click();
  const dialog = page.getByRole("dialog", { name: "Изменить доступ" });
  await expect(dialog).toContainText("Настройка сетевой лицензии");
  await expect(dialog.getByRole("button", { name: "Применить", exact: true })).toBeDisabled();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("maxsoft-prototype-article-access")!),
    ),
  ).toEqual(initial);
  await dialog.getByRole("button", { name: "Отмена", exact: true }).click();
  await expect(
    page.getByRole("switch", {
      name: "Доступ: Настройка интеграции с САПР-комплексом",
    }),
  ).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Закрыть раздел", exact: true }).first().click();
  await dialog.getByLabel("Другая аудитория").selectOption("Клиент");
  await dialog.getByRole("button", { name: "Применить", exact: true }).click();
  await page.getByRole("button", { name: "Сохранить изменения", exact: true }).click();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("maxsoft-prototype-article-access")!),
    ),
  ).toEqual({
    ...initial,
    "network-license": ["Клиент"],
    "cad-integration": ["Клиент"],
    "project-template": ["Клиент"],
  });
});

test("PL-06: PDF, DOCX, пересечение тегов, дерево и закрытые материалы", async ({ page }, info) => {
  await page.goto("./?page=search&role=client-employee");
  const input = page.getByRole("textbox", { name: "Поиск по базе знаний" });
  await input.fill("адрес сервера");
  await page.getByRole("button", { name: "Найти", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Открыть материал: Настройка сетевой лицензии",
    }),
  ).toContainText("Совпадение в тексте PDF");
  await input.fill("журнал обновления");
  await page.getByRole("button", { name: "Найти", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Открыть материал: Настройка сетевой лицензии",
    }),
  ).toContainText("Совпадение в тексте DOCX");
  await page.getByRole("button", { name: "Очистить поиск", exact: true }).click();
  const mobile = info.project.name.includes("mobile");
  if (mobile) await page.getByRole("button", { name: "Фильтры", exact: true }).click();
  await page.getByRole("button", { name: "Лицензирование", exact: true }).click();
  await page
    .getByRole("button", { name: "НАВИСА", exact: true })
    .and(page.locator("[aria-pressed]"))
    .click();
  if (mobile) await page.getByRole("button", { name: "Показать результаты" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Настройка сетевой лицензии",
      exact: true,
    }),
  ).toBeVisible();
  if (mobile) await page.getByRole("button", { name: /^Фильтры/ }).click();
  await page.getByRole("button", { name: "Стандарты", exact: true }).click();
  if (mobile) await page.getByRole("button", { name: "Показать результаты" }).click();
  await expect(page.getByRole("heading", { name: "Ничего не найдено" })).toBeVisible();
  for (const role of [
    "client-employee",
    "client-admin",
    "manager",
    "support-engineer",
    "portal-admin",
  ]) {
    await page.goto(`./?page=search&role=${role}`);
    await input.fill("Обновление компонентов до версии 2026");
    await page.getByRole("button", { name: "Найти", exact: true }).click();
    const result = page.getByRole("heading", {
      name: "Обновление компонентов до версии 2026",
      exact: true,
    });
    if (role.startsWith("client")) await expect(result).toHaveCount(0);
    else await expect(result).toBeVisible();
  }
});

test("PL-00: административные экраны закрыты клиентам, инженер выбирает существующие теги", async ({
  page,
}) => {
  for (const role of ["client-employee", "client-admin", "manager", "support-engineer"]) {
    for (const route of ["access-settings", "structure", "tags", "fields"]) {
      await page.goto(`./?page=${route}&role=${role}`);
      await expect(page.getByRole("heading", { name: "Нет доступа к разделу" })).toBeVisible();
    }
  }
  await page.goto("./?page=editor&role=support-engineer&resource=network-license");
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expect(page.getByRole("button", { name: "Новый тег", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Лицензирование", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

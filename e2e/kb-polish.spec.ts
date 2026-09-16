import { test, expect } from "@playwright/test";
const library = "./?page=knowledge&role=client-employee";
test("теги таблицы и карточек применяются к фильтру с сохранением при возврате", async ({ page }) => {
  await page.goto(library);
  const row = page.locator('[data-material-id="practice-review"]');
  const tag = row.getByRole("button", { name: "Фильтровать по тегу Проекты", exact: true });
  await tag.click();
  await expect(tag).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-material-id="network-license"]')).toHaveCount(0);
  await page.getByText("Фильтр по тегам · 1", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Проекты", exact: true })).toHaveAttribute("aria-pressed", "true");
  await row.getByRole("button", { name: /^Открыть материал:/ }).click();
  await page.goBack();
  await expect(page.getByText("Фильтр по тегам · 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Крупные карточки" }).click();
  await row.getByRole("button", { name: "Темы · 2" }).click();
  await row.getByRole("button", { name: "Фильтровать по тегу Стандарты", exact: true }).press("Enter");
  await expect(page.getByText("Фильтр по тегам · 2", { exact: true })).toBeVisible();
});
test("разделы кликабельны в обоих видах без повторов в подробностях", async ({ page }) => {
  await page.goto(library);
  const row = page.locator('[data-material-id="practice-review"]');
  await row.getByText("Подробности материала", { exact: true }).click();
  await expect(row.locator(".material-details-body")).not.toContainText("Разделы:");
  const sections = row.locator(".material-section-links button");
  await expect(sections).toHaveCount(2);
  await sections.filter({ hasText: "Подготовка и проверка материалов" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Подготовка и проверка материалов");
  await expect(page.locator('[data-material-id="network-license"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Крупные карточки" }).click();
  await sections.filter({ hasText: "Подготовка пилотного проекта" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Подготовка пилотного проекта");
});
test("тег и раздел в поиске уточняют выдачу без потери запроса", async ({ page }) => {
  await page.goto("./?page=search&role=client-employee&resource=Проверка материала");
  const row = page.locator('[data-material-id="practice-review"]');
  await row.getByRole("button", { name: "Фильтровать по тегу Проекты", exact: true }).click();
  await expect(page.getByRole("button", { name: "Убрать тег Проекты" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Поиск по базе знаний" })).toHaveValue("Проверка материала");
  await row.locator(".material-section-links button").filter({ hasText: "Подготовка и проверка материалов" }).click();
  await expect(row).toBeVisible();
  await expect(page).toHaveURL(/page=search/);
});
test("длинное дерево прокручивается внутри доступной высоты", async ({ page }, info) => {
  test.skip(info.project.name.includes("mobile"), "Мобильное дерево в отдельной панели");
  await page.setViewportSize({ width: 1440, height: 600 });
  await page.goto(library);
  const sidebar = page.locator("aside").filter({ has: page.getByRole("heading", { name: "Разделы", exact: true }) });
  const tree = sidebar.getByRole("navigation", { name: "Дерево разделов" });
  for (const name of ["Лицензирование nanoCAD", "Практика работы", "Начало работы", "Команда проекта", "База знаний"])
    await tree.getByRole("button", { name: `Развернуть раздел ${name}`, exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 400));
  const bottom = tree.getByRole("button", { name: "Подготовка и проверка материалов", exact: true });
  await bottom.scrollIntoViewIfNeeded();
  await expect(bottom).toBeInViewport();
  const geometry = await sidebar.evaluate((node) => ({ bottom: node.getBoundingClientRect().bottom, viewport: innerHeight }));
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewport);
});

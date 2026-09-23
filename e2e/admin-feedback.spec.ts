import { expect, test } from "@playwright/test";

test("изменение иерархии сохраняет порядок и вложенность", async ({ page }, info) => {
  await page.goto("./?page=structure&role=portal-admin");
  await expect(page.getByRole("button", { name: "Перетащить раздел Обновление" })).toHaveCount(0);
  await page.getByRole("button", { name: "Редактировать иерархию" }).click();
  if (info.project.use.hasTouch) {
    // Test the advertised touch menu instead of emulating mouse dragging.
    await page.getByRole("button", { name: "Действия: Обновление", exact: true }).click();
    await page.getByRole("menuitem", { name: "Переместить", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Родительский раздел", { exact: true }).selectOption("general");
    await dialog.getByRole("button", { name: "Сохранить", exact: true }).click();
  } else {
    const row = (name: string) => page.locator(".structure-node > .group").filter({ has: page.getByRole("button", { name: `Действия: ${name}` }) });
    await page.getByRole("button", { name: "Перетащить раздел Обновление" }).dragTo(row("Установка"), { targetPosition: { x: 70, y: 2 } });
    await expect.poll(async () => page.evaluate(() => {
      const tree = JSON.parse(localStorage.getItem("maxsoft-prototype-knowledge-tree") ?? "[]");
      return tree.find((node: { id: string }) => node.id === "products")?.children?.find((node: { id: string }) => node.id === "navisa")?.children?.[0]?.id;
    })).toBe("updates");
    await page.getByRole("button", { name: "Перетащить раздел Обновление" }).dragTo(row("Общие рекомендации"));
  }
  await expect.poll(async () => page.evaluate(() => {
    const tree = JSON.parse(localStorage.getItem("maxsoft-prototype-knowledge-tree") ?? "[]");
    return tree.find((node: { id: string }) => node.id === "products")?.children?.find((node: { id: string }) => node.id === "general")?.children?.[0]?.id;
  })).toBe("updates");
  await page.getByRole("button", { name: "Завершить редактирование" }).click();
  await expect(page.getByRole("button", { name: "Перетащить раздел Обновление" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("button", { name: "Свернуть раздел Общие рекомендации" })).toBeVisible();
  await expect(page.getByText("Обновление", { exact: true })).toBeVisible();
});

test("поиск тегов учитывает описание и показывает группу", async ({ page }) => {
  await page.goto("./?page=tags&role=portal-admin");
  await page.getByRole("button", { name: "Новый тег" }).click();
  const dialog = page.getByRole("dialog", { name: "Новый тег" });
  await dialog.getByLabel("Название тега").fill("Проверка поиска");
  await dialog.getByLabel("Группа").selectOption({ label: "Темы" });
  await dialog.getByLabel("Описание").fill("Космическая тематика");
  await dialog.getByRole("button", { name: "Сохранить" }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole("textbox", { name: "Поиск по тегам и группам" }).fill("космическая");
  await expect(page.getByText("Проверка поиска", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Свернуть группу Темы", exact: true })).toBeVisible();
  await expect(page.getByText("НАВИСА", { exact: true })).toHaveCount(0);
});

test("поиск файлов находит связанную статью и данные колонок", async ({ page }) => {
  await page.goto("./?page=files&role=portal-admin");
  await page.getByRole("button", { name: "Табличный вид" }).click();
  const search = page.getByRole("textbox", { name: "Поиск файлов" });
  await search.fill("Настройка сетевой лицензии");
  await expect(page.getByRole("row").filter({ hasText: "инструкция_активации.pdf" })).toBeVisible();
  await search.fill("2,4 МБ");
  await expect(page.getByRole("row").filter({ hasText: "инструкция_активации.pdf" })).toBeVisible();
});

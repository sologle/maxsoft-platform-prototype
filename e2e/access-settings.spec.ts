import { expect, test } from "@playwright/test";

test("отзыв доступа скрывает статьи и общее вложение во всех видах БЗ", async ({ page }) => {
  await page.goto("./?page=access-settings&role=portal-admin");
  await page.getByLabel("Компания для проверки", { exact: true }).selectOption("integrator-pro");
  for (const title of ["Настройка сетевой лицензии", "Настройка интеграции с САПР-комплексом"]) {
    const toggle = page.getByRole("switch", { name: `Доступ: ${title}`, exact: true });
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await toggle.click();
  }
  await page.getByRole("button", { name: "Сохранить изменения" }).click();
  await page.reload();
  await page.getByLabel("Компания для проверки", { exact: true }).selectOption("integrator-pro");
  await expect(page.getByRole("switch", { name: "Доступ: Настройка сетевой лицензии", exact: true })).toHaveAttribute("aria-checked", "false");
  await page.goto("./?page=knowledge&role=client-employee");
  await expect(page.getByRole("button", { name: "Открыть материал: Настройка сетевой лицензии", exact: true })).toHaveCount(0);
  const file = page.getByRole("button", { name: "Просмотреть файл: инструкция_активации.pdf", exact: true });
  await expect(file).toHaveCount(0);
  await page.getByRole("button", { name: "Крупные карточки" }).click();
  await expect(file).toHaveCount(0);
  await page.goto("./?page=file-preview&resource=инструкция_активации.pdf&role=client-employee");
  await expect(page.getByRole("heading", { name: "Нет доступа к разделу" })).toBeVisible();
});

test("маршруты без resource проверяют ACL демонстрационного материала", async ({ page }) => {
  await page.goto("./?page=access-settings&role=portal-admin");
  await page.getByLabel("Компания для проверки", { exact: true }).selectOption("integrator-pro");
  for (const title of ["Настройка сетевой лицензии", "Настройка интеграции с САПР-комплексом"]) {
    await page.getByRole("switch", { name: `Доступ: ${title}`, exact: true }).click();
  }
  await page.getByRole("button", { name: "Сохранить изменения" }).click();
  for (const route of ["article", "video", "file-preview"]) {
    await page.goto(`./?page=${route}&role=client-employee`);
    await expect(page.getByRole("heading", { name: "Нет доступа к разделу" })).toBeVisible();
  }
});

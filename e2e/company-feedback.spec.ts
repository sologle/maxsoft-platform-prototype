import { expect, test } from "@playwright/test";

test("карточка компании открывается на пользователях и приглашает в выбранную компанию", async ({ page }) => {
  await page.goto("./?page=company&resource=integrator-pro&role=portal-admin");
  await expect(page.getByRole("heading", { name: "Пользователи", exact: true })).toBeVisible();
  await expect(page.getByText("Запросы")).toBeVisible();
  await expect(page.getByText("Будут доступны на этапе 2")).toBeVisible();
  await page.getByRole("button", { name: "Реквизиты и контакты" }).click();
  await expect(page.getByRole("dialog", { name: "Реквизиты и контакты" })).toContainText("ИНН");
  await page.getByRole("button", { name: "Закрыть" }).click();

  await page.getByRole("button", { name: "Добавить", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Добавить пользователя" });
  await expect(dialog).toContainText("АО «Интегратор Про»");
  await dialog.getByLabel("Имя").fill("Новый");
  await dialog.getByLabel("Фамилия").fill("Сотрудник");
  await dialog.getByLabel("Корпоративная почта").fill("new.user@integrator.example");
  await dialog.getByRole("button", { name: "Отправить приглашение" }).click();
  await expect(page.getByText("Новый Сотрудник", { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page).toHaveURL(/page=company.*resource=integrator-pro/);
});

test("администратор возвращается из пользователей в администрирование", async ({ page }) => {
  await page.goto("./?page=users&role=portal-admin");
  await page.getByRole("button", { name: "В администрирование" }).click();
  await expect(page.getByRole("heading", { name: "Администрирование" })).toBeVisible();
});

test("карточка компании без resource открывает демонстрационную компанию", async ({ page }) => {
  await page.goto("./?page=company&role=portal-admin");
  await expect(page.getByRole("heading", { name: "ООО «СеверПромБИМ»" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Пользователи", exact: true })).toBeVisible();
});

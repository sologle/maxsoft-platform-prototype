import { expect, test } from "@playwright/test";

test("главная MaxSoft оставляет две кнопки и открывает формы на выбранном фоне", async ({ page }) => {
  await page.goto("./?page=landing&role=guest&background=wordmark");
  const landing = page.getByTestId("wordmark-landing");
  await expect(landing).toBeVisible();
  await expect(landing.getByRole("button")).toHaveCount(2);
  await expect(page.locator(".portal-auth-glass")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /06.*MaxSoft/ })).toHaveAttribute("aria-pressed", "true");
  await landing.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page.getByLabel("Электронная почта")).toBeVisible();
  await expect(page).toHaveURL(/page=login/);
  await expect(page).toHaveURL(/background=wordmark/);
  await page.getByRole("button", { name: "Вернуться на главную" }).click();
  await expect(landing).toBeVisible();
  await landing.getByRole("button", { name: "Регистрация", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Регистрация в портале" })).toBeVisible();
  await expect(page).toHaveURL(/background=wordmark/);
  await page.getByRole("button", { name: "Уже есть аккаунт" }).click();
  await page.getByRole("button", { name: "Вернуться на главную" }).click();
  await page.getByRole("button", { name: /05.*Живое/ }).click();
  await expect(landing).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Портал MaxSoft" })).toBeVisible();
  await expect(page.locator(".portal-auth-glass")).toBeVisible();
  await page.getByRole("button", { name: /06.*MaxSoft/ }).click();
  await expect(landing).toBeVisible();
  await page.reload();
  await expect(landing.getByRole("button")).toHaveCount(2);
});

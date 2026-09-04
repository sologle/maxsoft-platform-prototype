import { expect, test } from "@playwright/test";

test("тема переключается и сохраняется между перезагрузками", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);

  await page.getByRole("button", { name: "Включить тёмную тему" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("maxsoft-color-theme")))
    .toBe("dark");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Включить светлую тему" })).toBeVisible();
});

test("без сохранённого выбора используется системная тёмная тема", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("./?page=home&role=portal-admin");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Включить светлую тему" })).toBeVisible();
});

test("тёмная тема применяется к карточкам и адаптивным панелям", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("maxsoft-color-theme", "dark"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./?page=knowledge&role=portal-admin");

  const card = page.getByRole("button", { name: /Открыть материал:/ }).first();
  await expect(card).not.toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.getByRole("button", { name: "Показать разделы" }).click();
  const sheet = page.getByRole("dialog", { name: "Разделы базы знаний" });
  await expect(sheet).toBeVisible();
  await expect(sheet).not.toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
});

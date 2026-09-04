import { expect, test, type Page } from "@playwright/test";

const adminPages = [
  "home",
  "knowledge",
  "article",
  "video",
  "editor",
  "structure",
  "tags",
  "files",
  "file-preview",
  "search",
  "companies",
  "company",
  "company-types",
  "users",
  "administration",
  "integrations",
  "audit",
  "fields",
] as const;

const assertFitsViewport = async (page: Page) => {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
};

test("все основные страницы администратора рендерятся без горизонтального overflow", async ({ page }) => {
  test.setTimeout(90_000);
  for (const pageId of adminPages) {
    await page.goto(`./?page=${pageId}&role=portal-admin`);
    await expect(page.getByRole("heading", { name: "Нет доступа к разделу" })).toHaveCount(0);
    await expect(page.locator("main").first()).toBeVisible();
    await expect(page.locator("iframe")).toHaveCount(0);
    await assertFitsViewport(page);
  }
});

test("минимальная ширина 320px не ломает длинные названия и формы", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  for (const pageId of ["knowledge", "video", "editor", "companies", "fields"] as const) {
    await page.goto(`./?page=${pageId}&role=portal-admin`);
    await assertFitsViewport(page);
  }
});

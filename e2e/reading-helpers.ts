import type { Page } from "@playwright/test";
export const openReadingTools = async (page: Page) => {
  const tools = page.getByRole("region", { name: "Инструменты чтения" });
  if (!(await tools.isVisible())) {
    const mobile = page.getByRole("button", {
      name: "Меню статьи",
      exact: true,
    });
    if (await mobile.isVisible()) await mobile.click();
    else
      await page
        .getByRole("button", { name: "Развернуть панель чтения" })
        .click();
  }
  return tools;
};
export const closeReadingTools = async (page: Page) => {
  const close = page.getByRole("button", { name: "Закрыть меню статьи" });
  if (await close.isVisible()) await close.click();
};
export const jumpToAttachments = async (page: Page, count: number) => {
  await closeReadingTools(page);
  const rail = page.locator(".reading-service-rail");
  if (await rail.isVisible()) {
    await rail.getByRole("heading", { name: "Вложения", exact: true }).scrollIntoViewIfNeeded();
    return;
  }
  await page
    .getByRole("button", { name: "Развернуть содержание статьи" })
    .click();
  await page
    .getByRole("navigation", { name: "Содержание статьи", exact: true })
    .getByRole("link", { name: `Вложения · ${count}`, exact: true })
    .click();
};

import { expect, test, type Page } from "@playwright/test";

const expectNoRuntimeErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return () => expect(errors).toEqual([]);
};

test("гость входит в портал без технического лаунчера и iframe", async ({ page }) => {
  const verifyErrors = expectNoRuntimeErrors(page);
  await page.goto("./");
  await page.getByRole("button", { name: "Вход", exact: true }).click();
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Рабочее пространство" })).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  verifyErrors();
});

test("навигация автоматически перестраивается при изменении viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("./?page=home&role=portal-admin");
  await expect(page.getByTestId("desktop-navigation")).toBeVisible();
  await expect(page.getByRole("button", { name: "Открыть меню" })).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("desktop-navigation")).toBeHidden();
  await expect(page.getByRole("button", { name: "Открыть меню" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
});

test("мобильное меню выезжает поверх страницы и закрывается", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./?page=home&role=portal-admin");
  await page.getByRole("button", { name: "Открыть меню" }).click();

  const drawer = page.getByRole("dialog", { name: "Навигационное меню" });
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveCSS("position", "fixed");
  await expect(drawer).toHaveCSS("animation-name", "mobile-nav-in");
  await drawer.getByRole("link", { name: "База знаний" }).click();
  await expect(page).toHaveURL(/page=knowledge/);
  await expect(drawer).toBeHidden();
});

test("профильное меню закрывается по клику вне него", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./?page=home&role=portal-admin");
  await page.getByRole("button", { name: /Администратор.*Демо-профиль/ }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.getByRole("heading", { name: "Рабочее пространство" }).click();
  await expect(page.getByRole("menu")).toBeHidden();
});

test("рабочая область расширяется на большом экране, а панель показывает текущий экран", async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1400 });
  await page.goto("./?page=administration&role=portal-admin");
  const mainWidth = await page.locator("main").evaluate((node) => node.getBoundingClientRect().width);
  expect(mainWidth).toBeGreaterThan(2000);
  await page.getByRole("button", { name: "Открыть панель сценариев" }).click();
  await expect(page.getByText("Текущий экран")).toBeVisible();
  await expect(page.getByText("Администрирование", { exact: true }).first()).toBeVisible();
});

test("верхняя навигация администратора не перекрывает поиск", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("./?page=home&role=portal-admin");
  const nav = await page.getByTestId("desktop-navigation").boundingBox();
  const search = await page.getByRole("button", { name: "Открыть поиск" }).boundingBox();
  expect(nav).not.toBeNull();
  expect(search).not.toBeNull();
  expect(nav!.x + nav!.width).toBeLessThanOrEqual(search!.x);
});

test("разделы базы знаний сворачиваются и разворачиваются", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("./?page=knowledge&role=portal-admin");

  const navisa = page.getByRole("button", { name: "Свернуть раздел НАВИСА" });
  await expect(page.getByRole("button", { exact: true, name: "Настройка" })).toBeVisible();
  await navisa.click();
  await expect(page.getByRole("button", { exact: true, name: "Настройка" })).toBeHidden();
  const collapsedNavisa = page.getByRole("button", { name: "Развернуть раздел НАВИСА" });
  await expect(collapsedNavisa).toHaveAttribute("aria-expanded", "false");
  await collapsedNavisa.click();
  await expect(page.getByRole("button", { exact: true, name: "Настройка" })).toBeVisible();
});

test("mobile bottom sheet остаётся внутри viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./?page=knowledge&role=portal-admin");
  await page.getByRole("button", { name: "Показать разделы" }).click();

  const sheet = page.getByRole("dialog", { name: "Разделы базы знаний" });
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveCSS("position", "fixed");
  await expect
    .poll(() => sheet.evaluate((node) => node.parentElement?.parentElement === document.body))
    .toBe(true);
  await sheet.evaluate(async (node) => {
    await Promise.all(node.getAnimations().map((animation) => animation.finished));
  });
  const box = await sheet.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});

test("администратор получает одинаковые действия с пользователями на любой ширине", async ({ page }) => {
  await page.goto("./?page=users&role=portal-admin");
  const actions = page.getByRole("button", { name: "Действия: Анна Смирнова" });
  await expect(actions).toBeVisible();
  await expect(actions).toHaveAttribute("aria-expanded", "false");
  await actions.click();
  await expect(page.getByRole("menuitem", { name: "Изменить роль" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Отозвать доступ" })).toBeVisible();
});

test("контекстное меню закрывается по Escape и клику снаружи", async ({ page }) => {
  await page.goto("./?page=users&role=portal-admin");
  const actions = page.getByRole("button", { name: "Действия: Анна Смирнова" });
  await actions.click();
  await expect(page.getByRole("menuitem", { name: "Изменить роль" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menuitem", { name: "Изменить роль" })).toBeHidden();

  await actions.click();
  await page.getByRole("heading", { name: "Пользователи" }).click();
  await expect(page.getByRole("menuitem", { name: "Изменить роль" })).toBeHidden();
});

test("контекстное меню управляется с клавиатуры", async ({ page }) => {
  await page.goto("./?page=users&role=portal-admin");
  await page.getByRole("button", { name: "Действия: Анна Смирнова" }).click();
  const changeRole = page.getByRole("menuitem", { name: "Изменить роль" });
  const audit = page.getByRole("menuitem", { name: "Открыть записи журнала" });
  const block = page.getByRole("menuitem", { name: "Заблокировать" });
  const remove = page.getByRole("menuitem", { name: "Отозвать доступ" });
  await expect(changeRole).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(audit).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(block).toBeFocused();
  await page.keyboard.press("End");
  await expect(remove).toBeFocused();
  await page.keyboard.press("Home");
  await expect(changeRole).toBeFocused();
});

test("модальные поверхности изолируют фон и не дублируют dialog", async ({ page }, testInfo) => {
  await page.goto("./?page=editor&role=portal-admin");
  await page.getByRole("button", { name: "Настройки" }).click();
  await expect(page.locator("#root")).toHaveAttribute("inert", "");
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.getByRole("dialog").getByRole("button", { name: "Закрыть" }).click();

  if (!testInfo.project.name.startsWith("mobile")) return;
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await expect(page.locator("#root")).toHaveAttribute("inert", "");
  await expect(page.getByRole("dialog")).toHaveCount(1);
});

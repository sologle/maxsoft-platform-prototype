import { expect, test } from "@playwright/test";

test("база знаний переключается между таблицей и карточками", async ({ page }) => {
  await page.goto("./?page=knowledge&role=portal-admin");
  await expect(page.getByTestId("knowledge-table-view")).toBeVisible();
  await page.getByRole("button", { name: "Крупные карточки" }).click();
  await expect(page.getByTestId("knowledge-card-view")).toBeVisible();
  await page.getByRole("button", { name: "Табличный вид" }).click();
  await expect(page.getByTestId("knowledge-table-view")).toBeVisible();
});

test("фирменный выпадающий список открывает стилизованное меню", async ({ page }) => {
  await page.goto("./?page=knowledge&role=portal-admin");
  await page.getByRole("button", { name: "Открыть варианты. Выбрано: Сначала обновлённые" }).click();
  const listbox = page.getByRole("listbox", { name: "Сортировка" });
  await expect(listbox).toBeVisible();
  await listbox.getByRole("option", { name: "По названию" }).click();
  await expect(page.getByRole("button", { name: "Открыть варианты. Выбрано: По названию" })).toBeVisible();
});

test("администратор настраивает доступ компании к материалам", async ({ page }) => {
  await page.goto("./?page=administration&role=portal-admin");
  await page.getByRole("button", { name: /Доступ к материалам/ }).click();
  await expect(page.getByRole("heading", { name: "Доступ к материалам" })).toBeVisible();
  await page.getByLabel("Компания для проверки").selectOption("integrator-pro");
  const access = page.getByRole("switch", { name: "Доступ: Настройка сетевой лицензии" });
  await expect(access).toHaveAttribute("aria-checked", "true");
  await access.click();
  await page.getByRole("button", { name: "Сохранить изменения" }).click();
  await expect(page.getByRole("status")).toContainText("Интегратор");
  await page.goto("./?page=article&resource=network-license&role=client-employee");
  await expect(page.getByRole("heading", { name: "Нет доступа к разделу" })).toBeVisible();
});

test("поиск выделяет совпадение и открывает материал кликом по карточке", async ({ page }) => {
  await page.goto("./?page=search&role=client-employee");
  const result = page.getByRole("button", { name: /Открыть материал: Настройка сетевой лицензии/ });
  await expect(result.locator("mark").filter({ hasText: /лиценз/i }).first()).toBeVisible();
  await expect(result).toContainText("Совпадение в заголовке статьи");
  await result.click();
  await expect(page.getByRole("heading", { name: "Настройка сетевой лицензии" })).toBeVisible();
});

test("статья меняет размер текста и включает полноэкранный режим чтения", async ({ page }) => {
  await page.goto("./?page=article&role=portal-admin");
  const article = page.getByRole("article");
  const before = await article.locator(".article-content").evaluate((node) => getComputedStyle(node).fontSize);
  await page.getByRole("button", { name: "Увеличить размер текста" }).click();
  await expect
    .poll(() => article.locator(".article-content").evaluate((node) => getComputedStyle(node).fontSize))
    .not.toBe(before);
  await page.getByRole("button", { name: "На весь экран" }).click();
  await expect(article).toHaveAttribute("data-reading-mode", "fullscreen");
  await expect(article.getByRole("navigation", { name: "Содержание статьи" })).toBeVisible();
  await article.getByRole("button", { name: "Развернуть содержание статьи" }).click();
  await expect(article.getByRole("link", { name: "Перед началом работы" })).toBeVisible();
  await article.getByRole("button", { name: "Свернуть содержание статьи" }).click();
  await expect(article.getByRole("link", { name: "Перед началом работы" })).toBeHidden();
  await page.getByRole("button", { name: "Выйти из полноэкранного режима" }).click();
  await expect(article).toHaveAttribute("data-reading-mode", "standard");
});

test("размер текста статьи уменьшается до 70 процентов", async ({ page }) => {
  await page.goto("./?page=article&role=portal-admin");
  const decrease = page.getByRole("button", { name: "Уменьшить размер текста" });
  await decrease.click();
  await decrease.click();
  await decrease.click();
  await expect(page.getByText("70%", { exact: true })).toBeVisible();
  await expect(decrease).toBeDisabled();
});

test("гостевая главная показывает вход без прокрутки", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByTestId("wordmark-landing")).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти", exact: true })).toBeInViewport();
  await expect(page.getByRole("button", { name: "Регистрация" })).toBeInViewport();
  await expect(page.getByTestId("portal-auth-backdrop")).toBeVisible();
});


test("содержание обычной статьи остаётся кликабельным под шапкой при прокрутке", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto("./?page=article&role=portal-admin");
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
  const toggle = page.getByRole("button", { name: "Развернуть содержание статьи" });
  await expect.poll(() => toggle.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
  })).toBe(true);
  await toggle.click();
  await expect(page.getByRole("link", { name: "Перед началом работы", exact: true })).toBeVisible();
});

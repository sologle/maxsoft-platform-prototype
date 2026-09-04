import { expect, test } from "@playwright/test";

test("список управляется клавиатурой и возвращает фокус", async ({ page }) => {
  await page.goto("./?page=knowledge&role=portal-admin");
  const trigger = page.getByRole("button", { name: /^Открыть варианты\. Выбрано:/ });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  const menu = page.getByRole("listbox", { name: "Сортировка" });
  await expect(menu).toBeVisible();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Сортировка", { exact: true })).toHaveValue("title");
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByLabel("Сортировка", { exact: true })).toHaveAttribute("tabindex", "-1");
});

test("список экранов помещается над панелью сценариев", async ({ page }) => {
  await page.goto("./?page=knowledge&role=portal-admin");
  await page.getByRole("button", { name: "Открыть панель сценариев" }).click();
  await page.getByRole("button", { name: "Открыть варианты. Выбрано: База знаний" }).click();
  const menu = page.getByRole("listbox", { name: "Экран", exact: true });
  await expect(menu).toBeVisible();
  const bounds = await menu.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await menu.getByRole("option", { name: "Доступ к материалам", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Доступ к материалам" })).toBeVisible();
});

test("список в форме сохраняет выбор и Escape закрывает только меню", async ({ page }) => {
  await page.goto("./?page=tags&role=portal-admin");
  await page.getByRole("button", { name: "Новый тег" }).click();
  const dialog = page.getByRole("dialog", { name: "Новый тег" });
  await dialog.getByLabel("Название тега").fill("Проверка меню");
  await dialog.getByRole("button", { name: /Открыть варианты/ }).click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("listbox")).toBeHidden();
  await dialog.getByRole("button", { name: /Открыть варианты/ }).click();
  await dialog.getByRole("option", { name: "Темы", exact: true }).click();
  await expect(dialog.getByLabel("Группа", { exact: true })).toHaveValue("topics");
  await dialog.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByText("Проверка меню", { exact: true })).toBeVisible();
});

test("выбор в неконтролируемом списке попадает в данные формы", async ({ page }) => {
  await page.goto("./?page=users&role=portal-admin");
  await page.getByRole("button", { name: "Пригласить пользователя" }).click();
  const dialog = page.getByRole("dialog", { name: "Пригласить пользователя" });
  await dialog.getByLabel("Имя", { exact: true }).fill("Проверка");
  await dialog.getByLabel("Фамилия", { exact: true }).fill("Списка");
  await dialog.getByLabel("Корпоративная почта").fill("select.check@integrator-pro.ru");
  await dialog.getByRole("button", { name: "Открыть варианты. Выбрано: ООО «СеверПромБИМ»" }).click();
  await dialog.getByRole("option", { name: "АО «Интегратор Про»", exact: true }).click();
  await dialog.getByRole("button", { name: "Открыть варианты. Выбрано: Сотрудник клиента" }).click();
  await dialog.getByRole("option", { name: "Администратор клиента", exact: true }).click();
  await dialog.getByRole("button", { name: "Отправить приглашение" }).click();
  await page.reload();
  const user = page.getByRole("row").filter({ hasText: "Проверка Списка" }).or(page.locator("article").filter({ hasText: "Проверка Списка" })).filter({ visible: true });
  await expect(user).toContainText("АО «Интегратор Про»");
  await expect(user).toContainText("Администратор клиента");
});

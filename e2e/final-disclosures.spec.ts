import { expect, test } from "@playwright/test";

test("POL-14: доступ редактора закрывается с fade и сразу исключается из фокуса", async ({ page }) => {
  await page.goto("./?page=editor&role=portal-admin");
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Настройки статьи" });
  await dialog.getByRole("radio", { name: "Только выбранные типы" }).check();
  const types = dialog.getByRole("region", { name: "Типы компаний с доступом" });
  await expect(types).toHaveCSS("opacity", "1");
  const exit = await dialog.getByRole("radio", { name: "Все типы компаний" }).evaluate(async (node: HTMLInputElement) => {
    node.click();
    await new Promise(requestAnimationFrame);
    const surface = document.querySelector('[aria-label="Типы компаний с доступом"]');
    const checkbox = surface?.querySelector<HTMLInputElement>("input");
    checkbox?.focus();
    // A delayed frame may run after the exit animation has already unmounted it.
    return { inert: !surface || surface.hasAttribute("inert"), focused: document.activeElement === checkbox };
  });
  expect(exit).toEqual({ inert: true, focused: false });
  await dialog.getByRole("radio", { name: "Только выбранные типы" }).check();
  await expect(types).toBeVisible();
  await expect(types.getByRole("checkbox").first()).toBeChecked();
  for (const checkbox of await types.getByRole("checkbox").all()) await checkbox.uncheck();
  await expect(dialog.getByRole("alert")).toContainText("KB_ACCESS_TYPE_REQUIRED");
  await expect(dialog.getByRole("button", { name: "Сохранить настройки" })).toBeDisabled();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await dialog.getByRole("radio", { name: "Все типы компаний" }).check();
  await expect(types).toHaveCount(0);
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Сохранить настройки" })).toBeEnabled();
});

test("POL-14: подсказки поиска доступны клавиатурой и touch, закрываются без гонки", async ({ page }, info) => {
  await page.goto("./?page=search&role=client-employee");
  const input = page.getByRole("textbox", { name: "Поиск по базе знаний" });
  await input.fill("Лиц");
  const suggestions = page.getByRole("region", { name: "Подсказки тегов" });
  await expect(suggestions).toHaveCSS("opacity", "1");
  const suggestion = suggestions.getByRole("button", { name: "Лицензирование", exact: true });
  // Tab can enter the suggestions without the input's old blur timer removing them.
  await input.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(suggestion).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(input).toBeFocused();
  await expect(suggestions).toBeHidden();
  await input.fill("Лице");
  await expect(suggestions).toBeVisible();
  if (info.project.use.hasTouch) await suggestion.tap();
  else await suggestion.press("Enter");
  await expect(page.getByRole("button", { name: "Убрать тег Лицензирование" })).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(suggestions).toBeHidden();
  await input.fill("Лиц");
  await page.getByRole("heading", { name: "Результаты поиска" }).click();
  await input.click();
  await expect(suggestions).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await input.press("Escape");
  await expect(suggestions).toHaveCount(0);
});

test("POL-19: подсказки ограничены узким и коротким VisualViewport", async ({ page }) => {
  for (const [width, height] of [[320, 600], [568, 320], [720, 450]]) {
    await page.setViewportSize({ width, height });
    await page.goto("./?page=search&role=client-employee");
    const input = page.getByRole("textbox", { name: "Поиск по базе знаний" });
    await input.fill("Про");
    const suggestions = page.getByRole("region", { name: "Подсказки тегов" });
    await expect(suggestions).toHaveCSS("opacity", "1");
    const box = (await suggestions.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(height);
    await input.press("Escape");
    await expect(suggestions).toBeHidden();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./?page=search&role=client-employee");
  const input = page.getByRole("textbox", { name: "Поиск по базе знаний" });
  await input.fill("Про");
  await page.evaluate(() => {
    Object.defineProperty(visualViewport!, "height", { configurable: true, value: 360 });
    visualViewport!.dispatchEvent(new Event("resize"));
  });
  const suggestions = page.getByRole("region", { name: "Подсказки тегов" });
  const box = (await suggestions.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(360);
  await suggestions.getByRole("button", { name: "Проекты", exact: true }).click();
  await expect(page.getByRole("button", { name: "Убрать тег Проекты" })).toBeVisible();
  await expect(input).toBeFocused();
});

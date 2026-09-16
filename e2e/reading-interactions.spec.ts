import { test, expect } from "@playwright/test";
import { openReadingTools, closeReadingTools } from "./reading-helpers";
const url = "./?page=article&role=client-employee&resource=licensing-system";
test("оглавление: hover-переход к списку и Escape без предварительного фокуса", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(url);
  const trigger = page.locator(".reading-toc-trigger");
  if (await page.evaluate(() => matchMedia("(hover: hover)").matches)) {
    await trigger.hover();
    const toc = page.getByRole("navigation", {
      name: "Содержание статьи",
      exact: true,
    });
    await expect(toc).toBeVisible();
    await toc.getByRole("link", { name: "Виды лицензий", exact: true }).hover();
    await expect(toc).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(toc).toBeHidden();
    await expect(trigger).toBeFocused();
  } else {
    await trigger.tap();
    await page.getByRole("button", { name: "Закрыть содержание" }).tap();
    await expect(trigger).toBeFocused();
  }
});
test("масштаб и повторное открытие инструментов сохраняют место чтения", async ({
  page,
}) => {
  await page.goto(url);
  await page.locator(".reading-toc-trigger").click();
  await page
    .locator(".reading-toc-panel")
    .getByRole("link", { name: "Привязка к оборудованию", exact: true })
    .click();
  const heading = page.getByRole("heading", {
    name: "Привязка к оборудованию",
    exact: true,
  });
  const top = (await heading.boundingBox())!.y;
  const tools = await openReadingTools(page);
  for (let n = 0; n < 4; n++)
    await tools
      .getByRole("button", { name: "Увеличить размер текста" })
      .click();
  await closeReadingTools(page);
  expect(Math.abs((await heading.boundingBox())!.y - top)).toBeLessThan(2);
  await openReadingTools(page);
  await closeReadingTools(page);
  expect(Math.abs((await heading.boundingBox())!.y - top)).toBeLessThan(2);
});
test("reduced motion: закрытие сразу освобождает инструменты, фон доступен", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url);
  const tools = await openReadingTools(page);
  await closeReadingTools(page);
  await expect(tools).toHaveCount(0);
  await openReadingTools(page);
  await page
    .getByRole("button", { name: "Включить тёмную тему", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(tools).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Сохранено", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("первый переход к скрытым вложениям переводит фокус на заголовок", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await expect(page.locator(".reading-intro")).not.toHaveAttribute("open");
  await page.locator(".reading-toc-trigger").click();
  await page
    .locator(".reading-toc-panel")
    .getByRole("link", { name: "Вложения · 1" })
    .click();
  await expect(page.locator("#attachments-title")).toBeFocused();
  await expect(page.locator("#attachments-title")).toBeInViewport();
});
test("сдвинутый VisualViewport: якорь остаётся ниже панелей в обоих режимах", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  for (const mode of ["standard", "fullscreen"]) {
    if (mode === "fullscreen") {
      const tools = await openReadingTools(page);
      await tools
        .getByRole("button", { name: "На весь экран", exact: true })
        .click();
      await closeReadingTools(page);
    }
    await page.evaluate(() => {
      Object.defineProperty(visualViewport!, "offsetTop", {
        configurable: true,
        value: 80,
      });
      Object.defineProperty(visualViewport!, "height", {
        configurable: true,
        value: 560,
      });
      visualViewport!.dispatchEvent(new Event("resize"));
    });
    await page.locator(".reading-toc-trigger").click();
    await page
      .locator(".reading-toc-panel")
      .getByRole("link", { name: "Виды лицензий", exact: true })
      .click();
    const heading = await page
      .getByRole("heading", { name: "Виды лицензий", exact: true })
      .boundingBox();
    const trigger = await page.locator(".reading-toc-trigger").boundingBox();
    expect(heading!.y).toBeGreaterThanOrEqual(trigger!.y + trigger!.height);
  }
});

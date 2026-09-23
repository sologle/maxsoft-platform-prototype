import {
  openReadingTools,
  closeReadingTools,
  jumpToAttachments,
} from "./reading-helpers";
import { test, expect, type Page } from "@playwright/test";
const articleUrl =
  "./?page=article&role=client-employee&resource=licensing-system";
const noOverflow = async (page: Page) => {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  expect(
    await page
      .locator(".reading-layout")
      .evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
  ).toBe(true);
};
for (const width of [320, 390, 768, 1024, 1440])
  for (const theme of ["light", "dark"]) {
    test(`чтение ${width}px ${theme}: режимы, масштаб и оглавление`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(articleUrl);
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t;
      }, theme);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      for (const mode of ["standard", "fullscreen"]) {
        await openReadingTools(page);
        if (mode === "fullscreen")
          await page
            .getByRole("button", { name: "На весь экран", exact: true })
            .click();
        for (const scale of [100, 140]) {
          await openReadingTools(page);
          await page
            .getByRole("button", { name: "Сбросить размер текста до 100%" })
            .click();
          if (scale === 140)
            for (let n = 0; n < 4; n++)
              await page
                .getByRole("button", { name: "Увеличить размер текста" })
                .click();
          await closeReadingTools(page);
          const trigger = page.locator(".reading-toc-trigger");
          const desktop = width >= 1024;
          if (!desktop) await trigger.click();
          const toc = desktop
            ? page.locator(".reading-service-rail").getByRole("navigation", { name: "Содержание статьи" })
            : page.locator(".reading-toc-panel");
          await expect(toc).toBeVisible();
          await toc
            .getByRole("link", { name: "Виды лицензий", exact: true })
            .click();
          const headingY = await page
            .getByRole("heading", { name: "Виды лицензий", exact: true })
            .evaluate((n) => n.getBoundingClientRect().top);
          expect(headingY).toBeGreaterThanOrEqual(mode === "standard" ? 55 : 0);
          await expect(
            page.getByRole("tab", { name: "По сетевитости" }),
          ).toBeInViewport();
          await page.getByRole("tab", { name: "По сроку действия" }).click();
          await expect(page.getByRole("tabpanel")).toContainText(
            "Постоянная лицензия",
          );
          await noOverflow(page);
          await jumpToAttachments(page, 1);
          await expect(
            page.getByRole("heading", { name: "Вложения", exact: true }),
          ).toBeInViewport();
          if (!desktop) {
            await expect(page.locator(".toc-bar-active")).toHaveCount(1);
            await trigger.focus();
            await expect(toc).toBeVisible();
            await trigger.press("Escape");
            await expect(toc).toHaveCount(0);
            await expect(trigger).toBeFocused();
          }
          await expect(page.locator(".reading-layout")).toHaveAttribute(
            "data-reading-mode",
            mode,
          );
          await noOverflow(page);
        }
        const tools = await openReadingTools(page);
        await expect(tools.locator('[aria-current="page"]')).toContainText(
          "Технические данные",
        );
      }
      await openReadingTools(page);
      await page
        .getByRole("button", { name: "Выйти из полноэкранного режима" })
        .click();
      await expect(page.locator(".reading-layout")).toHaveAttribute(
        "data-reading-mode",
        "standard",
      );
    });
  }
test("оглавление следует ручной прокрутке и не меняет ширину текста", async ({
  page,
}, info) => {
  await page.goto(articleUrl);
  const material = page.locator(".reading-material");
  const before = await material.boundingBox();
  const trigger = page.locator(".reading-toc-trigger");
  const mobile = info.project.name.includes("mobile");
  if (mobile) await trigger.tap();
  const toc = mobile
    ? page.locator(".reading-toc-panel")
    : page.locator(".reading-service-rail").getByRole("navigation", { name: "Содержание статьи" });
  await expect(toc).toBeVisible();
  expect((await material.boundingBox())!.width).toBe(before!.width);
  await toc.getByRole("link", { name: "Привязка к оборудованию", exact: true }).click();
  if (mobile) await trigger.focus();
  await expect(
    toc.locator('a[aria-current="location"]'),
  ).toHaveText("Привязка к оборудованию");
  if (mobile) await trigger.press("Escape");
  await page.evaluate(() => window.scrollTo(0, 0));
  if (mobile) await trigger.press("Enter");
  await expect(toc.locator('a[aria-current="location"]')).toHaveText(mobile ? "Вложения · 1" : "Описание");
});

test("выход из полноэкранного чтения сохраняет исходную позицию статьи", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(articleUrl);
  await openReadingTools(page);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 3500));
  const before = await page.evaluate(() => window.scrollY);
  await openReadingTools(page);
  await page
    .getByRole("button", { name: "На весь экран", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Выйти из полноэкранного режима" })
    .click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
});

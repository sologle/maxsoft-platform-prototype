import { test, expect, type Page, type Locator } from "@playwright/test";
import { companies } from "../src/data/platform-data";
const checkScreen = async (page: Page) => {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  // Inspect local containers too: an overflow-hidden ancestor must not conceal defects.
  const overflowing = await page
    .locator(
      "main section, main article, main dd, [role=dialog] form, [role=dialog] label",
    )
    .evaluateAll((nodes) =>
      nodes
        .filter((n) => {
          const e = n as HTMLElement;
          return (
            e.getBoundingClientRect().width > 0 &&
            e.scrollWidth > e.clientWidth + 2
          );
        })
        .map((n) => n.tagName + ": " + n.textContent?.slice(0, 60)),
    );
  expect(overflowing).toEqual([]);
};
const reachable = async (locator: Locator) => {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeInViewport();
  expect(
    await locator.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return el.contains(
        document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
      );
    }),
  ).toBe(true);
};
for (const width of [390, 768, 1024, 1440])
  for (const theme of ["light", "dark"])
    test(`DEMO-08 итог: ${width}px ${theme}`, async ({ page }, info) => {
      test.setTimeout(60000);
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(
        (theme) => localStorage.setItem("maxsoft-color-theme", theme),
        theme,
      );
      await page.goto("./?page=fields&role=portal-admin");
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t;
      }, theme);
      await checkScreen(page);
      const toggle = page.getByRole("switch", {
        name: "Менеджер видит: Проект",
        exact: true,
      });
      await reachable(toggle);
      await toggle.focus();
      await toggle.press("Space");
      await expect(toggle).toHaveAttribute("aria-checked", "false");
      await toggle.press("Space");
      await reachable(
        page.getByRole("button", { name: "Сохранить настройки" }),
      );
      await page.getByRole("button", { name: "Сохранить настройки" }).click();
      await page.evaluate(() => scrollTo(0, 0));
      if (info.project.name === "desktop-chromium")
        await page.screenshot({
          path: `/tmp/maxsoft-final-${width}-${theme}-fields.png`,
        });
      await page.goto("./?page=company&role=manager&resource=severprom");
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t;
      }, theme);
      await checkScreen(page);
      await page
        .getByRole("button", { name: "Редактировать", exact: true })
        .click();
      await checkScreen(page);
      const dialog = page.getByRole("dialog");
      for (const input of await dialog
        .locator("input:not([type=hidden])")
        .all())
        await reachable(input);
      await reachable(
        dialog.getByRole("button", { name: "Сохранить компанию" }),
      );
      await dialog.getByRole("button", { name: "Сохранить компанию" }).click();
      await expect(dialog).toHaveCount(0);
      await page.evaluate(
        (records) =>
          localStorage.setItem(
            "maxsoft-prototype-companies",
            JSON.stringify(
              records.map((c) => ({
                ...c,
                project: "ДлинноеНазваниеБезПробелов".repeat(10),
                legalAddress: "ДлинныйАдресБезПробелов".repeat(10),
              })),
            ),
          ),
        companies,
      );
      await page.reload();
      await checkScreen(page);
      if (info.project.name === "desktop-chromium")
        await page.screenshot({
          path: `/tmp/maxsoft-final-${width}-${theme}-company.png`,
        });
      await page.goto("./?page=home&role=manager");
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t;
      }, theme);
      await checkScreen(page);
      if (info.project.name === "desktop-chromium")
        await page.screenshot({
          path: `/tmp/maxsoft-final-${width}-${theme}-home.png`,
        });
      await page.getByRole("button", { name: /Демо-профиль$/ }).click();
      const help = page.getByRole("menuitem", {
        name: "Как пользоваться порталом",
      });
      await reachable(help);
      if (info.project.use.isMobile) await help.tap();
      else {
        await help.focus();
        await help.press("Enter");
      }
      await expect(
        page.getByRole("heading", {
          name: "Как пользоваться порталом",
          exact: true,
        }),
      ).toBeVisible();
      await checkScreen(page);
      if (info.project.name === "desktop-chromium")
        await page.screenshot({
          path: `/tmp/maxsoft-final-${width}-${theme}-help.png`,
        });
    });

import { expect, test } from "@playwright/test";
import { pageDefinitions } from "../src/app/routes";

// Every registered route is visited with a permitted role. Behavioral journeys
// stay in their dedicated suites; this catches shared-shell regressions.
for (const theme of ["light", "dark"] as const) {
  for (const family of ["guest", "knowledge", "administration", "personal"] as const) {
    test(`POL-19: активные экраны ${family}, ${theme}`, async ({ page }) => {
      test.setTimeout(90_000);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.addInitScript(
        (value) => localStorage.setItem("maxsoft-color-theme", value),
        theme,
      );
      const knowledge = new Set(["home", "knowledge", "search", "article", "video", "file-preview", "editor"]);
      const personal = new Set(["help", "client-users", "access-denied"]);
      const routes = pageDefinitions.filter((route) => {
        const group = route.roles.includes("guest") ? "guest"
          : knowledge.has(route.id) ? "knowledge"
          : personal.has(route.id) ? "personal" : "administration";
        return group === family;
      });
      expect(routes.length).toBeGreaterThan(0);
      for (const route of routes) {
        await test.step(route.id, async () => {
          const role = route.id === "help" ? "client-employee" : route.roles[0];
          await page.goto(`./?page=${route.id}&role=${role}`);
          if (route.id === "editor")
            await expect(page.getByRole("textbox", { name: "Название статьи" })).toBeVisible();
          else
            await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          if (route.id !== "access-denied") {
            await expect(page.getByRole("heading", { name: "Нет доступа к разделу" })).toHaveCount(0);
            await expect(page.getByRole("heading", { name: "Не удалось загрузить данные" })).toHaveCount(0);
          }
          await expect.poll(() => page.evaluate(
            () => document.documentElement.scrollWidth - innerWidth,
          ), { message: `${route.id}: страница не должна прокручиваться горизонтально` }).toBeLessThanOrEqual(1);
          await expect(page.locator("#root")).not.toHaveAttribute("inert", "");
          expect(errors, `${route.id}: ошибки выполнения`).toEqual([]);
        });
      }
    });
  }
}

import { test, expect } from "@playwright/test";

test("PL-02–04: масштаб, якоря и панель в обоих режимах", async ({ page }, info) => {
  await page.goto("./?page=article&role=client-employee");
  const mobile = info.project.name.includes("mobile");
  const open = async () => {
    const button = page.getByRole("button", {
      name: "Развернуть содержание статьи",
    });
    if (await button.count()) await button.click();
  };
  await open();
  const baseline = await page
    .locator("article h1")
    .evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
  for (const mode of ["standard", "fullscreen"]) {
    if (mode === "fullscreen") {
      await open();
      await page.getByRole("button", { name: "На весь экран", exact: true }).click();
    }
    for (const scale of [70, 140]) {
      await open();
      await page.getByRole("button", { name: "Сбросить размер текста до 100%" }).click();
      for (let i = 0; i < Math.abs(scale - 100) / 10; i++)
        await page
          .getByRole("button", {
            name: scale < 100 ? "Уменьшить размер текста" : "Увеличить размер текста",
          })
          .click();
      expect(
        await page
          .locator("article h1")
          .evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
      ).toBeCloseTo((baseline * scale) / 100, 0);
      for (const title of ["Перед началом работы", "Диагностика"]) {
        await open();
        await page.getByRole("link", { name: title, exact: true }).click();
        // The anchor scroll runs on the next animation frame after collapsing the panel.
        await expect
          .poll(() =>
            page.getByRole("heading", { name: title, exact: true }).evaluate(
              (node, state) => {
                const rect = node.getBoundingClientRect();
                const header = state.standard
                  ? document.querySelector("header")!.getBoundingClientRect().height
                  : 0;
                const panel = state.mobile
                  ? document.querySelector(".reading-tools")!.getBoundingClientRect().height
                  : 0;
                return rect.top >= header + panel && rect.bottom <= window.innerHeight;
              },
              { standard: mode === "standard", mobile },
            ),
          )
          .toBe(true);
        if (mobile && mode === "fullscreen") {
          const tools = await page.locator(".reading-tools").boundingBox();
          const exit = await page
            .getByRole("button", { name: "Выйти из полноэкранного режима" })
            .boundingBox();
          expect(tools!.height).toBeGreaterThanOrEqual(50);
          expect(exit!.y).toBeGreaterThanOrEqual(0);
          expect(exit!.y + exit!.height).toBeLessThanOrEqual(tools!.y + tools!.height);
        }
      }
      await page.screenshot({
        animations: "disabled",
        path: `/tmp/demo-${info.project.name}-${mode}-${scale}.png`,
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        page.viewportSize()!.width,
      );
    }
  }
  await page.getByRole("button", { name: "Выйти из полноэкранного режима" }).click();
  await expect(page.locator(".reading-layout")).toHaveAttribute("data-reading-mode", "standard");
});

test("PL-07: поворот PDF резервирует полные габариты во всех масштабах", async ({ page }, info) => {
  await page.goto("./?page=file-preview&role=client-employee");
  for (const zoom of [70, 100, 140]) {
    await page.getByRole("button", { name: "Сбросить вид" }).click();
    for (let i = 0; i < Math.abs(zoom - 100) / 10; i++)
      await page
        .getByRole("button", {
          name: zoom < 100 ? "Уменьшить масштаб" : "Увеличить масштаб",
        })
        .click();
    for (let rotation = 0; rotation < 360; rotation += 90) {
      const doc = await page.getByTestId("file-preview-document").boundingBox();
      const bounds = await page.getByTestId("file-preview-bounds").boundingBox();
      expect(doc!.x).toBeCloseTo(bounds!.x, 0);
      expect(doc!.y).toBeCloseTo(bounds!.y, 0);
      expect(doc!.width).toBeCloseTo(bounds!.width, 0);
      expect(doc!.height).toBeCloseTo(bounds!.height, 0);
      if (zoom === 100)
        await page.screenshot({
          animations: "disabled",
          path: `/tmp/demo-${info.project.name}-pdf-${rotation}.png`,
        });
      await page.getByRole("button", { name: "Повернуть страницу" }).click();
    }
  }
});

for (const theme of ["light", "dark"])
  for (const [role, route] of [
    ["client-employee", "search"],
    ["client-admin", "client-users"],
    ["manager", "company"],
    ["support-engineer", "editor"],
    ["portal-admin", "fields"],
    ["portal-admin", "access-settings"],
    ["portal-admin", "structure"],
    ["portal-admin", "tags"],
    ["portal-admin", "files"],
    ["client-employee", "article"],
    ["client-employee", "file-preview"],
  ])
    test(`снимки ${role} ${route} ${theme}`, async ({ page }, info) => {
      const widths = info.project.name.includes("mobile") ? [390, 768] : [1440];
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`./?page=${route}&role=${role}`);
        await page.evaluate((value) => {
          document.documentElement.dataset.theme = value;
        }, theme);
        if (route === "search") {
          await page.getByRole("textbox", { name: "Поиск по базе знаний" }).fill("адрес сервера");
          await page.getByRole("button", { name: "Найти", exact: true }).click();
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        );
        await page.screenshot({
          animations: "disabled",
          path: `/tmp/demo-${width}-${theme}-${route}.png`,
        });
      }
    });

test("PL-09: домены строками, ошибки и заголовки таблиц", async ({ page }, info) => {
  await page.goto("./?page=company&role=portal-admin&resource=severprom");
  await page.getByRole("button", { name: "Редактировать", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Добавить домен", exact: true }).click();
  await dialog.getByLabel("Рабочий домен 3", { exact: true }).fill("docs.demo1609.example");
  await dialog.getByRole("button", { name: "Сохранить компанию" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Редактировать", exact: true }).click();
  await expect(dialog.getByLabel("Рабочий домен 3", { exact: true })).toHaveValue(
    "docs.demo1609.example",
  );
  await dialog.getByLabel("Рабочий домен 3", { exact: true }).fill("SEVERPROM.RU");
  await dialog.getByRole("button", { name: "Сохранить компанию" }).click();
  await expect(dialog.getByRole("alert")).toContainText("ACC_DOMAIN_DUPLICATE");
  await dialog.getByLabel("Рабочий домен 3", { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({
    animations: "disabled",
    path: `/tmp/demo-${info.project.name}-domains.png`,
  });
  await page.goto("./?page=fields&role=portal-admin");
  if (info.project.name.includes("mobile")) return;
  const table = page.locator(".ms-table-scroll");
  await table.evaluate((element) => {
    element.scrollTop = 300;
    element.scrollLeft = 100;
  });
  // Read both boxes in one frame: the page entrance translates their common parent.
  const headOffset = await table.evaluate(
    (node) =>
      node.querySelector("thead")!.getBoundingClientRect().top - node.getBoundingClientRect().top,
  );
  expect(headOffset).toBeCloseTo(1, 0);
  await page.getByRole("button", { name: "Пояснение: Требовать заполнения" }).focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.screenshot({ animations: "disabled", path: "/tmp/demo-table-sticky-tooltip.png" });
});

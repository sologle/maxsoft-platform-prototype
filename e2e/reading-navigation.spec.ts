import { test, expect } from "@playwright/test";
import { fixtureTest } from "./fixtures/vite-fixture";
const url = "./?page=article&role=client-employee&resource=licensing-system";
test("панель ПК сохраняет выбор, мобильное меню его не меняет", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(url);
  const nav = page.getByRole("region", { name: "Инструменты чтения" });
  await expect(nav).toBeVisible();
  await expect(
    nav.getByRole("heading", {
      name: "Статьи раздела «Обзор и серийные номера»",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Свернуть панель чтения" }).click();
  await expect(nav).toBeHidden();
  await expect(
    page.locator(".reading-sidebar").getByRole("button"),
  ).toHaveCount(2);
  await page.reload();
  await expect(nav).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Меню статьи", exact: true }).click();
  await expect(nav).toBeVisible();
  await expect(page.locator("article")).not.toHaveAttribute("inert");
  await page.getByRole("button", { name: "Закрыть меню статьи" }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(nav).toBeHidden();
});
test("начальное содержание и файлы, реальные крошки и один титульник", async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.locator("article h1")).toHaveCount(1);
  const summary = page.getByText("Содержание и вложения", { exact: true });
  await expect(summary).toBeVisible();
  if ((await page.locator(".reading-intro").getAttribute("open")) === null)
    await summary.click();
  await expect(
    page.getByRole("button", {
      name: "Открыть файл: лицензирование-продуктов.pdf",
    }),
  ).toHaveCount(1);
  await expect(page.locator(".reading-intro")).toContainText("Виды лицензий");
  const crumbs = page.getByRole("navigation", { name: "Хлебные крошки" });
  const expanded = crumbs.getByText("Путь к разделу", { exact: true });
  if (await expanded.isVisible()) await expanded.click();
  await crumbs
    .getByRole("button", { name: "Обзор и серийные номера", exact: true })
    .click();
  await expect(page).toHaveURL(/resource=licensing-overview/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Обзор и серийные номера",
  );
});

test("ветви, выбранный раздел и переход между статьями сохраняют смысл и предпочтения", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(url);
  const tools = page.getByRole("region", { name: "Инструменты чтения" });
  await tools
    .getByRole("button", { name: "Свернуть раздел Лицензирование nanoCAD" })
    .click();
  await tools
    .getByRole("button", { name: "Серийный номер и его состав", exact: true })
    .click();
  await expect(page.locator("article h1")).toHaveText(
    "Серийный номер и его состав",
  );
  await expect(page.locator("article h1")).toBeInViewport();
  await expect(
    tools.getByRole("button", {
      name: "Развернуть раздел Лицензирование nanoCAD",
    }),
  ).toHaveAttribute("aria-expanded", "false");
  await page.reload();
  await expect(
    tools.getByRole("button", {
      name: "Развернуть раздел Лицензирование nanoCAD",
    }),
  ).toHaveAttribute("aria-expanded", "false");
  await tools
    .getByRole("button", { name: "Вся база знаний", exact: true })
    .click();
  await expect(
    tools.getByRole("heading", { name: "Статьи всей базы знаний" }),
  ).toBeVisible();
  await expect(
    tools.getByRole("button", {
      name: "Шаблон проекта Model Studio CS",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Свернуть панель чтения" }).click();
  await page.goto(url);
  await expect(tools).toBeHidden();
});

test("длинная глубокая ветвь не выталкивает счётчик; старые данные не сбрасываются", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto(url);
  await page.evaluate(() => {
    const names = Array.from(
      { length: 7 },
      (_, n) => `Очень-длинный-раздел-${n}-для-проверки-иерархии`,
    );
    let nodes: unknown[] = [];
    for (let n = names.length - 1; n >= 0; n--)
      nodes = [{ id: `deep-${n}`, name: names[n], children: nodes }];
    localStorage.setItem(
      "maxsoft-prototype-knowledge-tree",
      JSON.stringify(nodes),
    );
    localStorage.setItem(
      "maxsoft-prototype-article-sections",
      JSON.stringify({ "licensing-system": [names.join(" / ")] }),
    );
    sessionStorage.setItem(
      "maxsoft-prototype-reading-tree",
      JSON.stringify([...names.map((_, n) => `deep-${n}`), "removed"]),
    );
  });
  await page.reload();
  const rows = page.locator(".knowledge-tree-row");
  await expect(rows).toHaveCount(7);
  for (const row of await rows.all()) {
    expect(await row.evaluate((n) => n.scrollWidth <= n.clientWidth + 1)).toBe(
      true,
    );
    const count = await row.locator(".knowledge-tree-count").boundingBox();
    const rect = await row.boundingBox();
    expect(count!.x + count!.width).toBeLessThanOrEqual(
      rect!.x + rect!.width + 1,
    );
  }
  await expect(
    page.getByRole("region", { name: "Материалы раздела" }),
  ).toContainText("Технические данные");
  await page.reload();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("maxsoft-prototype-knowledge-tree")!)[0]
          .id,
    ),
  ).toBe("deep-0");
});

fixtureTest("пустые вложения не создают файл или мёртвый пункт оглавления", async ({
  page,
  fixtureUrl,
}) => {
  await page.route("**/src/data/platform-data.ts*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: `${await response.text()}\nfiles.splice(0, files.length);`,
    });
  });
  await page.goto(new URL(url, fixtureUrl).href);
  await expect(page.locator(".reading-intro")).toContainText("Файлов: 0");
  await expect(page.locator("#attachments-title")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Развернуть содержание статьи" })
    .click();
  await expect(
    page.locator(".reading-toc-panel").getByRole("link", { name: /Вложения/ }),
  ).toHaveCount(0);
});

test("короткий touch viewport: немодальные инструменты, Escape и оглавление над клавиатурой", async ({
  page,
}) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto(url);
  const trigger = page.getByRole("button", {
    name: "Меню статьи",
    exact: true,
  });
  await trigger.click();
  const tools = page.getByRole("region", { name: "Инструменты чтения" });
  await expect(tools).toBeVisible();
  await tools
    .getByRole("button", { name: "На весь экран", exact: true })
    .click();
  await tools
    .getByRole("button", { name: "Закрыть меню статьи" })
    .press("Escape");
  await expect(tools).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator(".reading-layout")).toHaveAttribute(
    "data-reading-mode",
    "fullscreen",
  );
  const tocTrigger = page.getByRole("button", {
    name: "Развернуть содержание статьи",
  });
  await tocTrigger.click();
  const toc = page.getByRole("navigation", {
    name: "Содержание статьи",
    exact: true,
  });
  await expect(toc).toBeVisible();
  await expect(tools).toBeHidden();
  await page.evaluate(() => {
    Object.defineProperty(visualViewport!, "height", {
      configurable: true,
      value: 220,
    });
    visualViewport!.dispatchEvent(new Event("resize"));
  });
  const rect = await toc.boundingBox();
  expect(rect!.y).toBeGreaterThanOrEqual(0);
  expect(rect!.y + rect!.height).toBeLessThanOrEqual(221);
  await toc.getByRole("button", { name: "Закрыть содержание" }).press("Escape");
  await expect(toc).toBeHidden();
  await expect(tocTrigger).toBeFocused();
  await tocTrigger.press("Escape");
  await expect(page.locator(".reading-layout")).toHaveAttribute(
    "data-reading-mode",
    "standard",
  );
  expect(
    await page.evaluate(() => getComputedStyle(document.body).overflow),
  ).not.toBe("hidden");
});

import { test, expect, type Page } from "@playwright/test";
import { articles, companies, companyFields } from "../src/data/platform-data";
const support = (page: Page) =>
  page.getByRole("region", { name: "Поддержка и доступ" });
const summary = (page: Page) =>
  page.getByRole("button", { name: /Материалов в базе знаний/ });
const noOverflow = async (page: Page) => {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  expect(
    await page
      .locator(
        ".home-collection, .home-support, .home-product, .home-knowledge-summary",
      )
      .evaluateAll((nodes) =>
        nodes
          .filter((n) => n.scrollWidth > n.clientWidth + 1)
          .map((n) => n.className),
      ),
  ).toEqual([]);
};
for (const width of [320, 390, 768, 1024, 1440])
  for (const theme of ["light", "dark"]) {
    test(`главная ${width}px ${theme}: блоки, раскрытия и переходы`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("./?page=home&role=client-employee");
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      await expect(summary(page)).toBeVisible();
      await expect(support(page)).toContainText("15.03.2027");
      for (const name of [
        "Разделы по продуктам",
        "Новое и обновлённое",
        "Популярное",
        "Сохранённое",
        "Недавно прочитанное",
      ])
        await expect(page.getByRole("region", { name })).toBeVisible();
      const latest = page.getByRole("region", { name: "Новое и обновлённое" });
      await expect(latest.locator(".home-article")).toHaveCount(3);
      const more = latest.getByRole("button", { name: "Ещё 2" });
      await more.click();
      await expect(latest.locator(".home-article")).toHaveCount(5);
      await latest.getByRole("button", { name: "Свернуть" }).click();
      await expect(more).toHaveAttribute("aria-expanded", "false");
      await more.click();
      await expect(latest.locator(".home-article").last()).toBeVisible();
      await noOverflow(page);
      if (width >= 1024) {
        const first = await latest.boundingBox();
        const second = await page
          .getByRole("region", { name: "Популярное" })
          .boundingBox();
        expect(Math.abs(first!.y - second!.y)).toBeLessThan(1);
        expect(second!.x).toBeGreaterThan(first!.x + first!.width);
      }
      await latest.locator(".home-article").last().click();
      await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(
        "Рабочее пространство",
      );
    });
  }
for (const role of [
  "client-admin",
  "client-employee",
  "manager",
  "support-engineer",
  "portal-admin",
]) {
  test(`счётчик равен выдаче БЗ: ${role}`, async ({ page }) => {
    await page.goto(`./?page=home&role=${role}`);
    const count = Number(
      await summary(page).locator(".home-total").textContent(),
    );
    await summary(page).click();
    await expect(
      page.getByText(`Найдено материалов: ${count}`, { exact: true }),
    ).toBeVisible();
    await expect(page.locator("[data-material-id]")).toHaveCount(count);
    expect(count).toBeGreaterThan(0);
    await expect(
      page.locator('[data-material-id="practice-review"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('[data-material-id="practice-handover"]'),
    ).toHaveCount(role.startsWith("client") ? 0 : 1);
  });
}
for (const role of ["client-admin", "client-employee"]) {
  test(`своя компания, скрытые поля, прошлый срок: ${role}`, async ({
    page,
  }) => {
    await page.addInitScript(
      ({ role, companies }) => {
        sessionStorage.setItem(
          "maxsoft-prototype-active-company",
          JSON.stringify({ [role]: "vector" }),
        );
        localStorage.setItem(
          "maxsoft-prototype-companies",
          JSON.stringify(companies),
        );
      },
      { role, companies },
    );
    await page.goto(`./?page=home&role=${role}`);
    await expect(support(page)).toContainText("Приостановлен");
    await expect(support(page)).toContainText("31.08.2026");
    await expect(support(page)).not.toContainText(
      /Вид поддержки|Базовый|31.12.2026|лиценз|Скоро/,
    );
    await page.evaluate(
      (fields) =>
        localStorage.setItem(
          "maxsoft-prototype-company-fields",
          JSON.stringify(
            fields.map((f) =>
              ["status", "statusUntil"].includes(f.id)
                ? { ...f, visible: false }
                : f,
            ),
          ),
        ),
      companyFields,
    );
    await page.reload();
    await expect(support(page)).not.toContainText(
      /Приостановлен|31.08.2026|Статус доступа|Срок статуса/,
    );
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("maxsoft-prototype-companies")!),
      ),
    ).toEqual(companies);
  });
}
test("счётчик: ноль, один результат, пустые списки и сохранённые настройки", async ({
  page,
}) => {
  await page.goto("./?page=home&role=client-admin");
  await page.evaluate(
    ({ articles, companies }) => {
      localStorage.setItem(
        "maxsoft-prototype-article-publication",
        JSON.stringify(Object.fromEntries(articles.map((a) => [a.id, false]))),
      );
      localStorage.setItem(
        "maxsoft-prototype-companies",
        JSON.stringify(companies.map((c) => ({ ...c, statusUntil: "" }))),
      );
      localStorage.setItem("maxsoft-prototype-reading-panel-open", "false");
      sessionStorage.setItem("maxsoft-prototype-reading-tree", "[]");
    },
    { articles, companies },
  );
  await page.reload();
  await expect(summary(page).locator(".home-total")).toHaveText("0");
  await expect(support(page)).toContainText("Не указан");
  await expect(
    page.getByRole("region", { name: "Разделы по продуктам" }),
  ).toContainText("Пока нет доступных разделов.");
  await summary(page).click();
  await expect(
    page.getByText("Найдено материалов: 0", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    const publications = JSON.parse(
      localStorage.getItem("maxsoft-prototype-article-publication")!,
    );
    publications["practice-review"] = true;
    localStorage.setItem(
      "maxsoft-prototype-article-publication",
      JSON.stringify(publications),
    );
  });
  await page.goto("./?page=home&role=client-admin");
  await expect(summary(page).locator(".home-total")).toHaveText("1");
  await summary(page).click();
  await expect(page.locator("[data-material-id]")).toHaveCount(1);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("maxsoft-prototype-reading-panel-open"),
    ),
  ).toBe("false");
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("maxsoft-prototype-reading-tree"),
    ),
  ).toBe("[]");
});
test("длинные личные списки сохраняются по профилю; фокус и reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("./?page=home&role=client-employee");
  const saved = [
    "practice-review",
    "practice-pilot",
    "licensing-system",
    "licensing-kinds",
    "network-license",
  ];
  // All entries are confirmed catalogue IDs; the ordering is user data.
  expect(saved.every((id) => articles.some((a) => a.id === id))).toBe(true);
  await page.evaluate(
    (saved) =>
      localStorage.setItem(
        "maxsoft-prototype-personal-articles-v1",
        JSON.stringify({
          '["client-employee","integrator-pro"]': { saved, recent: saved },
        }),
      ),
    saved,
  );
  await page.reload();
  const region = page.getByRole("region", { name: "Сохранённое" });
  const more = region.getByRole("button", { name: "Ещё 2" });
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(region.locator(".home-article")).toHaveCount(5);
  await expect(region.getByRole("button", { name: "Свернуть" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(more).toBeFocused();
  await expect(region.locator(".motion-surface:not([inert])")).toHaveCount(0);
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() =>
      Boolean(document.activeElement?.closest("[inert]")),
    ),
  ).toBe(false);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await more.click();
  await region.getByRole("button", { name: "Свернуть" }).click();
  await expect(region.locator(".motion-surface")).toHaveCount(0);
  await noOverflow(page);
  await page.goto("./?page=home&role=client-admin");
  await expect(page.getByRole("region", { name: "Сохранённое" })).toContainText(
    "Нажмите «Сохранить»",
  );
  await page.goto("./?page=home&role=client-employee");
  await expect(
    page
      .getByRole("region", { name: "Сохранённое" })
      .locator(".home-article")
      .first(),
  ).toContainText("Проверка");
});
test("короткий экран, reflow и длинные названия продуктов", async ({
  page,
}) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto("./?page=home&role=client-admin");
  await page.evaluate(() => {
    const tree = JSON.parse(
      localStorage.getItem("maxsoft-prototype-knowledge-tree")!,
    );
    const root = tree.find((n: { id: string }) => n.id === "practice");
    const previous = root.name;
    root.name = "ОченьДлинноеИмяРаздела".repeat(12);
    const placements = JSON.parse(
      localStorage.getItem("maxsoft-prototype-article-sections")!,
    );
    for (const [id, paths] of Object.entries(placements) as [
      string,
      string[],
    ][])
      placements[id] = paths.map((path) =>
        path.startsWith(previous + " /")
          ? root.name + path.slice(previous.length)
          : path,
      );
    localStorage.setItem(
      "maxsoft-prototype-article-sections",
      JSON.stringify(placements),
    );
    localStorage.setItem(
      "maxsoft-prototype-knowledge-tree",
      JSON.stringify(tree),
    );
  });
  await page.reload();
  const products = page.getByRole("region", { name: "Разделы по продуктам" });
  await products.getByRole("button", { name: /^Ещё/ }).click();
  await expect(
    products.getByRole("button", { name: /^ОченьДлинноеИмяРаздела/ }),
  ).toBeVisible();
  await noOverflow(page);
  // 640 CSS px at 200% browser zoom correspond to a 320 CSS px layout viewport.
  await page.setViewportSize({ width: 320, height: 500 });
  await noOverflow(page);
  await summary(page).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Все материалы",
  );
});

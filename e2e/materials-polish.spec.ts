import { test, expect, type Page } from "@playwright/test";
import { openReadingTools } from "./reading-helpers";
const pilotSection =
  "Подготовка пилотного проекта и согласование результатов с участниками";
const library = "./?page=knowledge&role=client-employee";
const noOverflow = async (page: Page) => {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  const overflow = await page
    .locator(".material-result, .material-main, .knowledge-tree-item")
    .evaluateAll((nodes) =>
      nodes
        .filter((node) => node.scrollWidth > node.clientWidth + 1)
        .map((node) => node.className),
    );
  expect(overflow).toEqual([]);
};
for (const width of [320, 390, 768, 1024, 1440])
  for (const theme of ["light", "dark"]) {
    test(`материалы и дерево ${width}px ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(library);
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      await expect(page.getByTestId("knowledge-table-view")).toBeVisible();
      const row = page.locator('[data-material-id="practice-review"]');
      await expect(row).toBeVisible();
      await row.getByText("Подробности материала", { exact: true }).click();
      await expect(row.locator(".material-section-links")).toContainText(
        pilotSection,
      );
      await row.getByRole("button", { name: "Ещё 2" }).click();
      await expect(row.locator(".material-compact-tags")).toContainText(
        "Проектировщик",
      );
      await noOverflow(page);
      if (width >= 768) {
        const header = page.locator(".material-columns");
        for (const [index, selector] of [
          [1, ".material-main"],
          [2, ".material-section"],
          [3, ".material-date"],
        ] as const) {
          expect(
            Math.abs(
              (await header.locator(":scope > span").nth(index).boundingBox())!
                .x - (await row.locator(selector).boundingBox())!.x,
            ),
          ).toBeLessThanOrEqual(1);
        }
      }
      await page.getByRole("button", { name: "Крупные карточки" }).click();
      const topics = row.getByRole("button", { name: "Темы · 2" });
      await topics.click();
      await row.getByRole("button", { name: "Аудитория · 2" }).click();
      await expect(topics).toHaveAttribute("aria-expanded", "true");
      await noOverflow(page);
      await row.getByRole("button", { name: /^Открыть материал:/ }).click();
      const tools = await openReadingTools(page);
      await expect(
        tools.locator('.knowledge-tree-article[aria-current="page"]').first(),
      ).toBeVisible();
      await expect(tools.locator('.knowledge-tree-article[aria-current="page"]').first()).toContainText(
        "Проверка материала перед передачей коллегам",
      );
      await expect(
        tools
          .locator(".knowledge-tree-item")
          .filter({ hasText: "Практика работы" })
          .locator(".knowledge-tree-count"),
      ).toHaveText("4");
      await expect(
        tools.getByRole("button", {
          name: "Свернуть раздел Начало работы",
          exact: true,
        }),
      ).toHaveAttribute("aria-expanded", "true");
      await expect(
        tools.getByRole("button", {
          name: "Свернуть раздел Команда проекта",
          exact: true,
        }),
      ).toHaveAttribute("aria-expanded", "true");
      const section = tools.getByRole("button", {
        name: pilotSection,
        exact: true,
      });
      await expect(section.locator(".knowledge-tree-count")).toHaveText("3");
      const geometry = await section.evaluate((node) => {
        const r = node.getBoundingClientRect();
        return [...node.children].every((child) => {
          const box = child.getBoundingClientRect();
          return box.left >= r.left && box.right <= r.right + 1;
        });
      });
      expect(geometry).toBe(true);
      await section.click();
      await expect(
        tools.getByRole("button", { name: `Развернуть раздел ${pilotSection}` }),
      ).toHaveAttribute("aria-expanded", "false");
      await section.click();
      const articleLeaves = section.locator("xpath=../following-sibling::*").locator(".knowledge-tree-article");
      await expect(articleLeaves).toHaveCount(3);
      await expect(articleLeaves).toContainText([
        "План пилотного проекта",
        "Договорённости команды перед началом работы",
        "Проверка материала перед передачей коллегам: содержание, источники и доступность",
      ]);
      await noOverflow(page);
    });
  }
test("группы: старый справочник, 0/1/много, длинные значения, клавиатура и touch", async ({
  page,
}, info) => {
  await page.goto(library);
  await page.evaluate(() => {
    localStorage.setItem(
      "maxsoft-prototype-tags",
      JSON.stringify([
        {
          id: "long",
          name: "Очень длинное имя группы для проверки переноса без потери смысла",
          tags: [
            { name: "ДлиннаяМеткаБезПробелов".repeat(8) },
            { name: "Короткая" },
          ],
        },
      ]),
    );
    localStorage.setItem(
      "maxsoft-prototype-article-tags",
      JSON.stringify({
        "practice-pilot": [
          "ДлиннаяМеткаБезПробелов".repeat(8),
          "Короткая",
          "Короткая",
          "Тег прежнего профиля",
        ],
        "practice-review": [],
        "practice-roles": ["Короткая"],
      }),
    );
  });
  await page.reload();
  await page.getByRole("button", { name: "Крупные карточки" }).click();
  const row = page.locator('[data-material-id="practice-pilot"]');
  const group = row.getByRole("button", {
    name: /Очень длинное имя группы.* · 2/,
  });
  await group.focus();
  await group.press("Enter");
  const unknown = row.getByRole("button", { name: "Без группы · 1" });
  if (info.project.name.includes("mobile")) await unknown.tap();
  else await unknown.click();
  await expect(
    row.getByText("Тег прежнего профиля", { exact: true }),
  ).toBeVisible();
  await expect(row.getByText("Короткая", { exact: true })).toHaveCount(1);
  await group.press("Space");
  await expect(group).toHaveAttribute("aria-expanded", "false");
  await expect(unknown).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.locator('[data-material-id="practice-review"] .material-tag-group'),
  ).toHaveCount(0);
  await expect(
    page.locator(
      '[data-material-id="practice-roles"] .material-tag-group button',
    ),
  ).toHaveText(/ · 1/);
  await group.click();
  await noOverflow(page);
  expect(await page.locator("button button, button summary").count()).toBe(0);
  await expect(page).toHaveURL(/page=knowledge/);
});
test("поиск сохраняет фрагменты, файлы, связи, даты и независимые раскрытия", async ({
  page,
}) => {
  await page.goto(
    "./?page=search&role=client-employee&resource=бессрочное право",
  );
  const file = page.locator(
    '[data-material-id="лицензирование-продуктов.pdf"]',
  );
  await expect(file.locator(".material-snippet mark").first()).toBeVisible();
  await expect(file.locator(".material-date time")).toHaveAttribute(
    "datetime",
    "2026-09-15T13:00:00+03:00",
  );
  await file.getByText("Связанные статьи · 3").click();
  await expect(file.locator(".material-related button")).toHaveCount(3);
  await expect(page).toHaveURL(/page=search/);
  await file
    .locator(".material-related button")
    .filter({ hasText: "Виды лицензий:" })
    .click();
  await expect(page).toHaveURL(/resource=licensing-kinds/);
  await page.goto(
    "./?page=search&role=client-employee&resource=наблюдение от предположения",
  );
  await expect(
    page.locator('[data-material-id="practice-pilot"] .material-snippet'),
  ).toContainText("наблюдение от предположения");
});
test("пополнение старого профиля сохраняет ветви, права, крошки и размещения", async ({
  page,
}) => {
  await page.goto(library);
  await page.evaluate(() => {
    localStorage.setItem("maxsoft-prototype-content-version", "1");
    localStorage.setItem(
      "maxsoft-prototype-knowledge-tree",
      JSON.stringify([{ id: "custom", name: "Свой раздел" }]),
    );
    localStorage.setItem(
      "maxsoft-prototype-article-sections",
      JSON.stringify({ "network-license": ["Свой раздел"] }),
    );
    localStorage.setItem(
      "maxsoft-prototype-article-publication",
      JSON.stringify({ "network-license": false }),
    );
    localStorage.setItem(
      "maxsoft-prototype-article-access",
      JSON.stringify({ "practice-roles": [] }),
    );
    sessionStorage.setItem("maxsoft-prototype-reading-tree", "[]");
  });
  await page.goto(
    "./?page=article&role=client-employee&resource=practice-pilot",
  );
  let tools = await openReadingTools(page);
  await expect(
    tools.getByRole("button", { name: "Развернуть раздел Практика работы" }),
  ).toHaveAttribute("aria-expanded", "false");
  for (const name of ["Практика работы", "Начало работы", "Команда проекта", pilotSection])
    await tools.getByRole("button", { name: `Развернуть раздел ${name}` }).click();
  await expect(tools.locator('.knowledge-tree-article[aria-current="page"]')).toContainText("План пилотного проекта");
  await expect(
    tools.getByRole("button", {
      name: "Договорённости команды перед началом работы",
      exact: true,
    }),
  ).toHaveCount(0);
  await tools.getByRole("button", { name: "Свернуть раздел Практика работы" }).click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(
          localStorage.getItem("maxsoft-prototype-knowledge-tree")!,
        )[0],
    ),
  ).toEqual({ id: "custom", name: "Свой раздел" });
  await page.reload();
  tools = await openReadingTools(page);
  await expect(
    tools.getByRole("button", { name: "Развернуть раздел Практика работы" }),
  ).toHaveAttribute("aria-expanded", "false");
  if (
    await page.getByRole("button", { name: "Закрыть меню статьи" }).isVisible()
  )
    await page.getByRole("button", { name: "Закрыть меню статьи" }).click();
  const crumbs = page.getByRole("navigation", { name: "Хлебные крошки" });
  const reveal = crumbs.getByText("Путь к разделу", { exact: true });
  if (await reveal.isVisible()) await reveal.click();
  await crumbs
    .getByRole("button", { name: "Команда проекта", exact: true })
    .click();
  await expect(page).toHaveURL(/resource=practice-team/);
  await expect(page.locator('[data-material-id="practice-pilot"]')).toHaveCount(
    1,
  );
  await expect(
    page.locator('[data-material-id="practice-review"]'),
  ).toHaveCount(1);
  await expect(page.locator('[data-material-id="practice-roles"]')).toHaveCount(
    0,
  );
});
test("быстрое повторное раскрытие, reduced motion и короткий экран", async ({
  page,
}) => {
  await page.setViewportSize({ width: 740, height: 360 });
  await page.goto(library);
  await page.getByRole("button", { name: "Крупные карточки" }).click();
  const row = page.locator('[data-material-id="practice-pilot"]');
  const topics = row.getByRole("button", { name: "Темы · 2" });
  await topics.evaluate((button) => {
    (button as HTMLButtonElement).click();
  });
  await expect(topics).toHaveAttribute("aria-expanded", "true");
  await topics.evaluate((button) => {
    (button as HTMLButtonElement).click();
  });
  const regionId = await topics.getAttribute("aria-controls");
  expect(
    await page.evaluate((id) => {
      const node = document.getElementById(id!);
      return !node || node.hasAttribute("inert");
    }, regionId),
  ).toBe(true);
  await topics.click();
  await expect(row.getByText("Стандарты", { exact: true })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await topics.click();
  expect(
    await page.evaluate((id) => document.getElementById(id!), regionId),
  ).toBeNull();
  await topics.click();
  await noOverflow(page);
});
test("все новые статьи открываются со своим текстом, а закрытые недоступны клиенту", async ({
  page,
}) => {
  for (const id of [
    "pilot",
    "roles",
    "review",
    "model",
    "escalation",
    "handover",
  ]) {
    await page.goto(
      `./?page=article&role=portal-admin&resource=practice-${id}`,
    );
    await expect(page.locator(".article-content section")).toHaveCount(3);
    await expect(page.locator(".article-content")).toContainText(
      "Демонстрационный",
    );
    await expect(
      page.getByRole("button", { name: "Читать полный источник" }),
    ).toHaveCount(0);
    await expect(page.locator("article h1")).toBeVisible();
  }
  for (const id of ["escalation", "handover"]) {
    await page.goto(
      `./?page=article&role=client-employee&resource=practice-${id}`,
    );
    await expect(
      page.getByRole("heading", { name: "Нет доступа к разделу" }),
    ).toBeVisible();
  }
});
test("первый прямой поиск учитывает оба размещения до открытия дерева", async ({
  page,
}) => {
  await page.goto(
    "./?page=search&role=client-employee&resource=Проверка материала",
  );
  const row = page.locator('[data-material-id="practice-review"]');
  await row.getByText("Подробности материала", { exact: true }).click();
  await expect(row.locator(".material-section-links")).toContainText(
    pilotSection,
  );
  await expect(row.locator(".material-section-links")).toContainText(
    "Подготовка и проверка материалов",
  );
});

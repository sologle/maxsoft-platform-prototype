import { test, expect } from "@playwright/test";
const title = "Технические данные о системе лицензирования продуктов";
test("статья: полный текст, вкладки, сохранение и PDF", async ({ page }) => {
  await page.goto(
    "./?page=article&role=client-employee&resource=licensing-system",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(page.locator(".article-content img")).toHaveCount(14);
  await expect(page.locator(".article-content table")).toHaveCount(2);
  await page.getByRole("tab", { name: "По сроку действия" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("бессрочное право");
  await page.getByRole("tab", { name: "По сроку действия" }).press("ArrowLeft");
  await expect(page.getByRole("tabpanel")).toContainText(
    "Персональная лицензия",
  );
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Сохранено", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("./?page=home&role=client-employee");
  await expect(page.getByRole("region", { name: "Сохранённое" })).toContainText(
    title,
  );
  await expect(
    page.getByRole("region", { name: "Недавно прочитанное" }),
  ).toContainText(title);
  await page.goto("./?page=home&role=client-admin");
  await expect(
    page.getByRole("region", { name: "Сохранённое" }),
  ).not.toContainText(title);
});
test("поиск по скрытой панели и отдельный результат PDF", async ({ page }) => {
  await page.goto(
    "./?page=search&role=client-employee&resource=бессрочное право",
  );
  await expect(
    page.getByRole("button", { name: `Открыть материал: ${title}` }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Просмотреть файл: лицензирование-продуктов.pdf",
    })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "лицензирование-продуктов.pdf",
  );
  await expect(
    page.getByRole("region", { name: "Связанные статьи" }).getByRole("button"),
  ).toHaveCount(3);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Скачать PDF", exact: true }).click();
  expect((await download).suggestedFilename()).toBe(
    "лицензирование-продуктов.pdf",
  );
});
test("виды, теги и сортировки в библиотеке и поиске", async ({ page }) => {
  await page.goto("./?page=knowledge&role=client-employee");
  const row = page.locator('[data-material-id="licensing-system"]');
  await row.getByRole("button", { name: "Ещё тегов: 2" }).click();
  await expect(row).toContainText("Стандарты");
  await row.getByRole("button", { name: "Свернуть теги" }).press("Enter");
  await page
    .getByRole("button", {
      name: "Открыть варианты. Выбрано: Все",
      exact: true,
    })
    .click();
  await page.getByRole("option", { name: "Видео", exact: true }).click();
  await expect(page.locator("[data-material-id]")).toHaveCount(1);
  await expect(page.locator("[data-material-id]")).toHaveAttribute(
    "data-material-id",
    "cad-integration",
  );
  await page
    .getByRole("button", {
      name: "Открыть варианты. Выбрано: Видео",
      exact: true,
    })
    .click();
  await page.getByRole("option", { name: "Файлы", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Просмотреть файл: лицензирование-продуктов.pdf",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: `Открыть материал: ${title}` }),
  ).toHaveCount(0);
  await page.goto("./?page=search&role=client-employee&resource=лицензи");
  await page
    .getByRole("button", {
      name: "Открыть варианты. Выбрано: По дате обновления · новые первыми",
    })
    .click();
  await page.getByRole("option", { name: "По названию", exact: true }).click();
  const labels = await page
    .locator("[data-material-id] > div > div > button")
    .allTextContents();
  expect(labels.length).toBeGreaterThan(3);
});
test("старый профиль сохраняет настройки, а главная открывает выбранный раздел", async ({
  page,
}) => {
  await page.goto("./?page=home&role=client-employee");
  await page.evaluate(() => {
    localStorage.setItem(
      "maxsoft-prototype-knowledge-tree",
      JSON.stringify([{ id: "custom", name: "Мои материалы" }]),
    );
    localStorage.removeItem("maxsoft-prototype-content-version");
    localStorage.setItem(
      "maxsoft-prototype-article-publication",
      JSON.stringify({ "network-license": false }),
    );
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Лицензирование nanoCAD Материалов: 9" })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Лицензирование nanoCAD",
  );
  await expect(
    page.getByRole("button", { name: `Открыть материал: ${title}` }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Открыть материал: Настройка сетевой лицензии",
    }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("maxsoft-prototype-knowledge-tree")!)[0]
          .name,
    ),
  ).toBe("Мои материалы");
});
test("файл с одной и нулём доступных связей не раскрывает остальные статьи", async ({
  page,
}) => {
  await page.goto("./?page=home&role=client-employee");
  await page.evaluate(() =>
    localStorage.setItem(
      "maxsoft-prototype-article-publication",
      JSON.stringify({ "licensing-system": false, "licensing-kinds": false }),
    ),
  );
  await page.goto(
    "./?page=file-preview&role=client-employee&resource=лицензирование-продуктов.pdf",
  );
  await expect(
    page.getByRole("region", { name: "Связанные статьи" }).getByRole("button"),
  ).toHaveCount(1);
  await expect(
    page.getByRole("region", { name: "Связанные статьи" }),
  ).not.toContainText(title);
  await page
    .getByRole("region", { name: "Связанные статьи" })
    .getByRole("button")
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Файл лицензии: расположение в nanoLM и FlexLM",
  );
  await page.evaluate(() =>
    localStorage.setItem(
      "maxsoft-prototype-article-publication",
      JSON.stringify({
        "licensing-system": false,
        "licensing-kinds": false,
        "licensing-files": false,
      }),
    ),
  );
  await page.goto(
    "./?page=file-preview&role=client-employee&resource=лицензирование-продуктов.pdf",
  );
  await expect(
    page.getByRole("heading", { name: "Нет доступа к разделу" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Связанные статьи" }),
  ).toHaveCount(0);
});
test("семь длинных вложений: компактные строки и отдельное скачивание", async ({
  page,
}) => {
  const extraFiles = Array.from({ length: 6 }, (_, n) => ({
    name: `${n}-очень-длинное-название-вложения-для-проверки-переноса-строки-и-доступности-действия.dwg`,
    type: "DWG",
    size: "1 МБ",
    relatedArticleIds: ["licensing-system"],
    updated: "15.09.2026",
    updatedAt: "2026-09-15T13:00:00+03:00",
  }));
  await page.route("**/src/data/platform-data.ts*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: `${await response.text()}\nfiles.push(...${JSON.stringify(extraFiles)});`,
    });
  });
  await page.goto("./?page=home&role=client-employee");
  await page
    .getByRole("region", { name: "Новое и обновлённое" })
    .getByRole("button", { name: /Технические данные/ })
    .click();
  await page.getByRole("button", { name: "Вложения · 7" }).click();
  const attachments = page.locator(
    'section[aria-labelledby="attachments-title"]',
  );
  await expect(
    attachments.getByRole("button", { name: /^Скачать / }),
  ).toHaveCount(7);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  const download = page.waitForEvent("download");
  await attachments.getByRole("button", { name: /^Скачать 0-/ }).click();
  expect((await download).suggestedFilename()).toMatch(/\.dwg\.demo\.txt$/);
});

test("переход в соседнюю статью из полноэкранного дерева освобождает прокрутку", async ({
  page,
}) => {
  await page.goto(
    "./?page=article&role=client-employee&resource=licensing-system",
  );
  await page.evaluate(() => window.scrollTo(0, 3500));
  await page
    .getByRole("button", { name: "На весь экран", exact: true })
    .click();
  await page.getByRole("button", { name: "Дерево БЗ", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", {
      name: "Файл лицензии: расположение в nanoLM и FlexLM",
      exact: true,
    })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Файл лицензии: расположение в nanoLM и FlexLM",
  );
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
  expect(
    await page.evaluate(() => getComputedStyle(document.body).overflow),
  ).not.toBe("hidden");
  expect(
    await page
      .locator("header")
      .first()
      .evaluate((n) => n.hasAttribute("inert")),
  ).toBe(false);
});

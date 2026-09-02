import { expect, test, type Page } from "@playwright/test";
import { screens, type ScreenFormat } from "../src/generated/screens";

const design = (page: Page) => page.frameLocator("iframe");

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Выберите сценарий" })).toBeVisible();
  (page as Page & { prototypeErrors?: string[] }).prototypeErrors = errors;
});

test.afterEach(async ({ page }) => {
  expect((page as Page & { prototypeErrors?: string[] }).prototypeErrors ?? []).toEqual([]);
});

test("запускает все шесть ролевых точек входа", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const mobile = testInfo.project.name.startsWith("mobile");
  const entries = [
    { label: "Гость", desktop: "xlvEx", mobile: "kiGN4" },
    { label: "Администратор портала", desktop: "pmHIA", mobile: "NllPS" },
    { label: "Инженер ТП / автор", desktop: "w9mzj", mobile: "QK2cj" },
    { label: "Менеджер", desktop: "oge4c", mobile: "bLysq" },
    { label: "Администратор клиента", desktop: "uuYrz", mobile: "RcJJN" },
    { label: "Сотрудник клиента", desktop: "uLhhN", mobile: "KvdWU" },
  ];

  for (const entry of entries) {
    await page.goto("./");
    const card = page.getByTestId("role-entry").filter({ hasText: entry.label });
    await card.getByRole("button", { name: mobile ? "Мобильный" : "Desktop" }).click();
    const expected = screens.find((screen) => screen.id === (mobile ? entry.mobile : entry.desktop));
    if (!expected) throw new Error(`E2E_ROLE_SCREEN_MISSING: ${entry.label}`);
    await expect(page.locator("iframe")).toHaveAttribute("title", expected.name);
  }
});

test("не показывает посетителю внутренние этапы разработки", async ({ page }, testInfo) => {
  const mobile = testInfo.project.name.startsWith("mobile");
  const format = mobile ? "mobile" : "desktop";
  const homeId = mobile ? "NllPS" : "pmHIA";
  await page.goto(`./?screen=${homeId}&role=portal-admin&format=${format}`);
  const forbiddenDeliveryCopy = new RegExp(`(?:sta${"ge"}|эта${"п"})\\s*(?:1|2)`, "i");
  await expect(design(page).locator(`[data-pencil-id="${homeId}"]`)).not.toContainText(
    forbiddenDeliveryCopy,
  );
  if (mobile) {
    await page.goto("./?screen=a7N2d&role=portal-admin&format=mobile");
    await expect(design(page).locator('[data-pencil-id="a7N2d"]')).not.toContainText(forbiddenDeliveryCopy);
  }

  const companyId = mobile ? "i3L0M" : "pgMj9";
  await page.goto(`./?screen=${companyId}&role=portal-admin&format=${format}`);
  const futureItems = design(page).locator(
    `[data-pencil-id="${companyId}"] [data-pencil-name^="DISABLED · Эта${"п"} 2"]`,
  );
  for (let index = 0; index < (await futureItems.count()); index += 1) {
    await expect(futureItems.nth(index)).toBeHidden();
  }
});

test("гость проходит с главной ко входу", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"));
  const card = page.getByTestId("role-entry").filter({ hasText: "Гость" });
  await card.getByRole("button", { name: "Desktop" }).click();
  await expect(page.locator("iframe")).toHaveAttribute("title", "AUTH-01 Главная страница");
  await design(page)
    .locator('[data-pencil-id="xlvEx"] [data-pencil-name="ACTION → AUTH-02"]')
    .first()
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("title", "AUTH-02 Вход");
  await design(page)
    .locator('[data-pencil-id="o046g"] [data-pencil-name="ACTION → SHELL-02"]')
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "SHELL-02 Личный кабинет · сотрудник клиента",
  );
});

test("гость проходит мобильную регистрацию", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));
  const card = page.getByTestId("role-entry").filter({ hasText: "Гость" });
  await card.getByRole("button", { name: "Мобильный" }).click();
  await design(page)
    .locator('[data-pencil-id="kiGN4"] [data-pencil-name="ACTION → AUTH-03 · mobile"]')
    .first()
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("title", "AUTH-03 Регистрация · mobile");
  await design(page)
    .locator('[data-pencil-id="atKnC"] [data-pencil-name="ACTION → AUTH-03 РЕЗУЛЬТАТ · mobile"]')
    .click();
  await expect(page.getByRole("dialog", { name: "Результат регистрации" })).toBeVisible();
  await page.getByRole("button", { name: /Существующая компания/ }).click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "AUTH-03 Результат · существующая компания · mobile",
  );
});

test("все три исхода регистрации проходятся без панели прототипа", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"));
  const outcomes = [
    {
      button: /Существующая компания/,
      title: "AUTH-03 Результат · существующая компания",
    },
    { button: /Новая компания/, title: "AUTH-03 Результат · новая компания" },
    { button: /Ручная проверка/, title: "AUTH-03 Результат · ручная проверка" },
  ];

  for (const outcome of outcomes) {
    await page.goto("./?screen=YDq1G&role=guest&format=desktop");
    await design(page)
      .locator('[data-pencil-id="YDq1G"] [data-pencil-name="ACTION → AUTH-03 РЕЗУЛЬТАТ"]')
      .click();
    await page.getByRole("button", { name: outcome.button }).click();
    await expect(page.locator("iframe")).toHaveAttribute("title", outcome.title);
  }

  await design(page)
    .locator('[data-pencil-id="M7poB"] [data-pencil-name="ACTION → AUTH-02"]')
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("title", "AUTH-02 Вход");
});

test("сотрудник открывает статью, видео и поиск из обычного flow", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"));
  const card = page.getByTestId("role-entry").filter({ hasText: "Сотрудник клиента" });
  await card.getByRole("button", { name: "Desktop" }).click();
  await design(page)
    .locator('[data-pencil-id="uLhhN"] [data-pencil-name="ACTION → KB-01"]')
    .first()
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("title", "KB-01 Разделы БЗ");

  await design(page)
    .locator('[data-pencil-id="Sc4io"] [data-pencil-name="KB-01 Статья 1"]')
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("title", "KB-02 Статья");
  await design(page)
    .locator('[data-pencil-id="yretl"] [data-pencil-name="ACTION → KB-01-DESKTOP"]')
    .click();
  await design(page)
    .locator('[data-pencil-id="Sc4io"] [data-pencil-name="KB-01 Статья 2"]')
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("title", "KB-03 Статья с видео и таймкодами");
  await design(page)
    .locator('[data-pencil-id="M6IoTK"] [data-pencil-name="Navigation/Topbar Поиск"]')
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("title", "SRCH-01 Выдача поиска");
});

test("экраны чужой роли недоступны по ссылке и в селекторе", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"));
  await page.goto("./?screen=Fy0nE&role=client-employee&format=desktop");
  await expect(page.locator("iframe")).toHaveAttribute("title", "KB-02 Статья · нет доступа");
  await page.getByRole("button", { name: "Открыть панель прототипа" }).click();
  await expect(page.locator('#prototype-screen option[value="Fy0nE"]')).toHaveCount(0);
});

test("шапка всегда показывает активную роль", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"));
  const roles = [
    ["portal-admin", "Администратор портала"],
    ["support-engineer", "Инженер ТП / автор"],
    ["manager", "Менеджер"],
    ["client-admin", "Администратор клиента"],
    ["client-employee", "Сотрудник клиента"],
  ] as const;
  for (const [role, label] of roles) {
    await page.goto(`./?screen=yretl&role=${role}&format=desktop`);
    await expect(
      design(page).locator(
        '[data-pencil-id="yretl"] [data-pencil-name="Navigation/Topbar Имя"]',
      ),
    ).toHaveText(label);
  }
});

test("инженер и менеджер не видят опасные действия с пользователями", async ({ page }, testInfo) => {
  const mobile = testInfo.project.name.startsWith("mobile");
  for (const [listId, inviteId, role] of [
    [mobile ? "LtB29" : "zqEl6", mobile ? "P3UQ6" : "vRMWJ", "support-engineer"],
    [mobile ? "ZQuca" : "du8aB", mobile ? "P3UQ6" : "vRMWJ", "manager"],
  ] as const) {
    const format = mobile ? "mobile" : "desktop";
    await page.goto(`./?screen=${listId}&role=${role}&format=${format}`);
    await expect(
      design(page).locator(
        `[data-pencil-id="${listId}"] [data-pencil-name^="ACTION → ORG-04"][data-pencil-name*="смена роли"]:visible`,
      ),
    ).toHaveCount(0);
    await expect(
      design(page).locator(
        `[data-pencil-id="${listId}"] [data-pencil-name^="ACTION → ORG-04"][data-pencil-name*="удал"]:visible`,
      ),
    ).toHaveCount(0);

    await page.goto(`./?screen=${inviteId}&role=${role}&format=${format}`);
    await expect(
      design(page).locator(
        `[data-pencil-id="${inviteId}"] [data-pencil-name*="Роль"]:visible`,
      ),
    ).toHaveCount(0);
    await expect(design(page).locator(`[data-pencil-id="${inviteId}"]`)).not.toContainText(
      "Назначьте роль",
    );
  }
});

test("инженер не видит административный раздел в общей форме компании", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"));
  await page.goto("./?screen=rj3oR&role=support-engineer&format=desktop");
  await expect(
    design(page).locator(
      '[data-pencil-id="rj3oR"] [data-pencil-name^="ACTION → PLAT-"]:visible',
    ),
  ).toHaveCount(0);
  await expect(
    design(page).locator(
      '[data-pencil-id="rj3oR"] [data-pencil-name="Navigation/Topbar Имя"]',
    ),
  ).toHaveText("Инженер ТП / автор");
});

test("мобильное изменение структуры открывается поверх основного экрана", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));
  await page.goto("./?screen=n50Krp&role=portal-admin&format=mobile");
  await design(page)
    .locator('[data-pencil-id="n50Krp"] [data-pencil-name="ACTION → KB-06 Создание раздела mobile"]')
    .click();
  await expect(page.getByLabel("Модальное состояние прототипа")).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(2);
  await expect(page.locator("iframe").nth(1)).toHaveAttribute(
    "title",
    "KB-06 Состояние · создание · mobile",
  );
});

test("дерево и все карточки staff-базы кликабельны", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"));
  await page.goto("./?screen=Fy0nE&role=portal-admin&format=desktop");
  const frame = design(page).locator('[data-pencil-id="Fy0nE"]');

  for (const index of [1, 2, 3, 4, 5]) {
    await expect(frame.locator(`[data-pencil-name="KB-01 Статья ${index}"]`)).toHaveAttribute(
      "role",
      "button",
    );
  }
  const treeNode = frame.locator('[data-pencil-name="KB-01 Узел Продукты"]');
  await expect(treeNode).toHaveAttribute("role", "button");
  await treeNode.click();
  await expect(page.getByRole("status")).toContainText("Раздел базы знаний выбран");

  await frame.locator('[data-pencil-name="KB-01 Статья 4"]').click();
  await expect(page.locator("iframe")).toHaveAttribute("title", "KB-04 Редактор статьи");
});

test("панель статьи меняет публикацию, теги и доступ", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"));
  await page.goto("./?screen=sUjWN&role=portal-admin&format=desktop");
  await design(page)
    .locator('[data-pencil-id="sUjWN"] [data-pencil-name="ACTION → KB-05 Панель статьи"]')
    .click();
  await expect(page.locator("iframe")).toHaveCount(2);
  await expect(page.locator("iframe").nth(1)).toHaveAttribute("title", "KB-05 Панель управления статьёй");
  const articlePanel = page.locator("iframe").nth(1).contentFrame();

  await articlePanel
    .locator('[data-pencil-id="cuZKn"] [data-pencil-name="KB-05 Опция тега 1"]')
    .click();
  await expect(page.getByRole("status")).toContainText("Настройка статьи изменена");
  await articlePanel
    .locator('[data-pencil-id="cuZKn"] [data-pencil-name="KB-05 Доступ Интеграторы"]')
    .click();
  await expect(page.getByRole("status")).toContainText("Настройка статьи изменена");
  const sectionCheckbox = articlePanel.locator('[data-pencil-id="cuZKn"] [data-pencil-name="KB-05 НАВИСА Установка checkbox"]');
  await sectionCheckbox.click();
  await expect(sectionCheckbox).toHaveAttribute("aria-checked", "true");

  const publishedStatus = articlePanel.locator(
    '[data-pencil-id="cuZKn"] [data-prototype-select="true"]',
  );
  await publishedStatus.click();
  await expect(page.locator("iframe")).toHaveCount(2);
  await publishedStatus.selectOption({ label: "Черновик" });
  await expect(page.locator("iframe")).toHaveCount(1);
  await expect(page.locator("iframe")).toHaveAttribute("title", "KB-04 Редактор статьи");

  await page.goto("./?screen=T17CYs&role=portal-admin&format=desktop");
  const draftStatus = design(page).locator(
    '[data-pencil-id="T17CYs"] [data-prototype-select="true"]',
  );
  await draftStatus.selectOption({ label: "Опубликована" });
  await expect(page.locator("iframe")).toHaveAttribute("title", "KB-02 Статья");
});

test("поиск открывает подсказки и mobile-фильтры", async ({ page }, testInfo) => {
  if (testInfo.project.name.startsWith("desktop")) {
    await page.goto("./?screen=Tb3co&role=client-employee&format=desktop");
    const search = design(page).locator(
      '[data-pencil-id="Tb3co"] [data-pencil-name="ACTION INPUT → SRCH-01-DESKTOP"] [data-pencil-name="Inputs/Search Значение"]',
    );
    await search.pressSequentially("лицензия активация");
    await search.press("Enter");
    await expect(page.locator("iframe")).toHaveAttribute(
      "title",
      "SRCH-01 Выдача поиска · подсказки тегов",
    );
    const sorting = design(page).locator('[data-pencil-id="neKET"] [data-prototype-select="true"]');
    await sorting.selectOption({ label: "По названию" });
    await expect(sorting).toHaveValue("По названию");
    const sectionRadio = design(page).locator('[data-pencil-id="neKET"] [data-pencil-name="SRCH-01 Radio Вся база знаний"]');
    await sectionRadio.click();
    await expect(sectionRadio).toHaveAttribute("aria-checked", "true");
    return;
  }

  await page.goto("./?screen=kVLBy&role=client-employee&format=mobile");
  const search = design(page).locator(
    '[data-pencil-id="kVLBy"] [data-pencil-name="ACTION INPUT → SRCH-01-MOBILE"] [data-pencil-name="Inputs/Search Значение"]',
  );
  await search.pressSequentially("настройка интеграции");
  await search.press("Enter");
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "SRCH-01 Выдача поиска · mobile · фильтры открыты",
  );
  const sectionRadio = design(page).locator('[data-pencil-id="qMK5r"] [data-pencil-name="SRCH-01 Mobile Раздел Статьи"]');
  await sectionRadio.click();
  await expect(sectionRadio).toHaveAttribute("aria-checked", "true");
  await design(page).locator('[data-pencil-id="qMK5r"] [data-pencil-id="J2V02m"]').click();
  await expect(page.locator("iframe")).toHaveAttribute("title", "SRCH-01 Выдача поиска · mobile");
});

test("из поиска открывается найденная статья", async ({ page }, testInfo) => {
  const mobile = testInfo.project.name.startsWith("mobile");
  const format = mobile ? "mobile" : "desktop";
  const searchId = mobile ? "kVLBy" : "Tb3co";
  const articleAction = mobile ? "ACTION → KB-02-MOBILE" : "ACTION → KB-02-DESKTOP";

  await page.goto(`./?screen=${searchId}&role=client-employee&format=${format}`);
  await design(page)
    .locator(`[data-pencil-id="${searchId}"] [data-pencil-name="${articleAction}"]`)
    .first()
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    mobile ? "KB-02 Статья · mobile" : "KB-02 Статья",
  );

  await page.goto(`./?screen=${searchId}&role=client-employee&format=${format}`);
  const videoCard = design(page).locator(
    `[data-pencil-id="${searchId}"] [data-pencil-name="ACTION → KB-03-${mobile ? "MOBILE" : "DESKTOP"}"]`,
  );
  await expect(design(page).locator(`[data-pencil-id="${searchId}"]`)).toContainText(
    mobile ? "ФАЙЛ · ИНСТРУКЦИИ" : "РЕШЕНИЕ",
  );
  await expect(videoCard).toContainText("ВИДЕО");
  await expect(videoCard).toContainText("Настройка интеграции с САПР-комплексом");
  await videoCard.click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    mobile ? "KB-03 Статья с видео и таймкодами · mobile" : "KB-03 Статья с видео и таймкодами",
  );
});

test("desktop-реестр открывает drawer мест использования", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"));
  await page.goto("./?screen=IG8L8&role=portal-admin&format=desktop");
  await design(page)
    .locator(
      '[data-pencil-id="IG8L8"] [data-pencil-name="Table/Usage инструкция_активации.pdf"]',
    )
    .click();
  await expect(page.getByRole("dialog", { name: "Места использования" })).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Настройка интеграции с САПР-комплексом");
  await page.getByRole("button", { name: /Видео: Настройка интеграции/ }).click();
  await expect(page.getByRole("dialog", { name: "Места использования" })).toHaveCount(0);
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "KB-03 Статья с видео и таймкодами",
  );
});

test("из структуры можно перейти через теги в реестр файлов", async ({ page }, testInfo) => {
  const mobile = testInfo.project.name.startsWith("mobile");
  const format = mobile ? "mobile" : "desktop";
  const structureId = mobile ? "n50Krp" : "CQojg";
  const tagsId = mobile ? "WmKrc" : "shAHh";
  await page.goto(`./?screen=${structureId}&role=portal-admin&format=${format}`);
  await design(page)
    .locator(`[data-pencil-id="${structureId}"] [data-prototype-action="ACTION → KB-07 Теги и группы"]`)
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    mobile ? "KB-07 Теги и группы тегов · mobile" : "KB-07 Теги и группы тегов",
  );
  await design(page)
    .locator(`[data-pencil-id="${tagsId}"] [data-prototype-action="ACTION → KB-08 Реестр файлов"]`)
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    mobile ? "KB-08 Реестр файлов · mobile" : "KB-08 Реестр файлов",
  );
});

test("администратор открывает компании и карточку", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"));
  const card = page.getByTestId("role-entry").filter({ hasText: "Администратор портала" });
  await card.getByRole("button", { name: "Desktop" }).click();
  await design(page)
    .locator('[data-pencil-id="pmHIA"] [data-pencil-name="ACTION → ORG-01"]')
    .first()
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("title", "ORG-01 Компании");
  await design(page)
    .locator('[data-pencil-id="zv0ob"] [data-pencil-name*="ORG-01 Действия"]')
    .first()
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("title", /ORG-02 Карточка компании/);
});

test("администратор напрямую открывает типы компаний и структуру БЗ", async ({ page }, testInfo) => {
  const mobile = testInfo.project.name.startsWith("mobile");
  const format = mobile ? "mobile" : "desktop";
  const homeId = mobile ? "NllPS" : "pmHIA";

  await page.goto(`./?screen=${homeId}&role=portal-admin&format=${format}`);
  await design(page)
    .locator(`[data-pencil-id="${homeId}"] [data-pencil-name="ACTION → ORG-03${mobile ? " · mobile" : ""}"]`)
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    mobile ? "ORG-03 Типы компаний · mobile" : "ORG-03 Типы компаний",
  );

  await page.goto(`./?screen=${homeId}&role=portal-admin&format=${format}`);
  await design(page)
    .locator(`[data-pencil-id="${homeId}"] [data-pencil-name="ACTION → KB-06${mobile ? " · mobile" : ""}"]`)
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    mobile ? "KB-06 Настройка структуры БЗ · mobile" : "KB-06 Настройка структуры БЗ",
  );
});

test("менеджер остаётся в мобильной ветке", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));
  const card = page.getByTestId("role-entry").filter({ hasText: "Менеджер" });
  await card.getByRole("button", { name: "Мобильный" }).click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "SHELL-02 Личный кабинет · менеджер · mobile",
  );
  await design(page)
    .locator('[data-pencil-id="bLysq"] [data-pencil-name="ACTION → KB-01 · mobile"]')
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "KB-01 Разделы БЗ · staff · менеджер · mobile",
  );
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
});

test("поля, списки и переключатели доступны для демонстрации", async ({ page }, testInfo) => {
  const mobile = testInfo.project.name.startsWith("mobile");
  const format = mobile ? "mobile" : "desktop";
  const registrationId = mobile ? "atKnC" : "YDq1G";
  await page.goto(`./?screen=${registrationId}&role=guest&format=${format}`);
  const registration = design(page).locator(`[data-pencil-id="${registrationId}"]`);
  const editable = registration.locator('[data-prototype-editable="true"]').first();
  await editable.fill("demo@maxsoft.ru");
  await expect(editable).toHaveText("demo@maxsoft.ru");

  const companyTypeId = mobile ? "OciI4" : "rj3oR";
  await page.goto(`./?screen=${companyTypeId}&role=portal-admin&format=${format}`);
  const companyType = design(page).locator(`[data-pencil-id="${companyTypeId}"]`);
  const select = companyType.getByRole("combobox").first();
  const options = await select.locator("option").allTextContents();
  await select.selectOption({ label: options[1] });
  await expect(select).toHaveValue(options[1]);

  const settingsId = mobile ? "f8cxdc" : "gjiKL";
  await page.goto(`./?screen=${settingsId}&role=portal-admin&format=${format}`);
  const toggle = design(page)
    .locator(`[data-pencil-id="${settingsId}"]`)
    .getByRole("switch")
    .first();
  const initial = await toggle.getAttribute("aria-checked");
  await toggle.press(" ");
  await expect(toggle).toHaveAttribute("aria-checked", initial === "true" ? "false" : "true");
});

test("профиль и мобильное боковое меню открываются и закрываются у каждой роли", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const mobile = testInfo.project.name.startsWith("mobile");
  const format = mobile ? "mobile" : "desktop";
  const cases = [
    {
      role: "portal-admin",
      home: mobile ? "NllPS" : "pmHIA",
      profile: mobile ? "pSJtI" : "DMuJh",
      menu: "BryXu",
    },
    {
      role: "support-engineer",
      home: mobile ? "QK2cj" : "w9mzj",
      profile: mobile ? "qxJth" : "jZ84j",
      menu: "gtRSp",
    },
    {
      role: "manager",
      home: mobile ? "bLysq" : "oge4c",
      profile: mobile ? "BfGmN" : "WLQ67",
      menu: "oB7s3",
    },
    {
      role: "client-admin",
      home: mobile ? "RcJJN" : "uuYrz",
      profile: mobile ? "ruCKR" : "ZFDsN",
      menu: "HucIi",
    },
    {
      role: "client-employee",
      home: mobile ? "KvdWU" : "uLhhN",
      profile: mobile ? "DmOzx" : "t0gHI",
      menu: "BcqPK",
    },
  ];

  for (const entry of cases) {
    const profileScreen = screens.find((screen) => screen.id === entry.profile);
    if (!profileScreen) throw new Error(`E2E_PROFILE_SCREEN_MISSING: ${entry.profile}`);
    await page.goto(`./?screen=${entry.home}&role=${entry.role}&format=${format}`);
    await page
      .locator("iframe")
      .first()
      .contentFrame()
      .locator(`[data-pencil-id="${entry.home}"] [data-pencil-name*="меню профиля"]`)
      .first()
      .click();
    await expect(page.locator("iframe")).toHaveCount(2);
    await expect(page.locator("iframe").nth(1)).toHaveAttribute("title", profileScreen.name);
    await expect(page.getByRole("dialog", { name: "Навигационное меню" })).toHaveAttribute("aria-modal", "true");
    await expect(page.locator("iframe").first()).toHaveAttribute("tabindex", "-1");
    await page.keyboard.press("Escape");
    await expect(page.locator("iframe")).toHaveCount(1);

    if (!mobile) continue;
    const menuScreen = screens.find((screen) => screen.id === entry.menu);
    if (!menuScreen) throw new Error(`E2E_MENU_SCREEN_MISSING: ${entry.menu}`);
    await page
      .locator("iframe")
      .contentFrame()
      .locator(`[data-pencil-id="${entry.home}"] [data-pencil-name^="SHELL-02 Mobile меню"]`)
      .click();
    await expect(page.locator("iframe")).toHaveCount(2);
    await expect(page.locator("iframe").nth(1)).toHaveAttribute("title", menuScreen.name);
    await page
      .locator("iframe")
      .nth(1)
      .contentFrame()
      .locator(`[data-pencil-id="${entry.menu}"] [data-pencil-name="DISABLED · меню открыто для демонстрации"]`)
      .click();
    await expect(page.locator("iframe")).toHaveCount(1);
  }
});

test("администратор клиента открывает сотрудников своей компании", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));
  const card = page.getByTestId("role-entry").filter({ hasText: "Администратор клиента" });
  await card.getByRole("button", { name: "Мобильный" }).click();
  await design(page)
    .locator('[data-pencil-id="RcJJN"] [data-pencil-name="ACTION → ORG-05 · mobile"]')
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "ORG-05 Пользователи компании · mobile",
  );
});

test("инженер проходит успех и ошибку импорта DOCX", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const mobile = testInfo.project.name.startsWith("mobile");
  const format = mobile ? "mobile" : "desktop";
  const editorId = mobile ? "lR77f" : "sUjWN";
  const outcomes = [
    {
      button: "Успешный импорт",
      title: mobile
        ? "KB-04 Редактор статьи · импорт завершён · mobile"
        : "KB-04 Редактор статьи · импорт завершён",
    },
    {
      button: "Ошибка импорта",
      title: mobile
        ? "KB-04 Редактор статьи · импорт ошибка · mobile"
        : "KB-04 Редактор статьи · импорт ошибка",
      retry: true,
    },
  ];

  for (const outcome of outcomes) {
    await page.goto(`./?screen=${editorId}&role=support-engineer&format=${format}`);
    await design(page)
      .locator(`[data-pencil-id="${editorId}"] [data-pencil-name^="ACTION → KB-04 Импорт"]`)
      .click();
    await expect(page.getByRole("dialog", { name: "Результат импорта Word" })).toBeVisible();
    await page.getByRole("button", { name: new RegExp(outcome.button) }).click();
    const resultFrame = mobile ? page.locator("iframe") : page.locator("iframe").nth(1);
    await expect(resultFrame).toHaveAttribute("title", outcome.title, { timeout: 5000 });
    if (outcome.retry) {
      await expect(resultFrame).toHaveAttribute("data-prototype-ready", "true");
      const retryFrame = resultFrame.contentFrame();
      await retryFrame
        .locator(
          `[data-pencil-id="${mobile ? "bTLLo" : "cKrvi"}"] [data-pencil-name^="ACTION → KB-04"][data-pencil-name*="Повтор"]`,
        )
        .click();
      await expect(retryFrame.locator(`[data-pencil-id="${mobile ? "bTLLo" : "cKrvi"}"] [data-pencil-name^="ACTION → KB-04"][data-pencil-name*="Повтор"]`)).toHaveClass(/prototype-toggled/);
      await expect(page.getByRole("dialog", { name: "Результат импорта Word" })).toBeVisible();
      await page.getByRole("button", { name: /Успешный импорт/ }).click();
      await expect(mobile ? page.locator("iframe") : page.locator("iframe").nth(1)).toHaveAttribute(
        "title",
        mobile
          ? "KB-04 Редактор статьи · импорт завершён · mobile"
          : "KB-04 Редактор статьи · импорт завершён",
        { timeout: 5000 },
      );
    }
  }
});

test("администратор клиента подтверждает блокировку", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));
  await page.goto("./?screen=YD7vh&role=client-admin&format=mobile");
  await design(page)
    .locator('[data-pencil-id="YD7vh"] [data-pencil-name*="ORG-05 заблокировать mobile"]')
    .first()
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "ORG-05 Пользователи компании · заблокировать сотрудника · mobile",
  );
  await design(page)
    .locator('[data-pencil-id="zsSXN"] [data-pencil-name*="ORG05 Диалог подтвердить"]')
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "ORG-05 Пользователи компании · блокировка подтверждена · mobile",
  );
  await design(page)
    .locator('[data-pencil-id="VMDAp"] [data-pencil-name*="ORG05 Разблокировать"]')
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "ORG-05 Пользователи компании · mobile",
  );
  await expect(page.getByRole("status")).toContainText("Сотрудник разблокирован");
});

test("мобильное вложение статьи скачивается как файл", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));
  await page.goto("./?screen=dcJkq&role=portal-admin&format=mobile");
  const downloadPromise = page.waitForEvent("download");
  await design(page)
    .locator(
      '[data-pencil-id="dcJkq"] [data-pencil-name="ACTION → KB-08 Файл инструкция_подключения.pdf"]',
    )
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("maxsoft-demo-document.txt");
  await expect(page.getByRole("status")).toContainText("файл подготовлен");
});

test("мобильные полноэкранные формы завершают операцию", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  test.skip(!testInfo.project.name.startsWith("mobile"));

  await page.goto("./?screen=P3UQ6&role=portal-admin&format=mobile");
  await design(page)
    .locator('[data-pencil-id="P3UQ6"] [data-pencil-name="ACTION → ORG-04 приглашение отправлено mobile"]')
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "ORG-04 Пользователи портала · mobile",
  );

  await page.goto("./?screen=IX8g1&role=client-admin&format=mobile");
  await design(page)
    .locator('[data-pencil-id="IX8g1"] [data-pencil-name="ACTION → ORG-05 сотрудник добавлен mobile"]')
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "ORG-05 Пользователи компании · mobile",
  );

  await page.goto("./?screen=h89rfQ&role=portal-admin&format=mobile");
  await design(page)
    .locator('[data-pencil-id="h89rfQ"] [data-pencil-name="ACTION → KB-06 создание Создать"]')
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "KB-06 Настройка структуры БЗ · mobile",
  );

  await page.goto("./?screen=zdyBM&role=portal-admin&format=mobile");
  await design(page)
    .locator('[data-pencil-id="zdyBM"] [data-pencil-name*="KB07 Mobile Сохранить"]')
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "KB-07 Теги и группы тегов · сохранено · mobile",
  );
  await expect(
    design(page).locator('[data-pencil-name="SHELL Кнопка помощника"]:visible'),
  ).toHaveCount(0);
});

const representativeScreens: Record<ScreenFormat, Array<{ id: string; role: string }>> = {
  desktop: [
    { id: "xlvEx", role: "guest" },
    { id: "o046g", role: "guest" },
    { id: "YDq1G", role: "guest" },
    { id: "wP6Wy", role: "guest" },
    { id: "Ylweo", role: "portal-admin" },
    { id: "pmHIA", role: "portal-admin" },
    { id: "Fy0nE", role: "portal-admin" },
    { id: "yretl", role: "portal-admin" },
    { id: "M6IoTK", role: "portal-admin" },
    { id: "sUjWN", role: "portal-admin" },
    { id: "cuZKn", role: "portal-admin" },
    { id: "CQojg", role: "portal-admin" },
    { id: "shAHh", role: "portal-admin" },
    { id: "IG8L8", role: "portal-admin" },
    { id: "Tb3co", role: "portal-admin" },
    { id: "zv0ob", role: "portal-admin" },
    { id: "pgMj9", role: "portal-admin" },
    { id: "iPAn6", role: "portal-admin" },
    { id: "cZUol", role: "portal-admin" },
    { id: "qRWeu", role: "client-admin" },
    { id: "SJu0Y", role: "portal-admin" },
    { id: "o43HZq", role: "portal-admin" },
    { id: "ycjEe", role: "portal-admin" },
    { id: "G0ePJ7", role: "portal-admin" },
  ],
  mobile: [
    { id: "kiGN4", role: "guest" },
    { id: "cAATf", role: "guest" },
    { id: "atKnC", role: "guest" },
    { id: "iJAp9", role: "guest" },
    { id: "BryXu", role: "portal-admin" },
    { id: "NllPS", role: "portal-admin" },
    { id: "K4fvbv", role: "portal-admin" },
    { id: "FYI4I", role: "portal-admin" },
    { id: "dcJkq", role: "portal-admin" },
    { id: "lR77f", role: "portal-admin" },
    { id: "U3ek80", role: "portal-admin" },
    { id: "n50Krp", role: "portal-admin" },
    { id: "WmKrc", role: "portal-admin" },
    { id: "EzOlK", role: "portal-admin" },
    { id: "kVLBy", role: "portal-admin" },
    { id: "L6KLB", role: "portal-admin" },
    { id: "i3L0M", role: "portal-admin" },
    { id: "h3h0i", role: "portal-admin" },
    { id: "FmZWA", role: "portal-admin" },
    { id: "YD7vh", role: "client-admin" },
    { id: "xxNsw", role: "portal-admin" },
    { id: "a7N2d", role: "portal-admin" },
    { id: "mY7Mh", role: "portal-admin" },
    { id: "DGyCQ", role: "portal-admin" },
  ],
};

test("рендерит представителя каждой экранной группы платформы", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const format: ScreenFormat = testInfo.project.name.startsWith("mobile") ? "mobile" : "desktop";
  for (const entry of representativeScreens[format]) {
    const screen = screens.find((candidate) => candidate.id === entry.id);
    if (!screen) throw new Error(`E2E_SCREEN_MISSING: ${entry.id}`);
    await page.goto(`./?screen=${entry.id}&role=${entry.role}&format=${format}`);
    await expect(page.locator("iframe")).toHaveAttribute("title", screen.name);
    await expect(design(page).locator(`[data-pencil-id="${entry.id}"]`)).toBeVisible();
  }
});

import { expect, test, type Page } from "@playwright/test";
import { screens, type ScreenFormat } from "../src/generated/screens";

const design = (page: Page) => page.frameLocator("iframe");

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Выберите сценарий" })).toBeVisible();
  (page as Page & { prototypeErrors?: string[] }).prototypeErrors = errors;
});

test.afterEach(async ({ page }) => {
  expect((page as Page & { prototypeErrors?: string[] }).prototypeErrors ?? []).toEqual([]);
});

test("запускает все шесть ролевых точек входа", async ({ page }, testInfo) => {
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
    await page.goto("/");
    const card = page.getByTestId("role-entry").filter({ hasText: entry.label });
    await card.getByRole("button", { name: mobile ? "Мобильный" : "Desktop" }).click();
    const expected = screens.find((screen) => screen.id === (mobile ? entry.mobile : entry.desktop));
    if (!expected) throw new Error(`E2E_ROLE_SCREEN_MISSING: ${entry.label}`);
    await expect(page.locator("iframe")).toHaveAttribute("title", expected.name);
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
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "AUTH-03 Результат · существующая компания · mobile",
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

test("инженер импортирует DOCX в черновик", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"));
  const card = page.getByTestId("role-entry").filter({ hasText: "Инженер ТП / автор" });
  await card.getByRole("button", { name: "Desktop" }).click();
  await design(page)
    .locator('[data-pencil-id="w9mzj"] [data-pencil-name="ACTION → KB-04"]')
    .first()
    .click();
  await expect(page.locator("iframe")).toHaveAttribute("title", "KB-04 Редактор статьи");
  await design(page)
    .locator('[data-pencil-id="sUjWN"] [data-pencil-name="ACTION → KB-04 Импорт DOCX"]')
    .click();
  await expect(page.getByLabel("Модальное состояние прототипа")).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(2);
  await expect(page.locator("iframe").nth(1)).toHaveAttribute(
    "title",
    "KB-04 Редактор статьи · импорт завершён",
    { timeout: 5000 },
  );
});

test("администратор клиента подтверждает блокировку", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));
  await page.goto("/?screen=YD7vh&role=client-admin&format=mobile");
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
});

test("мобильные полноэкранные формы завершают операцию", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));

  await page.goto("/?screen=P3UQ6&role=portal-admin&format=mobile");
  await design(page)
    .locator('[data-pencil-id="P3UQ6"] [data-pencil-name="ACTION → ORG-04 приглашение отправлено mobile"]')
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "ORG-04 Пользователи портала · mobile",
  );

  await page.goto("/?screen=IX8g1&role=client-admin&format=mobile");
  await design(page)
    .locator('[data-pencil-id="IX8g1"] [data-pencil-name="ACTION → ORG-05 сотрудник добавлен mobile"]')
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "ORG-05 Пользователи компании · mobile",
  );

  await page.goto("/?screen=h89rfQ&role=portal-admin&format=mobile");
  await design(page)
    .locator('[data-pencil-id="h89rfQ"] [data-pencil-name="ACTION → KB-06 создание Создать"]')
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "KB-06 Настройка структуры БЗ · mobile",
  );

  await page.goto("/?screen=zdyBM&role=portal-admin&format=mobile");
  await design(page)
    .locator('[data-pencil-id="zdyBM"] [data-pencil-name*="KB07 Mobile Сохранить"]')
    .click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "KB-07 Теги и группы тегов · сохранено · mobile",
  );
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

test("рендерит представителя каждой экранной группы этапа 1", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const format: ScreenFormat = testInfo.project.name.startsWith("mobile") ? "mobile" : "desktop";
  for (const entry of representativeScreens[format]) {
    const screen = screens.find((candidate) => candidate.id === entry.id);
    if (!screen) throw new Error(`E2E_SCREEN_MISSING: ${entry.id}`);
    await page.goto(`/?screen=${entry.id}&role=${entry.role}&format=${format}`);
    await expect(page.locator("iframe")).toHaveAttribute("title", screen.name);
    await expect(design(page).locator(`[data-pencil-id="${entry.id}"]`)).toBeVisible();
  }
});

import { test, expect } from "@playwright/test";
import { companyFields, companies } from "../src/data/platform-data";
const roles = [
  "portal-admin",
  "support-engineer",
  "manager",
  "client-admin",
  "client-employee",
];

test("DEMO-09/10: старый профиль не разрешает менять проект; чтение отдельно от изменения", async ({
  page,
}) => {
  await page.goto("./?page=company&role=manager&resource=severprom");
  await page.evaluate(
    (fields) =>
      localStorage.setItem(
        "maxsoft-prototype-company-fields",
        JSON.stringify(
          fields.map((f) => ({
            ...f,
            manager: true,
            managerEditable: f.id !== "phone",
          })),
        ),
      ),
    companyFields,
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Редактировать", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Проект", { exact: true })).toBeDisabled();
  await expect(dialog.getByLabel("Телефон", { exact: true })).toBeDisabled();
  await expect(
    dialog.getByLabel("Тип компании", { exact: true }),
  ).toBeDisabled();
  await dialog.getByLabel("Договор / основание").fill("Новый договор");
  await dialog.locator('[name="project"]').evaluate((el: HTMLInputElement) => {
    el.disabled = false;
    el.value = "Подмена проекта";
  });
  await dialog.getByRole("button", { name: "Сохранить компанию" }).click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(
    page.locator("dd").filter({ hasText: companies[0].project }),
  ).toBeVisible();
  await expect(
    page.locator("dd").filter({ hasText: "Новый договор" }),
  ).toBeVisible();
});

test("DEMO-10: настройки показывают защищённые флаги и реальный результат", async ({
  page,
}) => {
  await page.goto("./?page=fields&role=portal-admin");
  await expect(
    page.getByRole("switch", {
      name: "Менеджер изменяет: Проект",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    page.getByRole("switch", {
      name: "Менеджер изменяет: Тип компании",
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByRole("switch", {
      name: "Менеджер изменяет: Договор / основание",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Сохранить настройки" }).click();
  await expect(page.getByRole("status")).toContainText("локальных данных");
  await page.goto("./?page=company&role=manager&resource=severprom");
  await page
    .getByRole("button", { name: "Редактировать", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByLabel("Договор / основание"),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await page.goto("./?page=fields&role=portal-admin");
  await page
    .getByRole("switch", {
      name: "Менеджер видит: Договор / основание",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Сохранить настройки" }).click();
  await page.goto("./?page=company&role=manager&resource=severprom");
  await expect(
    page.getByText(companies[0].contract, { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Редактировать", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByLabel("Договор / основание"),
  ).toHaveCount(0);
});

for (const role of roles)
  test(`DEMO-15: помощь и разрешённые переходы — ${role}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`./?page=home&role=${role}`);
    await page.getByRole("button", { name: /Демо-профиль$/ }).click();
    await page
      .getByRole("menuitem", { name: "Как пользоваться порталом" })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Как пользоваться порталом",
        exact: true,
      }),
    ).toBeVisible();
    const links = await page
      .locator("main [data-help-page]")
      .evaluateAll((elements) =>
        elements.map((el) => el.getAttribute("data-help-page")),
      );
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const target of links) {
      await page.locator(`[data-help-page="${target}"]`).click();
      await expect(page).toHaveURL(new RegExp(`page=${target}(?:&|$)`));
      await expect(
        page.getByRole("heading", { name: "Нет доступа к разделу" }),
      ).toHaveCount(0);
      await page.goto(`./?page=help&role=${role}`);
    }
    if (role.startsWith("client"))
      await expect(
        page.getByRole("button", { name: "Настройки портала" }),
      ).toHaveCount(0);
  });

test("DEMO-15: гостю требуется вход", async ({ page }) => {
  await page.goto("./?page=help&role=guest");
  await expect(
    page.getByRole("button", { name: "Войти", exact: true }),
  ).toBeVisible();
});

test("DEMO-14: напоминание показывает сохранённую дату и открывает компанию", async ({
  page,
}) => {
  await page.goto("./?page=home&role=manager");
  const reminder = page.getByRole("region", {
    name: "Пример напоминания о поддержке",
  });
  await expect(reminder).toContainText("31.12.2026");
  await reminder.getByRole("button", { name: "Открыть компанию" }).click();
  await expect(
    page.getByRole("heading", { name: companies[0].name, exact: true }),
  ).toBeVisible();
  await page.evaluate(
    (records) =>
      localStorage.setItem(
        "maxsoft-prototype-companies",
        JSON.stringify(
          records.map((c) =>
            c.id === "severprom" ? { ...c, statusUntil: "2027-04-20" } : c,
          ),
        ),
      ),
    companies,
  );
  await page.goto("./?page=home&role=manager");
  await expect(reminder).toContainText("20.04.2027");
  for (const role of ["client-admin", "client-employee"]) {
    await page.goto(`./?page=home&role=${role}`);
    await expect(reminder).toHaveCount(0);
  }
});

for (const role of ["manager", "support-engineer"])
  test(`DEMO-09: создание компании и сохранение полномочий — ${role}`, async ({
    page,
  }) => {
    await page.goto(`./?page=companies&role=${role}`);
    if (role === "manager") {
      await page.evaluate(
        (fields) =>
          localStorage.setItem(
            "maxsoft-prototype-company-fields",
            JSON.stringify(
              fields.map((f) => ({
                ...f,
                managerEditable: !["name", "status"].includes(f.id),
              })),
            ),
          ),
        companyFields,
      );
      await page.reload();
    }
    await page.getByRole("button", { name: "Добавить компанию" }).click();
    const form = page.getByRole("dialog", { name: "Новая компания" });
    await form
      .getByLabel("Полное наименование", { exact: true })
      .fill("ООО Проверка прав");
    await form
      .getByLabel("Сокращённое наименование", { exact: true })
      .fill("Проверка прав");
    await form.getByLabel("ИНН", { exact: true }).fill("1234567890");
    await form
      .getByLabel("Рабочий домен 1", { exact: true })
      .fill("new-permissions.example.ru");
    if (role === "manager")
      await expect(form.getByLabel("Проект", { exact: true })).toBeDisabled();
    else {
      await form.getByLabel("Проект", { exact: true }).fill("Проект инженера");
      await form
        .getByLabel("Тип компании", { exact: true })
        .selectOption("ВИП-клиент");
    }
    await form.getByRole("button", { name: "Сохранить компанию" }).click();
    await expect(form).toHaveCount(0);
    await page
      .getByRole("button", { name: "Открыть компанию: ООО Проверка прав" })
      .click();
    await expect(
      page
        .locator("dd")
        .filter({ hasText: role === "manager" ? "Базовый" : "ВИП-клиент" }),
    ).toBeVisible();
    if (role === "support-engineer")
      await expect(
        page.getByText("Проект инженера", { exact: true }),
      ).toBeVisible();
    await page.goto(`./?page=users&role=${role}`);
    await expect(
      page.getByRole("button", { name: "Пригласить пользователя" }),
    ).toBeVisible();
  });

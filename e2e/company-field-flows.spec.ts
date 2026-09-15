import { expect, test } from "@playwright/test";
import { companies } from "../src/data/platform-data";

test("административные настройки влияют на редактор и форму компании", async ({
  page,
}) => {
  await page.goto("./?page=tags&role=portal-admin");
  await page.getByRole("button", { name: "Новый тег" }).click();
  const tagDialog = page.getByRole("dialog", { name: "Новый тег" });
  await tagDialog.getByLabel("Название тега").fill("Совместимость 2026");
  await tagDialog.getByRole("button", { name: "Сохранить" }).click();
  await page.goto("./?page=editor&role=portal-admin");
  await page.getByRole("button", { name: "Настройки" }).click();
  await expect(
    page.getByRole("button", { name: "Совместимость 2026" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Закрыть" }).click();

  await page.goto("./?page=company-types&role=portal-admin");
  await page.getByRole("button", { name: "Новый тип" }).click();
  const typeDialog = page.getByRole("dialog", { name: "Новый тип" });
  await typeDialog.getByLabel("Название типа").fill("Партнёр");
  await typeDialog.getByRole("button", { name: "Сохранить" }).click();
  await page.goto("./?page=companies&role=portal-admin");
  await page.getByRole("button", { name: "Добавить компанию" }).click();
  const companyForm = page.getByRole("dialog", { name: "Новая компания" });
  await companyForm.getByText("Тип компании", { exact: true }).click();
  await page.keyboard.press("Enter");
  await expect(
    companyForm.getByRole("option", { name: "Партнёр", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Закрыть" }).click();

  await page.goto("./?page=fields&role=portal-admin");
  await page.getByRole("switch", { name: "Показывать поле: Проект" }).click();
  await page.getByRole("button", { name: "Сохранить настройки" }).click();
  await expect(page.getByRole("status")).toContainText(
    "проверки локальных данных",
    { timeout: 3000 },
  );
  await page.goto("./?page=companies&role=portal-admin");
  await page.getByRole("button", { name: "Добавить компанию" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Новая компания" })
      .getByLabel("Проект", { exact: true }),
  ).toHaveCount(0);

  await page.goto("./?page=audit&role=portal-admin");
  await expect(page.getByText("Совместимость 2026")).toBeVisible();
  await expect(page.getByText("Партнёр")).toBeVisible();
  await expect(page.getByText("Поля компании").first()).toBeVisible();
});

test("поля компании показывают операции и блокируют противоречивые настройки", async ({
  page,
}, testInfo) => {
  await page.goto("./?page=fields&role=portal-admin");
  const fieldSurface = testInfo.project.name.startsWith("mobile")
    ? page.getByRole("article").filter({ hasText: "ИНН" })
    : page.getByRole("table");
  await expect(
    fieldSurface.getByText("При создании", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    fieldSurface.getByText("При редактировании", { exact: true }).first(),
  ).toBeVisible();
  const visible = page.getByRole("switch", { name: "Показывать поле: ИНН" });
  const required = page.getByRole("switch", {
    name: "Требовать заполнения: ИНН",
  });
  if ((await required.getAttribute("aria-checked")) === "false")
    await required.click();
  await visible.click();
  await expect(required).toHaveAttribute("aria-checked", "false");
  await expect(page.getByText("Есть несохранённые изменения")).toBeVisible();
});

test("настройка PLAT-04 управляет полями самостоятельной регистрации", async ({
  page,
}) => {
  await page.goto("./?page=fields&role=portal-admin");
  await page
    .getByRole("switch", { name: "При регистрации: Полное наименование" })
    .click();
  await page.getByRole("button", { name: "Сохранить настройки" }).click();
  await expect(page.getByRole("status")).toContainText(
    "проверки локальных данных",
    { timeout: 3000 },
  );
  await page.goto("./?page=register&role=guest");
  await expect(page.getByLabel("Полное наименование")).toHaveCount(0);
  await expect(page.getByLabel("ИНН")).toBeVisible();
});

test("PLAT-04 управляет уникальностью всех полей компании", async ({
  page,
}) => {
  await page.goto("./?page=companies&role=portal-admin");
  await page.evaluate(() => {
    const key = "maxsoft-prototype-company-fields";
    const fields = [
      ["name", "Полное наименование", true],
      ["shortName", "Сокращённое наименование", true],
      ["inn", "ИНН", false],
      ["kpp", "КПП", true],
      ["legalAddress", "Юридический адрес", false],
      ["domains", "Рабочие домены", false],
      ["primaryEmail", "Основной email", true],
      ["phone", "Телефон", false],
      ["type", "Тип компании", false],
      ["status", "Статус компании", false],
      ["statusUntil", "Срок действия статуса", false],
      ["contract", "Договор / основание", false],
      ["contractDate", "Дата договора", false],
      ["project", "Проект", false],
      ["bitrix", "Ссылка на Битрикс24", true],
    ].map(([id, label, unique]) => ({
      id,
      label,
      unique,
      visible: true,
      required: [
        "name",
        "shortName",
        "inn",
        "domains",
        "type",
        "status",
      ].includes(id as string),
      manager: id !== "type" && id !== "bitrix",
      registration: false,
      creation: true,
      editing: true,
    }));
    window.localStorage.setItem(key, JSON.stringify(fields));
  });
  await page.reload();
  await page.getByRole("button", { name: "Добавить компанию" }).click();
  const editor = page.getByRole("dialog", { name: "Новая компания" });
  await editor
    .getByLabel("Полное наименование")
    .fill("ООО «Уникальная компания»");
  await editor.getByLabel("Сокращённое наименование").fill("Уникальное имя");
  await editor.getByLabel("ИНН").fill("2463128457");
  await editor.getByLabel("КПП").fill("246301001");
  await editor
    .getByLabel("Рабочий домен 1", { exact: true })
    .fill("severprom.ru");
  await editor.getByLabel("Основной email").fill("unique@example.ru");
  await editor.getByRole("button", { name: "Сохранить компанию" }).click();
  await expect(editor).toContainText("ACC_COMPANY_FIELD_CONFLICT");

  await editor.getByLabel("КПП").fill("123456789");
  await editor.getByLabel("Полное наименование").fill("ООО «СеверПромБИМ»");
  await editor.getByRole("button", { name: "Сохранить компанию" }).click();
  await expect(editor).toContainText("ACC_COMPANY_FIELD_CONFLICT");

  await editor
    .getByLabel("Полное наименование")
    .fill("ООО «Уникальная компания»");
  await editor.getByRole("button", { name: "Сохранить компанию" }).click();
  await expect(
    page.getByRole("button", {
      name: "Открыть компанию: ООО «Уникальная компания»",
    }),
  ).toBeVisible();
});

test("интеграции и настройки полей реагируют на действия", async ({ page }) => {
  await page.goto("./?page=integrations&role=portal-admin");
  await page
    .getByRole("button", { name: "Проверить подключение" })
    .first()
    .click();
  await expect(page.getByText("Подключение работает").first()).toBeVisible({
    timeout: 3000,
  });
  await page.getByLabel("Адрес портала").fill("https://invalid.example");
  await page
    .getByRole("button", { name: "Проверить подключение" })
    .nth(1)
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "PLAT_INTEGRATION_CONNECTION_FAILED",
    {
      timeout: 3000,
    },
  );
  await page.goto("./?page=fields&role=portal-admin");
  const fieldSwitch = page.getByRole("switch", {
    name: "Требовать заполнения: Телефон",
  });
  const before = await fieldSwitch.getAttribute("aria-checked");
  await fieldSwitch.click();
  await expect(fieldSwitch).toHaveAttribute(
    "aria-checked",
    before === "true" ? "false" : "true",
  );
  await page.evaluate((records) => {
    records[1].phone = records[0].phone;
    localStorage.setItem(
      "maxsoft-prototype-companies",
      JSON.stringify(records),
    );
  }, companies);
  await page
    .getByRole("switch", { name: "Проверять уникальность: Телефон" })
    .click();
  await page.getByRole("button", { name: "Сохранить настройки" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "PLAT_FIELD_UNIQUENESS_CONFLICT",
    {
      timeout: 3000,
    },
  );
});

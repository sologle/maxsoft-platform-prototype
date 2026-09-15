import { test, expect } from "@playwright/test";

test("PL-05: все вложения доступны сотруднику через статьи", async ({
  page,
}) => {
  await page.goto(
    "./?page=article&role=client-employee&resource=network-license",
  );
  await expect(
    page.getByRole("button", {
      name: "Открыть файл: регламент_обновления.docx",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Открыть файл: регламент_обновления.docx",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "регламент_обновления.docx",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Назад", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Настройка сетевой лицензии",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto(
    "./?page=video&role=client-employee&resource=cad-integration",
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /схема_подключения.dwg/ }).click();
  expect((await download).suggestedFilename()).toBe(
    "схема_подключения.dwg.demo.txt",
  );
});

test("PL-01: регистрация сохраняет личные сведения без реквизитов компании", async ({
  page,
}) => {
  await page.goto("./?page=register");
  await expect(
    page.getByLabel("Сокращённое наименование", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("Полное наименование компании", { exact: true })
    .fill("ООО Демо 1609");
  await page.getByLabel("ИНН", { exact: true }).fill("1234567890");
  await page.getByLabel("Корпоративная почта").fill("anna@demo1609.example");
  await page.getByLabel("Должность", { exact: true }).fill("Инженер");
  await page.getByLabel("Отдел", { exact: true }).fill("Проектирование");
  await page.getByLabel("Контактный телефон").fill("+7 999 000-16-09");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  const data = await page.evaluate(() => ({
    companies: JSON.parse(localStorage.getItem("maxsoft-prototype-companies")!),
    users: JSON.parse(localStorage.getItem("maxsoft-prototype-users")!),
  }));
  expect(data.companies.at(-1)).toMatchObject({
    shortName: "",
    primaryEmail: "",
    phone: "",
    domains: ["demo1609.example"],
  });
  expect(data.users.at(-1)).toMatchObject({
    position: "Инженер",
    department: "Проектирование",
    phone: "+7 999 000-16-09",
  });
});

test("PL-06: теги без текста и возврат сохраняют поиск", async ({
  page,
}, testInfo) => {
  await page.goto("./?page=search&role=client-employee");
  await page
    .getByRole("button", { name: "Очистить поиск", exact: true })
    .click();
  if (testInfo.project.name.includes("mobile"))
    await page.getByRole("button", { name: "Фильтры", exact: true }).click();
  await page
    .getByRole("button", { name: "Лицензирование", exact: true })
    .click();
  if (testInfo.project.name.includes("mobile"))
    await page.getByRole("button", { name: "Показать результаты" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Настройка сетевой лицензии",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Открыть материал: Настройка сетевой лицензии",
    })
    .click();
  await page.getByRole("button", { name: "Назад", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Поиск по базе знаний" }),
  ).toHaveValue("");
  await expect(
    page.getByRole("heading", {
      name: "Настройка сетевой лицензии",
      exact: true,
    }),
  ).toBeVisible();
});

test("PL-12: дочерний раздел сохраняется и доступен редактору", async ({
  page,
}) => {
  await page.goto("./?page=structure&role=portal-admin");
  await page
    .getByRole("button", { name: "Добавить подраздел: Установка", exact: true })
    .click();
  await expect(
    page.getByLabel("Родительский раздел", { exact: true }),
  ).toHaveValue("installation");
  await page.getByLabel("Название раздела").fill("Демо 1609");
  await page.getByRole("button", { name: "Создать", exact: true }).click();
  await page.reload();
  await expect(page.getByText("Демо 1609", { exact: true })).toBeVisible();
  await page.goto(
    "./?page=editor&role=support-engineer&resource=network-license",
  );
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expect(page.getByLabel(/Демо 1609/)).toBeVisible();
});

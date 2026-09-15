import { companyFields } from "../src/data/platform-data";
import { expect, test } from "@playwright/test";

const roles = ["portal-admin", "support-engineer", "manager", "client-admin", "client-employee"];

test("DEMO-01: обязательные показанные поля, отчество необязательно, старые настройки сохранены", async ({ page }) => {
  await page.goto("./?page=register");
  const savedFields = companyFields.map((field) => ({ ...field, required: false, registration: field.id === "phone" || field.registration }));
  await page.evaluate((fields) => localStorage.setItem("maxsoft-prototype-company-fields", JSON.stringify(fields)), savedFields);
  await page.reload();
  await expect(page.locator('[name="company-phone"]')).toHaveCount(0);
  const fields = page.locator('form input:not([name="middleName"])');
  for (const field of await fields.all()) await expect(field).toHaveJSProperty("required", true);
  await expect(page.getByLabel("Отчество", { exact: true })).toHaveJSProperty("required", false);
  await expect(page.getByLabel("Полное наименование компании", { exact: true })).toBeVisible();
  await page.getByLabel("Должность", { exact: true }).fill("Инженер");
  await page.getByLabel("Отдел", { exact: true }).fill("Проектирование");
  await page.getByLabel("Контактный телефон", { exact: true }).fill("");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Контактный телефон", { exact: true }).fill("+7 999 000 00 00");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

for (const role of roles) test(`DEMO-02: одно меню и один глобальный поиск — ${role}`, async ({ page }) => {
  await page.goto(`./?page=home&role=${role}`);
  await expect(page.getByRole("region", { name: "Доступные разделы" })).toHaveCount(0);
  const desktop = await page.getByTestId("desktop-navigation").isVisible();
  const searchLinks = page.locator('header a[href*="page=search"]:visible');
  const searchButton = page.getByRole("button", { name: "Открыть поиск", exact: true });
  expect(await searchLinks.count() + await searchButton.count()).toBe(1);
  if (!desktop) {
    await page.getByRole("button", { name: "Открыть меню", exact: true }).click();
    await expect(page.getByRole("dialog").getByRole("link", { name: "Поиск", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Закрыть меню", exact: true }).click();
  }
  await page.getByRole("button", { name: /Настройка сетевой лицензии/ }).click();
  await expect(page.getByRole("heading", { name: "Настройка сетевой лицензии", exact: true })).toBeVisible();
});

test("DEMO-13: клиентские подписи сохраняют записываемую роль", async ({ page }) => {
  await page.goto("./?page=client-users&role=client-admin");
  await page.getByRole("button", { name: "Добавить сотрудника", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Имя", { exact: true }).fill("Тест");
  await dialog.getByLabel("Фамилия", { exact: true }).fill("Сотрудник");
  await dialog.getByLabel("Корпоративная почта").fill("interface@example.test");
  await dialog.getByLabel("Должность", { exact: true }).fill("Инженер");
  const roleField = dialog.locator('select[name="role"]');
  await expect(dialog.getByText("Роль", { exact: true })).toBeVisible();
  await expect(roleField.locator("option")).toHaveText(["Сотрудник", "Администратор"]);
  await dialog.getByRole("button", { name: "Открыть варианты. Выбрано: Сотрудник", exact: true }).click();
  await dialog.getByRole("option", { name: "Администратор", exact: true }).click();
  await dialog.getByRole("button", { name: "Отправить приглашение" }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("maxsoft-prototype-users")!).at(-1).role)).toBe("Администратор клиента");
});

for (const route of ["login", "register"]) test(`DEMO-01: глазок внутри поля и переключение пароля — ${route}`, async ({ page }) => {
  await page.goto(`./?page=${route}`);
  const input = page.getByLabel("Пароль", { exact: true });
  const toggle = page.getByRole("button", { name: "Показать пароль", exact: true }).first();
  await input.fill("ОченьДлинныйПарольДляПроверки".repeat(4));
  await expect(input).toHaveAttribute("type", "password");
  const box = (await input.boundingBox())!;
  const button = (await toggle.boundingBox())!;
  expect(Math.abs(box.y + box.height / 2 - button.y - button.height / 2)).toBeLessThan(1);
  expect(button.x + button.width).toBeLessThanOrEqual(box.x + box.width);
  await toggle.click();
  await expect(input).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Скрыть пароль", exact: true }).first().click();
  await expect(input).toHaveAttribute("type", "password");
});

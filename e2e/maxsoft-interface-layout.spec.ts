import { expect, test, type Page } from "@playwright/test";
import { companies, companyFields, users } from "../src/data/platform-data";

const longText = "ОченьДлинноеНазваниеБезПробелов".repeat(8);
const noOverflow = async (page: Page) => {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
};
const closeOverlay = async (page: Page) => {
  await page.getByRole("dialog").getByRole("button", { name: "Закрыть", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
};
for (const width of [390, 768, 1024, 1440]) test(`DEMO-08: длинные поля и оверлеи — ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./?page=register");
  await page.getByLabel("Полное наименование компании", { exact: true }).fill(longText);
  await page.getByLabel("Контактный телефон", { exact: true }).fill("+7".repeat(90));
  await noOverflow(page);
  await page.getByRole("button", { name: "Создать аккаунт" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Создать аккаунт" })).toBeInViewport();

  const longCompanies = companies.map((company) => company.id === "severprom" ? { ...company, name: longText, project: longText, legalAddress: longText } : company);
  const companyName = companies.find((company) => company.id === "severprom")!.name;
  const longUsers = users.map((user) => user.company === companyName ? { ...user, company: longText, name: longText, email: `${"a".repeat(140)}@example.test` } : user);
  await page.evaluate(({ longCompanies, longUsers }) => {
    localStorage.setItem("maxsoft-prototype-companies", JSON.stringify(longCompanies));
    localStorage.setItem("maxsoft-prototype-users", JSON.stringify(longUsers));
  }, { longCompanies, longUsers });
  await page.goto("./?page=client-users&role=client-admin");
  await noOverflow(page);
  await page.getByRole("button", { name: "Добавить сотрудника", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Имя", { exact: true }).fill(longText);
  await dialog.getByLabel("Телефон", { exact: true }).fill(longText);
  await dialog.getByRole("button", { name: "Открыть варианты. Выбрано: Сотрудник", exact: true }).click();
  const option = page.getByRole("option", { name: "Администратор", exact: true });
  await expect(option).toBeInViewport();
  await option.click();
  await dialog.getByRole("button", { name: "Отправить приглашение" }).scrollIntoViewIfNeeded();
  await expect(dialog.getByRole("button", { name: "Отправить приглашение" })).toBeInViewport();
  await noOverflow(page);
  await closeOverlay(page);
  await page.getByRole("button", { name: "Добавить сотрудника", exact: true }).click();
  await closeOverlay(page);

  await page.goto("./?page=companies&role=manager");
  await noOverflow(page);
  await page.getByRole("button", { name: "Добавить компанию", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Полное наименование", { exact: true }).fill(longText);
  await noOverflow(page);
  await closeOverlay(page);
  await page.goto("./?page=company&role=manager&resource=severprom");
  await noOverflow(page);
  await page.getByRole("button", { name: "Редактировать", exact: true }).click();
  await noOverflow(page);
  await closeOverlay(page);

  await page.evaluate((fields) => localStorage.setItem("maxsoft-prototype-company-fields", JSON.stringify(fields.map((field) => ({ ...field, label: field.label + " — " + "ДлинноеПоле".repeat(10) })))), companyFields);
  await page.goto("./?page=fields&role=portal-admin");
  await noOverflow(page);
  await page.getByRole("button", { name: "Сохранить настройки" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Сохранить настройки" })).toBeInViewport();
  await page.goto("./?page=search&role=client-employee");
  await page.getByRole("textbox", { name: "Поиск по базе знаний" }).fill(longText);
  await noOverflow(page);
});

test("DEMO-08: меню действий нижней строки не обрезано таблицей", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 700 });
  await page.goto("./?page=users&role=portal-admin");
  const trigger = page.locator('.ms-table-scroll button[aria-haspopup="menu"]').last();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  const action = menu.getByRole("menuitem", { name: "Отозвать доступ", exact: true });
  await expect(action).toBeInViewport({ ratio: 1 });
  const reachable = await action.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
  });
  expect(reachable).toBe(true);
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

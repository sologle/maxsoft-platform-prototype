import { test, expect } from "@playwright/test";
import { companies } from "../src/data/platform-data";

test("регистрация в существующей компании не меняет её реквизиты", async ({ page }) => {
  await page.goto("./?page=register&role=guest");
  await page.getByLabel("Корпоративная почта").fill("new.person@severprom.ru");
  await page.getByLabel("Должность", { exact: true }).fill("Инженер");
  await page.getByLabel("Отдел", { exact: true }).fill("Проектирование");
  await page.getByLabel("Личный контактный телефон").fill("+7 999 000-16-09");
  await page.getByRole("button", { name: "Создать аккаунт", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Компания найдена");
  const state = await page.evaluate(() => ({
    companies: JSON.parse(localStorage.getItem("maxsoft-prototype-companies")!),
    users: JSON.parse(localStorage.getItem("maxsoft-prototype-users")!),
  }));
  const original = companies.find((c) => c.id === "severprom")!;
  expect(state.companies.find((c: { id: string }) => c.id === original.id)).toEqual({
    ...original,
    users: original.users + 1,
  });
  expect(state.users.at(-1)).toMatchObject({
    department: "Проектирование",
    position: "Инженер",
    phone: "+7 999 000-16-09",
  });
});

test("локальный фильтр переносится в полный поиск и возвращается без потери текста", async ({
  page,
}) => {
  await page.goto("./?page=knowledge&role=client-employee");
  await page.getByRole("textbox", { name: "Фильтр материалов" }).fill("адрес сервера");
  await page.getByRole("button", { name: "Поиск по тексту статей и файлов", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Поиск по базе знаний" })).toHaveValue(
    "адрес сервера",
  );
  await expect(
    page.getByRole("button", { name: "Открыть материал: Настройка сетевой лицензии" }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("textbox", { name: "Фильтр материалов" })).toHaveValue(
    "адрес сервера",
  );
  await page.getByRole("button", { name: "Очистить фильтр материалов", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Фильтр материалов" })).toHaveValue("");
});

test("видеостатья использует масштаб и выход чтения в обоих режимах", async ({ page }, info) => {
  await page.goto("./?page=video&role=client-employee&resource=cad-integration");
  await page.getByRole("button", { name: "Развернуть содержание статьи" }).click();
  const initial = await page
    .locator("article h1")
    .evaluate((n) => parseFloat(getComputedStyle(n).fontSize));
  for (const mode of ["standard", "fullscreen"]) {
    if (mode === "fullscreen")
      await page.getByRole("button", { name: "На весь экран", exact: true }).click();
    await page.getByRole("button", { name: "Сбросить размер текста до 100%" }).click();
    for (let i = 0; i < 4; i++)
      await page.getByRole("button", { name: "Увеличить размер текста" }).click();
    expect(
      await page.locator("article h1").evaluate((n) => parseFloat(getComputedStyle(n).fontSize)),
    ).toBeCloseTo(initial * 1.4, 0);
    await page.screenshot({
      path: `/tmp/demo-video-${info.project.name}-${mode}.png`,
      animations: "disabled",
    });
  }
  await page.getByRole("button", { name: "Свернуть содержание статьи" }).click();
  await page.getByRole("button", { name: "Выйти из полноэкранного режима" }).click();
  await expect(page.locator(".reading-layout")).toHaveAttribute("data-reading-mode", "standard");
});

import { expect, test } from "@playwright/test";

for (const name of ["инструкция_активации.pdf", "регламент_обновления.docx"]) {
  test(`предпросмотр поддерживает ${name}`, async ({ page }) => {
    await page.goto("./?page=files&role=portal-admin");
    await page.getByRole("button", { name: `Просмотреть файл: ${name}`, exact: true }).click();
    await expect(page.getByTestId("file-preview-document")).toBeVisible();
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  });
}

for (const name of ["схема_подключения.dwg", "дистрибутив_модуля.zip"]) {
  test(`${name} скачивается без предпросмотра`, async ({ page }) => {
    await page.goto("./?page=files&role=portal-admin");
    await expect(page.getByRole("button", { name: `Просмотреть файл: ${name}`, exact: true })).toHaveCount(0);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: `Скачать файл: ${name}`, exact: true }).click();
    await download;
    await expect(page).toHaveURL(/page=files/);
    await page.getByRole("button", { name: "Табличный вид", exact: true }).click();
    await page.getByRole("button", { name: `Действия: ${name}`, exact: true }).click();
    await expect(page.getByRole("menuitem", { name: "Просмотреть", exact: true })).toHaveCount(0);
    await expect(page.getByRole("menuitem", { name: "Скачать", exact: true })).toBeVisible();
    await page.goto(`./?page=file-preview&role=portal-admin&resource=${encodeURIComponent(name)}`);
    await expect(page.getByTestId("file-preview-document")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Скачать файл", exact: true })).toBeVisible();
  });
}

import { expect, test } from "@playwright/test";

test("сравнение фонов сохраняет форму входа и выбранный вариант при навигации", async ({ page }) => {
  await page.goto("./?page=login&role=guest&background=minimal");
  const email = page.getByLabel("Электронная почта");
  await email.fill("preview@maxsoft.ru");
  for (const [name, value] of [["Поток", "flow"], ["Призма", "prism"], ["Орбита", "orbit"], ["Тишина", "minimal"]]) {
    const button = page.getByRole("button", { name: new RegExp(name) });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("portal-auth-backdrop")).toHaveAttribute("data-background", value);
    await expect(email).toHaveValue("preview@maxsoft.ru");
    await expect(page).toHaveURL(new RegExp(`background=${value}`));
  }
  await page.getByRole("button", { name: /Призма/ }).click();
  await page.getByRole("button", { name: "Не помню пароль" }).click();
  await expect(page.getByTestId("portal-auth-backdrop")).toHaveAttribute("data-background", "prism");
  await page.getByRole("button", { name: "Вернуться ко входу" }).click();
  await expect(page.getByRole("button", { name: /Призма/ })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByTestId("portal-auth-backdrop")).toHaveAttribute("data-background", "prism");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL(/role=client-employee/);
  await expect(page).not.toHaveURL(/background=/);
  await expect(page.getByRole("group", { name: "Варианты фона" })).toHaveCount(0);
});

test("обычный вход не показывает панель сравнения", async ({ page }) => {
  await page.goto("./?page=login&role=guest");
  await expect(page.getByRole("group", { name: "Варианты фона" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Войти", exact: true })).toBeVisible();
});


test("фоны учитывают системное ограничение движения", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./?page=login&role=guest&background=orbit");
  for (const name of ["Орбита", "Призма", "Поток", "Тишина"]) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await expect.poll(() => page.getByTestId("portal-auth-backdrop").evaluate((element) =>
      element.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length,
    )).toBe(0);
  }
});

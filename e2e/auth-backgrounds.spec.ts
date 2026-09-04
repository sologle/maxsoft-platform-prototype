import { expect, test } from "@playwright/test";

test("сравнение фонов сохраняет форму входа и выбранный вариант при навигации", async ({ page }) => {
  await page.goto("./?page=login&role=guest&background=minimal");
  const email = page.getByLabel("Электронная почта");
  await email.fill("preview@maxsoft.ru");
  for (const [name, value] of [["Живое", "living-field"], ["Поле", "field"], ["Рой", "swarm"], ["Сигнал", "signal"], ["Тишина", "minimal"]]) {
    const button = page.getByRole("button", { name: new RegExp(name) });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("portal-auth-backdrop")).toHaveAttribute("data-background", value);
    await expect(email).toHaveValue("preview@maxsoft.ru");
    await expect(page).toHaveURL(new RegExp(`background=${value}`));
  }
  await page.getByRole("button", { name: /Рой/ }).click();
  await page.getByRole("button", { name: "Не помню пароль" }).click();
  await expect(page.getByTestId("portal-auth-backdrop")).toHaveAttribute("data-background", "swarm");
  await page.getByRole("button", { name: "Вернуться ко входу" }).click();
  await expect(page.getByRole("button", { name: /Рой/ })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByTestId("portal-auth-backdrop")).toHaveAttribute("data-background", "swarm");
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
  await page.goto("./?page=login&role=guest&background=signal");
  for (const name of ["Сигнал", "Рой", "Поле", "Живое", "Тишина"]) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await expect.poll(() => page.getByTestId("portal-auth-backdrop").evaluate((element) =>
      element.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length,
    )).toBe(0);
    const canvas = page.getByTestId("auth-reactive-canvas");
    if (name !== "Тишина") {
      const pixels = () => canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
      const before = await pixels();
      await page.mouse.move(160, 180);
      await page.waitForTimeout(150);
      expect(await pixels()).toBe(before);
    }
  }
});


test("поле деформируется у курсора, сохраняя дальние элементы неподвижными", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("./?page=login&role=guest&background=field");
  const canvas = page.getByTestId("auth-reactive-canvas");
  await expect(canvas).toBeVisible();
  await page.mouse.move(720, 500);
  const pixels = () => canvas.evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const context = canvas.getContext("2d")!;
    const ratio = canvas.width / canvas.clientWidth;
    const sample = (x: number, y: number) => Array.from(context.getImageData(x * ratio, y * ratio, 70 * ratio, 70 * ratio).data);
    return { near: sample(145, 165), far: sample(1290, 135) };
  });
  const before = await pixels();
  await page.mouse.move(180, 200);
  await expect.poll(async () => (await pixels()).near).not.toEqual(before.near);
  expect((await pixels()).far).toEqual(before.far);
});


test("живое поле вращается без указателя и доступно рядом с исходным полем", async ({ page }) => {
  await page.goto("./?page=login&role=guest&background=field");
  const canvas = page.getByTestId("auth-reactive-canvas");
  const pixels = () => canvas.evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const ratio = canvas.width / canvas.clientWidth;
    return Array.from(canvas.getContext("2d")!.getImageData(20 * ratio, 140 * ratio, 70 * ratio, 70 * ratio).data);
  });
  const original = await pixels();
  await page.waitForTimeout(200);
  expect(await pixels()).toEqual(original);
  await page.getByRole("button", { name: /Живое/ }).click();
  await expect(page.getByTestId("portal-auth-backdrop")).toHaveAttribute("data-background", "living-field");
  await page.mouse.move(-1, -1);
  const before = await pixels();
  await expect.poll(pixels).not.toEqual(before);
  await page.getByRole("button", { name: /Поле/ }).click();
  await expect(page.getByTestId("portal-auth-backdrop")).toHaveAttribute("data-background", "field");
});

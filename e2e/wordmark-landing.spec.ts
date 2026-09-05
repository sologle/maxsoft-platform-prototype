import { expect, test } from "@playwright/test";

test("главная MaxSoft оставляет две кнопки и открывает формы на выбранном фоне", async ({ page }) => {
  await page.goto("./");
  const landing = page.getByTestId("wordmark-landing");
  await expect(landing).toBeVisible();
  await expect(landing.getByRole("button")).toHaveCount(2);
  await expect(page.locator(".portal-auth-glass")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Варианты фона" })).toHaveCount(0);
  await landing.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page.getByLabel("Электронная почта")).toBeVisible();
  await expect(page).toHaveURL(/page=login/);
  await expect(page.getByTestId("portal-auth-backdrop")).toHaveAttribute("data-background", "wordmark");
  await page.getByRole("button", { name: "Вернуться на главную" }).click();
  await expect(landing).toBeVisible();
  await landing.getByRole("button", { name: "Регистрация", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Регистрация в портале" })).toBeVisible();
  await expect(page.getByTestId("portal-auth-backdrop")).toHaveAttribute("data-background", "wordmark");
  await page.getByRole("button", { name: "Уже есть аккаунт" }).click();
  await page.getByRole("button", { name: "Вернуться на главную" }).click();
  await page.goto("./?page=landing&role=guest&backgroundArchive=1&background=living-field");
  await expect(landing).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Портал MaxSoft" })).toBeVisible();
  await expect(page.locator(".portal-auth-glass")).toBeVisible();
  await page.getByRole("button", { name: /06.*MaxSoft/ }).click();
  await expect(landing).toBeVisible();
  await page.reload();
  await expect(landing.getByRole("button")).toHaveCount(2);
});

test("MaxSoft собирается на главной, а за формами штрихи остаются распределены по фону", async ({ page }) => {
  test.slow();
  await page.clock.install();
  const concentration = () => page.getByTestId("auth-reactive-canvas").evaluate((element) => {
    const sample = document.createElement("canvas");
    sample.width = (element as HTMLCanvasElement).width;
    sample.height = (element as HTMLCanvasElement).height;
    const context = sample.getContext("2d")!;
    context.drawImage(element as HTMLCanvasElement, 0, 0);
    const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
    const rows = Array<number>(sample.height).fill(0);
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] < 245 && pixels[i + 2] - pixels[i] > 5) rows[Math.floor(i / 4 / sample.width)] += 1;
    }
    const total = rows.reduce((sum, count) => sum + count, 0);
    const bandHeight = Math.floor(sample.height / 4);
    let band = rows.slice(0, bandHeight).reduce((sum, count) => sum + count, 0);
    let strongestBand = band;
    for (let row = bandHeight; row < rows.length; row += 1) {
      band += rows[row] - rows[row - bandHeight];
      strongestBand = Math.max(strongestBand, band);
    }
    return { total, share: strongestBand / total };
  });
  await page.goto("./?page=landing&role=guest&background=wordmark");
  await page.clock.runFor(1400);
  expect((await concentration()).share).toBeGreaterThan(0.65);
  await page.getByTestId("wordmark-landing").getByRole("button", { name: "Войти", exact: true }).click();
  await page.mouse.move(-1, -1);
  await page.clock.runFor(10000);
  const login = await concentration();
  expect(login.total).toBeGreaterThan(100);
  expect(login.share).toBeLessThan(0.5);
  for (const form of ["register", "recover"]) {
    await page.goto(`./?page=${form}&role=guest&background=wordmark`);
    await page.clock.runFor(10000);
    const field = await concentration();
    expect(field.total).toBeGreaterThan(100);
    expect(field.share).toBeLessThan(0.5);
  }
});

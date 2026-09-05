import { expect, test, type Page } from "@playwright/test";

test("сравнение фонов сохраняет форму входа и выбранный вариант при навигации", async ({ page }) => {
  await page.goto("./?page=login&role=guest&backgroundArchive=1&background=minimal");
  await expect(page.getByRole("group", { name: "Варианты фона" }).getByRole("button")).toHaveCount(6);
  await expect(page.getByRole("button", { name: /Поле|Рой|Сигнал/ })).toHaveCount(0);
  const email = page.getByLabel("Электронная почта");
  await email.fill("preview@maxsoft.ru");
  for (const [name, value] of [["MaxSoft", "wordmark"], ["Живое", "living-field"], ["Эхо", "echo"], ["Шёлк", "silk"], ["След", "ribbon"], ["Тишина", "minimal"]]) {
    const button = page.getByRole("button", { name: new RegExp(name) });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("portal-auth-backdrop")).toHaveAttribute("data-background", value);
    await expect(email).toHaveValue("preview@maxsoft.ru");
    await expect(page).toHaveURL(new RegExp(`background=${value}`));
  }
  await page.getByRole("button", { name: /След/ }).click();
  await page.getByRole("button", { name: "Не помню пароль" }).click();
  await expect(page.getByTestId("portal-auth-backdrop")).toHaveAttribute("data-background", "ribbon");
  await page.getByRole("button", { name: "Вернуться ко входу" }).click();
  await expect(page.getByRole("button", { name: /След/ })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByTestId("portal-auth-backdrop")).toHaveAttribute("data-background", "ribbon");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL(/role=client-employee/);
  await expect(page).not.toHaveURL(/background=/);
  await expect(page).not.toHaveURL(/backgroundArchive=/);
  await expect(page.getByRole("group", { name: "Варианты фона" })).toHaveCount(0);
});

test("обычный вход не показывает панель сравнения", async ({ page }) => {
  await page.goto("./?page=login&role=guest");
  await expect(page.getByRole("group", { name: "Варианты фона" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Войти", exact: true })).toBeVisible();
  await expect(page.getByTestId("portal-auth-backdrop")).toHaveAttribute("data-background", "wordmark");
  await page.goto("./?page=login&role=guest&background=minimal");
  await expect(page.getByRole("group", { name: "Варианты фона" })).toHaveCount(0);
  await expect(page.getByTestId("portal-auth-backdrop")).toHaveAttribute("data-background", "wordmark");
});


test("фоны учитывают системное ограничение движения", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./?page=login&role=guest&backgroundArchive=1&background=echo");
  for (const name of ["Эхо", "Шёлк", "След", "Живое", "MaxSoft", "Тишина"]) {
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


test("живое поле продолжает вращаться без указателя", async ({ page }) => {
  await page.goto("./?page=login&role=guest&backgroundArchive=1&background=living-field");
  await expect(page.getByTestId("auth-reactive-canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: /05.*Живое/ })).toHaveAttribute("aria-pressed", "true");
  const before = await scenePixels(page);
  await expect.poll(() => scenePixels(page)).not.toEqual(before);
});

const scenePixels = (page: Page) => page.getByTestId("auth-reactive-canvas").evaluate((element) => {
  const sample = document.createElement("canvas");
  sample.width = 192;
  sample.height = 128;
  sample.getContext("2d")!.drawImage(element as HTMLCanvasElement, 0, 0, sample.width, sample.height);
  return sample.toDataURL();
});

for (const [variant, label] of [["echo", "Эхо"], ["silk", "Шёлк"], ["ribbon", "След"], ["wordmark", "MaxSoft"]]) {
  test(`${variant}: мышь меняет рисунок независимо от фонового движения`, async ({ page, browser, baseURL }) => {
    const settings = test.info().project.use;
    const control = await browser.newPage({
      viewport: page.viewportSize()!, deviceScaleFactor: settings.deviceScaleFactor,
      isMobile: settings.isMobile, hasTouch: settings.hasTouch,
    });
    try {
      for (const target of [page, control]) {
        await target.goto(new URL("?page=login&role=guest&backgroundArchive=1&background=minimal", baseURL).href);
        await target.clock.install({ time: 0 });
        await target.clock.pauseAt(1000);
        // Align creation to a virtual frame boundary; installation has a different performance.now origin per page.
        await target.clock.runFor(16 - (await target.evaluate(() => performance.now()) % 16));
        await target.getByRole("button", { name: new RegExp(label) }).evaluate((button: HTMLButtonElement) => button.click());
        await expect(target.getByTestId("auth-reactive-canvas")).toBeVisible();
        // Let the initial ResizeObserver notification settle while virtual time is paused.
        await target.waitForTimeout(100);
        await target.clock.runFor(64);
      }
      expect(await scenePixels(page) === await scenePixels(control), "Начальные кадры двух сцен совпадают").toBe(true);
      const viewport = page.viewportSize()!;
      await page.mouse.move(variant === "wordmark" ? viewport.width / 2 : 110, variant === "wordmark" ? viewport.height / 2 : 190);
      await page.clock.runFor(1200);
      await control.clock.runFor(1200);
      // Remove the pointer halo: the wave, deformation or trail must persist in the scene itself.
      await page.mouse.move(-1, -1);
      await page.clock.runFor(160);
      await control.clock.runFor(160);
      expect(await scenePixels(page) === await scenePixels(control), "Указатель изменил кадр относительно контрольной сцены").toBe(false);
    } finally {
      await control.close();
    }
  });
}

test("След сохраняет ленты после изменения размера окна", async ({ page }) => {
  await page.goto("./?page=login&role=guest&backgroundArchive=1&background=minimal");
  await expect(page.locator(".portal-auth-grid")).toBeVisible();
  await expect(page.getByRole("group", { name: "Варианты фона" })).toBeVisible();
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.getByRole("button", { name: /След/ }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByTestId("auth-reactive-canvas")).toBeVisible();
  await page.waitForTimeout(100);
  await page.clock.runFor(4000);
  const viewport = page.viewportSize()!;
  await page.setViewportSize({ width: viewport.width - 20, height: viewport.height - 20 });
  await page.waitForTimeout(150);
  const inkColumns = () => page.getByTestId("auth-reactive-canvas").evaluate((element) => {
    const sample = document.createElement("canvas");
    sample.width = 192;
    sample.height = 128;
    const context = sample.getContext("2d")!;
    context.drawImage(element as HTMLCanvasElement, 0, 0, 192, 128);
    const pixels = context.getImageData(0, 0, 192, 128).data;
    const columns = new Set<number>();
    for (let pixel = 0; pixel < pixels.length; pixel += 4) {
      if (pixels[pixel] < 248 && pixels[pixel + 2] - pixels[pixel] > 4) columns.add((pixel / 4) % 192);
    }
    return columns.size;
  });
  // Full ribbons occupy many columns; isolated heads and their soft halos do not.
  await expect.poll(inkColumns).toBeGreaterThan(40);
});

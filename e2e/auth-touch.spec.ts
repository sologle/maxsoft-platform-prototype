import { expect, test, type CDPSession, type Page } from "@playwright/test";

test.use({ hasTouch: true });

const touch = (session: CDPSession, type: "touchStart" | "touchMove" | "touchEnd" | "touchCancel", x = 0, y = 0) =>
  session.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" || type === "touchCancel" ? [] : [{ x, y, id: 1 }] });

const swipe = async (session: CDPSession, from: { x: number; y: number }, to: { x: number; y: number }) => {
  await touch(session, "touchStart", from.x, from.y);
  for (let step = 1; step <= 12; step += 1) {
    await touch(session, "touchMove", from.x + (to.x - from.x) * step / 12, from.y + (to.y - from.y) * step / 12);
  }
};

const centerInk = (page: Page) => page.getByTestId("auth-reactive-canvas").evaluate((element) => {
  const canvas = element as HTMLCanvasElement;
  const bounds = canvas.getBoundingClientRect();
  const scale = canvas.width / bounds.width;
  const size = Math.round(48 * scale);
  const pixels = canvas.getContext("2d")!.getImageData((canvas.width - size) / 2, (canvas.height - size) / 2, size, size).data;
  let total = 0;
  for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 205 && pixels[i + 2] - pixels[i] > 15) total += 1;
  return total;
});

for (const variant of ["wordmark", "scatter"]) {
  test(`${variant}: движение пальцем действует на надпись, отпускание и отмена возвращают её`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(`./?page=landing&role=guest&backgroundArchive=1&background=${variant}`);
    await expect(page.getByTestId("auth-reactive-canvas")).toBeVisible();
    await page.getByRole("button", { name: /01.*Тишина/ }).click();
    await expect(page.locator(".portal-auth-grid")).toBeVisible();
    await page.clock.install({ time: 0 });
    await page.clock.pauseAt(1000);
    await page.getByRole("button", { name: variant === "scatter" ? /07.*Разлёт/ : /06.*MaxSoft/ }).evaluate((button: HTMLButtonElement) => button.click());
    await expect(page.getByTestId("auth-reactive-canvas")).toBeVisible();
    await page.waitForTimeout(100);
    await page.clock.runFor(1600);
    const rest = await centerInk(page);
    expect(rest).toBeGreaterThan(20);
    const session = await page.context().newCDPSession(page);
    try {
      const { width, height } = page.viewportSize()!;
      await page.evaluate(() => {
        document.querySelector(".auth-wordmark-landing")!.addEventListener("pointercancel", () => { document.documentElement.dataset.touchCancelled = "true"; });
      });
      for (const ending of ["touchEnd", "touchCancel"] as const) {
        await swipe(session, { x: width / 2 - 60, y: height / 2 }, { x: width / 2, y: height / 2 });
        // This uses the browser's native gesture recognition, not synthetic PointerEvents.
        await expect(page.locator("html")).not.toHaveAttribute("data-touch-cancelled", "true");
        await page.clock.runFor(2500);
        expect(await centerInk(page)).toBeLessThan(rest * 0.5);
        await touch(session, ending);
        await page.clock.runFor(5000);
        expect(await centerInk(page)).toBeGreaterThan(rest * 0.7);
      }
    } finally {
      if (!page.isClosed()) await session.detach();
    }
  });
}

test("сенсорная прокрутка настроек и регистрации остаётся доступна", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Вертикальная прокрутка нужна на узком экране");
  await page.goto("./?page=landing&role=guest&backgroundArchive=1&background=scatter");
  await page.getByRole("button", { name: "Настроить разлёт", exact: true }).tap();
  const panel = page.getByRole("region", { name: "Настройки разлёта" });
  const bounds = (await panel.boundingBox())!;
  const session = await page.context().newCDPSession(page);
  try {
    await test.step("Прокрутить панель пальцем и дождаться остановки", async () => {
      await panel.evaluate((element) => {
        element.addEventListener("scrollend", () => { element.setAttribute("data-scroll-ended", "true"); }, { once: true });
      });
      await swipe(session, { x: bounds.x + 12, y: bounds.y + bounds.height - 45 }, { x: bounds.x + 12, y: bounds.y + 85 });
      await touch(session, "touchEnd");
      await expect.poll(() => panel.evaluate((element) => element.scrollTop)).toBeGreaterThan(50);
      // During momentum scrolling, the first tap can stop scrolling instead of activating a button.
      await expect(panel).toHaveAttribute("data-scroll-ended", "true");
    });
    await test.step("Открыть регистрацию касанием", async () => {
      await page.getByRole("button", { name: "Свернуть настройки" }).tap();
      await expect(panel).toBeHidden();
      await page.getByTestId("wordmark-landing").getByRole("button", { name: "Регистрация", exact: true }).tap();
      await expect(page).toHaveURL(/page=register/);
      await expect(page.getByLabel("Корпоративная почта", { exact: true })).toBeVisible();
    });
    await test.step("Прокрутить регистрацию пальцем", async () => {
      await swipe(session, { x: 8, y: 700 }, { x: 8, y: 180 });
      await touch(session, "touchEnd");
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(50);
    });
  } finally {
    if (!page.isClosed()) await session.detach();
  }
});

import { expect, test, type Page } from "@playwright/test";

const experimentUrl = "./?page=landing&role=guest&backgroundArchive=1&background=scatter";

const ink = (page: Page, band?: { top: number; bottom: number }) =>
  page.getByTestId("auth-reactive-canvas").evaluate((element, bounds) => {
    const canvas = element as HTMLCanvasElement;
    const context = canvas.getContext("2d")!;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let total = 0;
    let outside = 0;
    let top = canvas.height;
    let bottom = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      // Only the solid word fragments, excluding the pale ambient field and halo.
      if (pixels[i] >= 205 || pixels[i + 2] - pixels[i] <= 15) continue;
      const y = Math.floor(i / 4 / canvas.width);
      total += 1;
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      if (bounds && (y < bounds.top || y > bounds.bottom)) outside += 1;
    }
    return { total, top, bottom, outsideShare: outside / total };
  }, band);

const orbitInk = (page: Page) => page.getByTestId("auth-reactive-canvas").evaluate((element) => {
  const canvas = element as HTMLCanvasElement;
  const bounds = canvas.getBoundingClientRect();
  const pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
  const scale = canvas.width / bounds.width;
  let inner = 0;
  let ring = 0;
  let total = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] >= 205 || pixels[i + 2] - pixels[i] <= 15) continue;
    const x = (i / 4 % canvas.width) / scale;
    const y = Math.floor(i / 4 / canvas.width) / (canvas.height / bounds.height);
    const distance = Math.hypot(x - bounds.width / 2, y - bounds.height / 2);
    if (distance > 60 * 1.4) continue;
    total += 1;
    if (distance < 60 * 0.55) inner += 1;
    if (distance > 60 * 0.8 && distance < 60 * 1.2) ring += 1;
  }
  return { total, innerShare: inner / total, ringShare: ring / total };
});

const prepareScene = async (page: Page) => {
  await page.goto(experimentUrl);
  await expect(page.getByRole("button", { name: /07.*Разлёт/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("wordmark-landing")).toBeVisible();
  // Load the archive before freezing time, then mount the scene under the controlled clock.
  await page.getByRole("button", { name: /01.*Тишина/ }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator(".portal-auth-grid")).toBeVisible();
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.getByRole("button", { name: /07.*Разлёт/ }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByTestId("auth-reactive-canvas")).toBeVisible();
  await page.waitForTimeout(100);
};

const sweepWord = async (page: Page) => {
  const { width, height } = page.viewportSize()!;
  await page.mouse.move(width * 0.16, height / 2);
  await page.clock.runFor(16);
  for (let step = 1; step <= 18; step += 1) {
    await page.mouse.move(width * (0.16 + step / 18 * 0.68), height / 2);
    await page.clock.runFor(16);
  }
};

test("эксперимент удерживает штрихи на орбите, разбрасывает и возвращает после ухода курсора", async ({ page }) => {
  test.slow();
  await page.emulateMedia({ colorScheme: "light" });
  await prepareScene(page);
  await page.clock.runFor(1600);
  const rest = await ink(page);
  expect(rest.total).toBeGreaterThan(500);
  const margin = await page.evaluate(() => Math.min(devicePixelRatio, 2) * 8);
  const band = { top: rest.top - margin, bottom: rest.bottom + margin };
  const centerBefore = await orbitInk(page);
  const viewport = page.viewportSize()!;
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  await page.clock.runFor(5000);
  const held = await orbitInk(page);
  expect(held.total).toBeGreaterThan(100);
  expect(held.innerShare).toBeLessThan(centerBefore.innerShare * 0.2);
  expect(held.ringShare).toBeGreaterThan(0.45);
  await sweepWord(page);
  await page.clock.runFor(120);
  expect((await ink(page, band)).outsideShare).toBeGreaterThan(0.08);
  await page.mouse.move(-1, -1);
  await page.clock.runFor(6000);
  const returned = await ink(page, band);
  expect(returned.total).toBeGreaterThan(rest.total * 0.8);
  expect(returned.outsideShare).toBeLessThan(0.02);
  await page.getByTestId("wordmark-landing").getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL(/background=scatter/);
  await expect(page.getByLabel("Электронная почта")).toBeVisible();
  await expect(page.getByRole("button", { name: "Настроить разлёт", exact: true })).toHaveCount(0);
  await expect(page.getByTestId("portal-auth-backdrop")).toHaveAttribute("data-background", "scatter");
  await page.clock.runFor(10000);
  // Forms keep the large, pale ambient strokes, without a word or scatter effect.
  expect((await ink(page)).total).toBe(0);
  await page.clock.resume();
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("portal-auth-backdrop")).toHaveAttribute("data-background", "wordmark");
  await expect(page.getByRole("group", { name: "Варианты фона" })).toHaveCount(0);
});

test("эксперимент при reduced-motion показывает неподвижную надпись", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await prepareScene(page);
  const canvas = page.getByTestId("auth-reactive-canvas");
  const before = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  await sweepWord(page);
  await page.clock.runFor(6000);
  expect(await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL())).toBe(before);
});

test("настройки разлёта применяются сразу, копируются и сохраняются", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { value: {
      writeText: async (text: string) => { document.documentElement.dataset.copiedSettings = text; },
    } });
  });
  await prepareScene(page);
  await page.clock.runFor(1600);
  const rest = await ink(page);
  const band = { top: rest.top - 16, bottom: rest.bottom + 16 };
  await page.getByRole("button", { name: "Настроить разлёт", exact: true }).click();
  const panel = page.getByRole("region", { name: "Настройки разлёта" });
  await expect(page.getByRole("button", { name: "Свернуть настройки" })).toBeFocused();
  await expect(panel.getByRole("slider")).toHaveCount(9);
  const preset = [
    ["Сила разлёта", "0.2"], ["Область разлёта", "0.65"], ["Тяга обратно", "20"],
    ["Торможение", "6.3"], ["Кручение палочек", "1"], ["Длина хвостика", "1"],
    ["Неравномерность разлёта", "1"], ["Расстояние от курсора", "60"], ["Удержание на круге", "0.7"],
  ];
  for (const [name, value] of preset) await expect(panel.getByRole("slider", { name, exact: true })).toHaveValue(value);
  const force = panel.getByRole("slider", { name: "Сила разлёта", exact: true });
  await panel.getByRole("slider", { name: "Удержание на круге", exact: true }).press("Home");
  await force.press("Home");
  await force.press("Escape");
  await expect(page.getByRole("button", { name: "Настроить разлёт", exact: true })).toBeFocused();
  await sweepWord(page);
  await page.clock.runFor(120);
  expect((await ink(page, band)).outsideShare).toBeLessThan(0.02);
  await page.getByRole("button", { name: "Настроить разлёт", exact: true }).click();
  await force.press("End");
  await panel.getByRole("slider", { name: "Область разлёта", exact: true }).press("ArrowRight");
  await page.getByRole("button", { name: "Скопировать настройки" }).click();
  await expect(panel.getByRole("status")).toHaveText("Настройки скопированы — отправь их в чат.");
  const copied = JSON.parse(await page.locator("html").getAttribute("data-copied-settings") as string);
  expect(copied).toMatchObject({ experiment: "maxsoft-scatter-v2", settings: { force: 2.5, radius: 0.7 } });
  await page.getByRole("button", { name: "Свернуть настройки" }).click();
  await sweepWord(page);
  await page.clock.runFor(120);
  expect((await ink(page, band)).outsideShare).toBeGreaterThan(0.08);
  // Let React finish lazy imports after navigation; only the physics section needs frozen time.
  await page.clock.resume();
  await page.reload();
  await page.getByRole("button", { name: "Настроить разлёт", exact: true }).click();
  await expect(force).toHaveValue("2.5");
  await expect(panel.getByRole("slider", { name: "Область разлёта", exact: true })).toHaveValue("0.7");
  await page.getByRole("button", { name: "Сбросить настройки" }).click();
  await expect(force).toHaveValue("0.2");
  await expect(panel.getByRole("slider", { name: "Удержание на круге", exact: true })).toHaveValue("0.7");
  await expect(panel.getByRole("slider", { name: "Область разлёта", exact: true })).toHaveValue("0.65");
  await page.goto("./");
  await expect(page.getByRole("button", { name: "Настроить разлёт", exact: true })).toHaveCount(0);
});

test("если браузер запрещает копирование, настройки можно скопировать вручную", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { value: {
      writeText: async () => { throw new DOMException("Clipboard denied", "NotAllowedError"); },
    } });
  });
  await page.goto(experimentUrl);
  await page.getByRole("button", { name: "Настроить разлёт", exact: true }).click();
  await page.getByRole("button", { name: "Скопировать настройки" }).click();
  await expect(page.getByRole("alert")).toContainText("Скопируй текст ниже вручную");
  const text = page.getByRole("textbox", { name: "Настройки для отправки" });
  await expect(text).toBeVisible();
  expect(JSON.parse(await text.inputValue())).toMatchObject({ experiment: "maxsoft-scatter-v2" });
});


test("ранее сохранённые параметры разлёта сохраняются при добавлении орбиты", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("maxsoft-scatter-settings-v1", JSON.stringify({
    force: 1.2, radius: 1.4, spring: 18, damping: 6, spin: 0.5, trail: 1.5, variation: 0.8,
  })));
  await page.goto(experimentUrl);
  await page.getByRole("button", { name: "Настроить разлёт", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Сила разлёта", exact: true })).toHaveValue("1.2");
  await expect(page.getByRole("slider", { name: "Область разлёта", exact: true })).toHaveValue("1.4");
  await expect(page.getByRole("slider", { name: "Расстояние от курсора", exact: true })).toHaveValue("60");
  await expect(page.getByRole("slider", { name: "Удержание на круге", exact: true })).toHaveValue("0.7");
});

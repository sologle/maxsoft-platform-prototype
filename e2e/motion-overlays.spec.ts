import { expect, test } from "@playwright/test";

for (const width of [320, 390, 768, 1024, 1440]) {
  for (const theme of ["light", "dark"]) {
    test(`POL-14: формы, фокус и границы ${width}px ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.addInitScript(
        (theme) => localStorage.setItem("maxsoft-color-theme", theme),
        theme,
      );
      await page.goto("./?page=tags&role=portal-admin");
      const trigger = page.getByRole("button", {
        name: "Новый тег",
        exact: true,
      });
      await trigger.click();
      const dialog = page.getByRole("dialog", {
        name: "Новый тег",
        exact: true,
      });
      await expect(dialog).toBeVisible();
      await expect(page.locator("#root")).toHaveAttribute("inert");
      const bounds = await dialog.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(801);
      await dialog
        .getByLabel("Название тега")
        .fill(
          "Очень длинное название нового тега для проверки раскрывающихся элементов",
        );
      await dialog.getByRole("button", { name: /Открыть варианты/ }).click();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator("#root")).not.toHaveAttribute("inert");
      await expect(trigger).toBeFocused();
      await expect(dialog).toBeHidden();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      await expect
        .poll(() => page.evaluate(() => document.body.style.overflow))
        .toBe("");
    });
  }
}

test("POL-14: быстрый повтор панели, немедленный inert, fade и смена маршрута", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./?page=home&role=portal-admin");
  await page.getByRole("button", { name: "Открыть меню" }).click();
  const panel = page.locator(".mobile-navigation");
  await expect(panel).toHaveCSS("opacity", "1");
  const exit = await page.evaluate(async () => {
    (
      document.querySelector('[aria-label="Закрыть меню"]') as HTMLElement
    ).click();
    await new Promise(requestAnimationFrame);
    return {
      inert: document.querySelector(".modal-surface")?.hasAttribute("inert"),
      locked: document.querySelector("#root")?.hasAttribute("inert"),
      transition: document.querySelector(".mobile-navigation")?.getAnimations()
        .length,
    };
  });
  expect(exit).toEqual({ inert: true, locked: false, transition: 1 });
  await page.evaluate(() =>
    (
      document.querySelector('[aria-label="Открыть меню"]') as HTMLElement
    ).click(),
  );
  await expect(panel).toHaveCSS("opacity", "1");
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "База знаний" })
    .click();
  await expect(page).toHaveURL(/page=knowledge/);
  await expect(page.locator(".modal-surface")).toHaveCount(0);
  await expect(page.locator("#root")).not.toHaveAttribute("inert");
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".modal-surface")).toHaveCount(0);
  await expect(page.locator("#root")).not.toHaveAttribute("inert");
});

test("POL-14: native popover сохраняет выход, закрытые options не принимают фокус", async ({
  page,
}) => {
  await page.goto("./?page=knowledge&role=portal-admin");
  const trigger = page.getByRole("button", {
    name: "Открыть варианты. Выбрано: По дате обновления · новые первыми",
  });
  await trigger.click();
  const menu = page.getByRole("listbox", { name: "Сортировка" });
  await expect(menu).toHaveCSS("opacity", "1");
  const id = await menu.getAttribute("id");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  const closed = page.locator(`[id="${id}"]`);
  await expect(closed).toHaveAttribute("inert");
  await closed
    .locator("button")
    .first()
    .evaluate((node: HTMLElement) => node.focus());
  await expect(trigger).toBeFocused();
  await expect(closed).toHaveCSS("display", "none");
  await trigger.click();
  await expect(menu).toHaveCSS("opacity", "1");
  await expect(page.locator("#root")).not.toHaveAttribute("inert");
});

test("POL-14: reduced motion удаляет модальную поверхность без ожидания", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./?page=tags&role=portal-admin");
  await page.getByRole("button", { name: "Новый тег", exact: true }).click();
  const removed = await page.evaluate(async () => {
    (
      document.querySelector(
        '.modal-surface [aria-label="Закрыть"]',
      ) as HTMLElement
    ).click();
    await new Promise(requestAnimationFrame);
    return (
      !document.querySelector(".modal-surface") &&
      !document.querySelector("#root[inert]")
    );
  });
  expect(removed).toBe(true);
});

test("POL-14: details не оставляет фокус в закрытом содержимом", async ({
  page,
}) => {
  await page.goto("./?page=knowledge&role=portal-admin");
  const details = page.locator("details").first();
  const summary = details.locator(":scope > summary");
  await summary.click();
  await expect.poll(() => details.evaluate(
    (node) => getComputedStyle(node, "::details-content").opacity,
  )).toBe("1");
  const supported = await page.evaluate(
    () =>
      CSS.supports("selector(::details-content)") &&
      CSS.supports("transition-behavior", "allow-discrete") &&
      CSS.supports("interactivity", "inert"),
  );
  expect(supported).toBe(true);
  // Close and attempt focus in one task, before the exit transition can finish.
  const closed = await details.evaluate((node) => {
    node.querySelector("summary")!.click();
    const target = node.querySelector<HTMLElement>("button, input, a, select");
    target?.focus();
    return { targetExists: target != null, focused: document.activeElement === target };
  });
  await expect(details).not.toHaveAttribute("open");
  expect(closed).toEqual({ targetExists: true, focused: false });
  await expect.poll(() => details.evaluate(
    (node) => getComputedStyle(node, "::details-content").contentVisibility,
  )).toBe("hidden");
  await summary.click();
  await expect.poll(() => details.evaluate(
    (node) => getComputedStyle(node, "::details-content").opacity,
  )).toBe("1");
  const reopenedFocus = await details.evaluate((node) => {
    const target = node.querySelector<HTMLElement>("button, input, a, select");
    target?.focus();
    return target != null && document.activeElement === target;
  });
  expect(reopenedFocus).toBe(true);
});

test("POL-14: короткий viewport, поля и доступное закрытие", async ({
  page,
}) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto("./?page=users&role=portal-admin");
  await page.getByRole("button", { name: "Пригласить пользователя" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Корпоративная почта").fill("motion@example.test");
  await dialog
    .getByRole("button", { name: "Отправить приглашение" })
    .scrollIntoViewIfNeeded();
  await expect(
    dialog.getByRole("button", { name: "Отправить приглашение" }),
  ).toBeInViewport();
  await expect(
    dialog.getByRole("button", { name: "Закрыть", exact: true }),
  ).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(page.locator("#root")).not.toHaveAttribute("inert");
});

test("POL-14: видимая область над клавиатурой и pinch zoom", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./?page=users&role=portal-admin");
  await page.getByRole("button", { name: "Пригласить пользователя" }).click();
  await page.evaluate(() => {
    Object.defineProperty(window.visualViewport, "height", {
      configurable: true,
      value: 360,
    });
    window.visualViewport!.dispatchEvent(new Event("resize"));
  });
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: /Открыть варианты/ })
    .first()
    .click();
  const choices = page.getByRole("listbox");
  await expect(choices).toBeVisible();
  const menuBounds = await choices.boundingBox();
  expect(menuBounds!.y).toBeGreaterThanOrEqual(0);
  expect(menuBounds!.y + menuBounds!.height).toBeLessThanOrEqual(360);
  await page.keyboard.press("Escape");
  await dialog
    .getByRole("button", { name: "Отправить приглашение" })
    .scrollIntoViewIfNeeded();
  const submit = await dialog
    .getByRole("button", { name: "Отправить приглашение" })
    .boundingBox();
  expect(submit!.y + submit!.height).toBeLessThanOrEqual(360);
  const close = await dialog
    .getByRole("button", { name: "Закрыть", exact: true })
    .boundingBox();
  expect(close!.y).toBeGreaterThanOrEqual(0);
  expect(close!.y + close!.height).toBeLessThanOrEqual(360);
  await page.keyboard.press("Escape");
  await page.reload();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
  await page.getByRole("button", { name: "Пригласить пользователя" }).click();
  const geometry = await dialog.evaluate((node) => ({
    width: node.getBoundingClientRect().width,
    viewport: window.visualViewport!.width,
  }));
  expect(geometry.width).toBeLessThanOrEqual(geometry.viewport + 1);
  await cdp.detach();
});

test("POL-14: подсказка рядом с кнопкой остаётся доступной для hover и touch", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 320 });
  await page.goto("./?page=fields&role=portal-admin");
  const trigger = page.getByRole("button", { name: /Пояснение/ }).nth(1);
  await trigger.scrollIntoViewIfNeeded();
  if (info.project.name === "mobile-chromium") await trigger.tap();
  else await trigger.hover();
  const hint = page.getByRole("tooltip");
  await expect(hint).toHaveCSS("opacity", "1");
  const box = await hint.boundingBox();
  const button = await trigger.boundingBox();
  expect(
    box!.y + box!.height <= button!.y || box!.y >= button!.y + button!.height,
  ).toBe(true);
  expect(box!.y + box!.height).toBeLessThanOrEqual(320);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  if (info.project.name === "desktop-chromium") {
    await hint.hover();
    await expect(hint).toHaveCSS("opacity", "1");
  }
  await page.keyboard.press("Escape");
  await expect(hint).toBeHidden();
});

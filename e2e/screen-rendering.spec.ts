import { expect, test, type Page } from "@playwright/test";
import { screens, type ScreenFormat } from "../src/generated/screens";

const design = (page: Page) => page.frameLocator("iframe");

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  (page as Page & { prototypeErrors?: string[] }).prototypeErrors = errors;
});

test.afterEach(async ({ page }) => {
  expect((page as Page & { prototypeErrors?: string[] }).prototypeErrors ?? []).toEqual([]);
});

const representativeScreens: Record<ScreenFormat, Array<{ id: string; role: string }>> = {
  desktop: [
    { id: "xlvEx", role: "guest" },
    { id: "o046g", role: "guest" },
    { id: "YDq1G", role: "guest" },
    { id: "wP6Wy", role: "guest" },
    { id: "Ylweo", role: "portal-admin" },
    { id: "pmHIA", role: "portal-admin" },
    { id: "Fy0nE", role: "portal-admin" },
    { id: "yretl", role: "portal-admin" },
    { id: "M6IoTK", role: "portal-admin" },
    { id: "sUjWN", role: "portal-admin" },
    { id: "cuZKn", role: "portal-admin" },
    { id: "CQojg", role: "portal-admin" },
    { id: "shAHh", role: "portal-admin" },
    { id: "IG8L8", role: "portal-admin" },
    { id: "Tb3co", role: "portal-admin" },
    { id: "zv0ob", role: "portal-admin" },
    { id: "pgMj9", role: "portal-admin" },
    { id: "iPAn6", role: "portal-admin" },
    { id: "cZUol", role: "portal-admin" },
    { id: "qRWeu", role: "client-admin" },
    { id: "SJu0Y", role: "portal-admin" },
    { id: "o43HZq", role: "portal-admin" },
    { id: "ycjEe", role: "portal-admin" },
    { id: "G0ePJ7", role: "portal-admin" },
  ],
  mobile: [
    { id: "kiGN4", role: "guest" },
    { id: "cAATf", role: "guest" },
    { id: "atKnC", role: "guest" },
    { id: "iJAp9", role: "guest" },
    { id: "BryXu", role: "portal-admin" },
    { id: "NllPS", role: "portal-admin" },
    { id: "K4fvbv", role: "portal-admin" },
    { id: "FYI4I", role: "portal-admin" },
    { id: "dcJkq", role: "portal-admin" },
    { id: "lR77f", role: "portal-admin" },
    { id: "U3ek80", role: "portal-admin" },
    { id: "n50Krp", role: "portal-admin" },
    { id: "WmKrc", role: "portal-admin" },
    { id: "EzOlK", role: "portal-admin" },
    { id: "kVLBy", role: "portal-admin" },
    { id: "L6KLB", role: "portal-admin" },
    { id: "i3L0M", role: "portal-admin" },
    { id: "h3h0i", role: "portal-admin" },
    { id: "FmZWA", role: "portal-admin" },
    { id: "YD7vh", role: "client-admin" },
    { id: "xxNsw", role: "portal-admin" },
    { id: "a7N2d", role: "portal-admin" },
    { id: "mY7Mh", role: "portal-admin" },
    { id: "DGyCQ", role: "portal-admin" },
  ],
};

test("рендерит представителя каждой экранной группы платформы", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const format: ScreenFormat = testInfo.project.name.startsWith("mobile") ? "mobile" : "desktop";
  for (const entry of representativeScreens[format]) {
    const screen = screens.find((candidate) => candidate.id === entry.id);
    if (!screen) throw new Error(`E2E_SCREEN_MISSING: ${entry.id}`);
    await page.goto(`./?screen=${entry.id}&role=${entry.role}&format=${format}`);
    await expect(page.locator("iframe")).toHaveAttribute("title", screen.name);
    await expect(design(page).locator(`[data-pencil-id="${entry.id}"]`)).toBeVisible();
  }
});

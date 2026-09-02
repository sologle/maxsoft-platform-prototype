import { describe, expect, it } from "vitest";
import { canOpenPage, pagesForRole, startPageForRole } from "./routes";

describe("ролевые маршруты платформы", () => {
  it("не выдаёт клиентским и менеджерским ролям административные страницы", () => {
    expect(canOpenPage("administration", "manager")).toBe(false);
    expect(canOpenPage("editor", "client-admin")).toBe(false);
    expect(canOpenPage("companies", "client-employee")).toBe(false);
    expect(canOpenPage("administration", "portal-admin")).toBe(true);
  });

  it("собирает селектор сценариев только из разрешённых экранов", () => {
    const employeePages = pagesForRole("client-employee").map(({ id }) => id);
    expect(employeePages).toContain("knowledge");
    expect(employeePages).toContain("search");
    expect(employeePages).not.toContain("users");
    expect(employeePages).not.toContain("structure");
  });

  it("выбирает стартовую страницу по типу пользователя", () => {
    expect(startPageForRole("guest")).toBe("landing");
    expect(startPageForRole("portal-admin")).toBe("home");
  });
});

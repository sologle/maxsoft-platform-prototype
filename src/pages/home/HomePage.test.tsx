import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { HomePage } from "../HomePage";
import { articles, companies, companyFields } from "../../data/platform-data";
import { queryMaterials } from "../../data/material-query";
import { prototypeStorageKeys as keys } from "../../data/prototype-store";
import type { UserRole } from "../../app/types";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.style.setProperty("--ms-motion-exit", "120ms");
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});
afterEach(cleanup);
const home = (
  role: UserRole = "client-admin",
  companyId = "severprom",
  companyType = "Клиент",
) =>
  render(
    <HomePage
      role={role}
      companyId={companyId}
      companyType={companyType}
      onNavigate={vi.fn()}
    />,
  );

it.each([
  "client-admin",
  "client-employee",
  "manager",
  "support-engineer",
  "portal-admin",
] as UserRole[])(
  "counts all unique KB results for %s and navigates to KB",
  (role) => {
    const onNavigate = vi.fn();
    render(
      <HomePage
        role={role}
        companyId="severprom"
        companyType="Клиент"
        onNavigate={onNavigate}
      />,
    );
    const summary = screen.getByRole("button", {
      name: /Материалов в базе знаний/,
    });
    expect(summary).toHaveTextContent(
      String(queryMaterials({ role, companyType: "Клиент" }).length),
    );
    fireEvent.click(summary);
    expect(onNavigate).toHaveBeenCalledWith("knowledge");
  },
);
it("counts zero when all publications are hidden without removing the KB entry", () => {
  localStorage.setItem(
    keys.articlePublication,
    JSON.stringify(Object.fromEntries(articles.map((a) => [a.id, false]))),
  );
  home();
  expect(
    queryMaterials({ role: "client-admin", companyType: "Клиент" }),
  ).toHaveLength(0);
  expect(
    screen.getByRole("button", { name: /Материалов в базе знаний/ }),
  ).toHaveTextContent("0");
});
it.each(["client-admin", "client-employee"] as UserRole[])(
  "shows only the selected company's access for %s",
  (role) => {
    home(role, "integrator-pro", "Интегратор");
    const support = screen.getByRole("region", { name: "Поддержка и доступ" });
    expect(support).not.toHaveTextContent("Вид поддержки");
    expect(support).not.toHaveTextContent("Не указан");
    expect(support).toHaveTextContent("Активен");
    expect(support).toHaveTextContent("15.03.2027");
    expect(support).not.toHaveTextContent("31.12.2026");
    expect(support).not.toHaveTextContent("Интегратор");
  },
);
it("shows suspension and a past date honestly without changing stored data", () => {
  localStorage.setItem(keys.companies, JSON.stringify(companies));
  home("client-employee", "vector", "Базовый");
  const support = screen.getByRole("region", { name: "Поддержка и доступ" });
  expect(support).toHaveTextContent("Приостановлен");
  expect(support).toHaveTextContent("31.08.2026");
  expect(JSON.parse(localStorage.getItem(keys.companies)!)).toEqual(companies);
});
it("omits policy-hidden fields and their derived states", () => {
  localStorage.setItem(
    keys.companyFields,
    JSON.stringify(
      companyFields.map((f) =>
        ["status", "statusUntil"].includes(f.id) ? { ...f, visible: false } : f,
      ),
    ),
  );
  home("client-employee", "vector", "Базовый");
  const support = screen.getByRole("region", { name: "Поддержка и доступ" });
  expect(support).not.toHaveTextContent(
    /Приостановлен|31.08.2026|Статус доступа|Срок статуса/,
  );
  expect(support).not.toHaveTextContent(/Базовый|просроч|законч/i);
});
it("shows a missing optional date as missing", () => {
  localStorage.setItem(
    keys.companies,
    JSON.stringify(companies.map((c) => ({ ...c, statusUntil: "" }))),
  );
  home();
  const support = screen.getByRole("region", { name: "Поддержка и доступ" });
  expect(
    within(support).getByText("Срок статуса доступа").nextElementSibling,
  ).toHaveTextContent("Не указан");
});
it("fails explicitly for an unknown current company", () => {
  expect(() => home("client-admin", "unknown")).toThrow(
    /ACC_ACTIVE_COMPANY_MISSING/,
  );
});
it("keeps the staff reminder and does not give staff a client card", () => {
  home("manager");
  expect(
    screen.getByRole("region", { name: "Пример напоминания о поддержке" }),
  ).toBeVisible();
  expect(
    screen.queryByRole("region", { name: "Поддержка и доступ" }),
  ).toBeNull();
});
it.each(["status", "statusUntil"])(
  "hides only the field disabled by policy: %s",
  (hidden) => {
    localStorage.setItem(
      keys.companyFields,
      JSON.stringify(
        companyFields.map((f) =>
          f.id === hidden ? { ...f, visible: false } : f,
        ),
      ),
    );
    home();
    const support = screen.getByRole("region", { name: "Поддержка и доступ" });
    if (hidden === "status") {
      expect(support).not.toHaveTextContent("Активен");
      expect(support).toHaveTextContent("31.12.2026");
    } else {
      expect(support).toHaveTextContent("Активен");
      expect(support).not.toHaveTextContent("31.12.2026");
    }
  },
);
it("does not fabricate a status when required stored data is invalid", () => {
  localStorage.setItem(
    keys.companies,
    JSON.stringify(companies.map((c) => ({ ...c, status: "" }))),
  );
  expect(() => home()).toThrow(/ACC_COMPANY_STATUS_INVALID/);
});
it("does not replace a missing company binding", () => {
  expect(() => home("client-admin", "")).toThrow(
    /KB_PERSON_REQUIRED|ACC_ACTIVE_COMPANY_MISSING/,
  );
});
it("uses the updated company ACL rather than a constant material count", () => {
  const audience = { role: "client-admin" as const, companyType: "ВИП-клиент" };
  localStorage.setItem(
    keys.companies,
    JSON.stringify(
      companies.map((c) =>
        c.id === "severprom" ? { ...c, type: "ВИП-клиент" } : c,
      ),
    ),
  );
  home("client-admin", "severprom", "ВИП-клиент");
  expect(
    screen.getByRole("button", { name: /Материалов в базе знаний/ }),
  ).toHaveTextContent(String(queryMaterials(audience).length));
  expect(
    queryMaterials(audience).some((a) => a.id === "practice-escalation"),
  ).toBe(true);
});

it("keeps the closing list inert during fade and supports immediate reopening", () => {
  home();
  const region = screen.getByRole("region", { name: "Новое и обновлённое" });
  const more = within(region).getByRole("button", { name: "Ещё 2" });
  fireEvent.click(more);
  const surface = region.querySelector(".motion-surface")!;
  expect(surface).toHaveAttribute("data-state", "open");
  fireEvent.click(more);
  expect(surface).toHaveAttribute("inert");
  expect(surface).toHaveAttribute("aria-hidden", "true");
  fireEvent.click(more);
  expect(surface).not.toHaveAttribute("inert");
  expect(surface).toHaveAttribute("data-state", "open");
});

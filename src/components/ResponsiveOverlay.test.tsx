import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ResponsiveOverlay } from "./ResponsiveOverlay";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("сохраняет закрываемую запись для fade, а при reopen показывает новую", () => {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  document.documentElement.style.setProperty("--ms-motion-exit", "120ms");
  const surface = (open: boolean, record: string | null) => (
    <ResponsiveOverlay
      open={open}
      label={record ?? "Новая запись"}
      onClose={() => {}}
    >
      {record ? <input aria-label="Запись" value={record} readOnly /> : null}
    </ResponsiveOverlay>
  );
  const view = render(surface(true, "Первая запись"));
  view.rerender(surface(false, null));
  expect(screen.getByLabelText("Запись")).toHaveValue("Первая запись");
  expect(screen.getByLabelText("Запись").closest("[inert]")).not.toBeNull();
  view.rerender(surface(true, "Вторая запись"));
  expect(
    screen.getByRole("dialog", { name: "Вторая запись" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Запись")).toHaveValue("Вторая запись");
});

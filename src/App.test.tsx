import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("оболочка кликабельного прототипа", () => {
  afterEach(() => window.history.replaceState({}, "", "/"));

  it("показывает шесть точек входа и запускает мобильный сценарий менеджера", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Выберите сценарий" })).toBeInTheDocument();
    expect(screen.getAllByTestId("role-entry")).toHaveLength(6);

    const manager = screen.getByRole("heading", { name: "Менеджер" }).closest("article");
    expect(manager).not.toBeNull();
    if (!manager) throw new Error("TEST_MANAGER_CARD_MISSING");
    await user.click(within(manager).getByRole("button", { name: "Мобильный" }));

    expect(screen.getByTitle("SHELL-02 Личный кабинет · менеджер · mobile")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Открыть панель прототипа" }));
    expect(screen.getByLabelText("Роль")).toHaveValue("manager");
  });

  it("не открывает экран из некорректной публичной ссылки", () => {
    window.history.replaceState({}, "", "/?screen=pmHIA&role=unknown&format=tablet");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Выберите сценарий" })).toBeInTheDocument();
  });
});

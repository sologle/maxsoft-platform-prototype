import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("адаптивная оболочка платформы", () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
  });

  it("показывает шесть ролей и запускает платформу одним действием", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Выберите сценарий" })).toBeInTheDocument();
    expect(screen.getAllByTestId("role-entry")).toHaveLength(6);
    const manager = screen.getByRole("heading", { name: "Менеджер" }).closest("article");
    if (!manager) throw new Error("TEST_MANAGER_CARD_MISSING");
    expect(within(manager).queryByRole("button", { name: /Desktop|Мобильный/ })).not.toBeInTheDocument();

    await user.click(within(manager).getByRole("button", { name: "Открыть платформу" }));
    expect(screen.getByRole("heading", { name: "Рабочее пространство" })).toBeInTheDocument();
    expect(document.querySelector("iframe")).not.toBeInTheDocument();
  });

  it("открывает гостевую страницу вместо некорректной публичной ссылки", () => {
    window.history.replaceState({}, "", "/?page=unknown&role=unknown");
    render(<App />);
    expect(screen.getByRole("heading", { name: /Всё необходимое/ })).toBeInTheDocument();
  });

  it("заменяет закрытый прямой маршрут универсальным отказом", () => {
    window.history.replaceState({}, "", "/?page=administration&role=manager");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Нет доступа к разделу" })).toBeInTheDocument();
  });
});

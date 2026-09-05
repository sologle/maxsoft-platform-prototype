import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

// Canvas animation is covered by browser tests; jsdom has no Canvas2D renderer.
vi.mock("./components/auth-backgrounds/ReactiveCanvas", () => ({ ReactiveCanvas: () => null }));

describe("адаптивная оболочка платформы", () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
  });

  it("открывает выбранную гостевую страницу без технического лаунчера", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "MaxSoft" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Войти" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Регистрация" })).toBeInTheDocument();
    expect(screen.getByTestId("portal-auth-backdrop")).toBeInTheDocument();
    expect(screen.queryByTestId("role-entry")).not.toBeInTheDocument();
  });

  it("открывает гостевую страницу вместо некорректной публичной ссылки", () => {
    window.history.replaceState({}, "", "/?page=unknown&role=unknown");
    render(<App />);
    expect(screen.getByRole("heading", { name: "MaxSoft" })).toBeInTheDocument();
  });

  it("заменяет закрытый прямой маршрут универсальным отказом", () => {
    window.history.replaceState({}, "", "/?page=administration&role=manager");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Нет доступа к разделу" })).toBeInTheDocument();
  });
});

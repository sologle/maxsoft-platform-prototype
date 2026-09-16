import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModalSurface } from "./ModalSurface";

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([
    { width: 10, height: 10 },
  ] as unknown as DOMRectList);
});
afterEach(() => vi.restoreAllMocks());

describe("ModalSurface", () => {
  it("переносит и удерживает фокус, закрывается по Escape и возвращает фокус", async () => {
    const user = userEvent.setup();
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    const onClose = vi.fn();
    const view = render(
      <ModalSurface
        className="fixed"
        labelledBy="dialog-title"
        onClose={onClose}
      >
        <h2 id="dialog-title">Диалог</h2>
        <button type="button">Первое действие</button>
        <button type="button">Второе действие</button>
      </ModalSurface>,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Первое действие" }),
      ).toHaveFocus(),
    );
    await user.tab();
    expect(
      screen.getByRole("button", { name: "Второе действие" }),
    ).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole("button", { name: "Первое действие" }),
    ).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
    view.unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });
});

it("освобождает фон и фокус уже при начале выхода", async () => {
  const root = document.createElement("div");
  root.id = "root";
  const opener = document.createElement("button");
  root.append(opener);
  document.body.append(root);
  opener.focus();
  const renderSurface = (open: boolean) => (
    <ModalSurface
      open={open}
      className="fixed"
      labelledBy="title"
      onClose={() => {}}
    >
      <h2 id="title">Панель</h2>
      <button>Действие</button>
    </ModalSurface>
  );
  const view = render(renderSurface(true));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Действие" })).toHaveFocus(),
  );
  expect(root).toHaveAttribute("inert");
  view.rerender(renderSurface(false));
  expect(root).not.toHaveAttribute("inert");
  expect(opener).toHaveFocus();
  expect(view.container.firstChild).toHaveAttribute("inert");
  view.unmount();
  root.remove();
});

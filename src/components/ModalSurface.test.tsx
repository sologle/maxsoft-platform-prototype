import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModalSurface } from "./ModalSurface";

describe("ModalSurface", () => {
  it("переносит и удерживает фокус, закрывается по Escape и возвращает фокус", async () => {
    const user = userEvent.setup();
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    const onClose = vi.fn();
    const view = render(
      <ModalSurface className="fixed" labelledBy="dialog-title" onClose={onClose}>
        <h2 id="dialog-title">Диалог</h2>
        <button type="button">Первое действие</button>
        <button type="button">Второе действие</button>
      </ModalSurface>,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "Первое действие" })).toHaveFocus());
    await user.tab();
    expect(screen.getByRole("button", { name: "Второе действие" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Первое действие" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
    view.unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });
});

import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { KnowledgeTree } from "./KnowledgeTree";
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(cleanup);
test("явно свёрнутые родители остаются закрыты после повторного входа", () => {
  const props = {
    selected: "installation",
    onSelect: () => {},
    persistExpansion: true,
    currentArticleId: "network-license",
  };
  const first = render(<KnowledgeTree {...props} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Свернуть раздел Продукты" }),
  );
  first.unmount();
  render(<KnowledgeTree {...props} />);
  expect(
    screen.getByRole("button", { name: "Развернуть раздел Продукты" }),
  ).toHaveAttribute("aria-expanded", "false");
});
test("пустой сохранённый набор и удалённые ID не раскрывают ветви", () => {
  sessionStorage.setItem(
    "maxsoft-prototype-reading-tree",
    JSON.stringify(["removed-node"]),
  );
  render(
    <KnowledgeTree
      selected="installation"
      onSelect={() => {}}
      persistExpansion
      currentArticleId="network-license"
    />,
  );
  expect(
    screen.getByRole("button", { name: "Развернуть раздел Продукты" }),
  ).toHaveAttribute("aria-expanded", "false");
});

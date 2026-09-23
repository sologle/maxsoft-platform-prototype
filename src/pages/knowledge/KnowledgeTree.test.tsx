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
test("в режиме чтения статья вложена в раздел, выделена и доступна для перехода", () => {
  const selected: string[] = [];
  render(
    <KnowledgeTree
      selected=""
      onSelect={() => {}}
      onSelectArticle={(id) => selected.push(id)}
      articleIds={["licensing-system", "licensing-overview"]}
      currentArticleId="licensing-system"
      persistExpansion
    />,
  );
  expect(screen.queryByRole("button", { name: "Вся база знаний" })).toBeNull();
  const current = screen.getByRole("button", { name: /Технические данные о системе лицензирования/ });
  expect(current).toHaveAttribute("aria-current", "page");
  fireEvent.click(current);
  expect(selected).toEqual(["licensing-system"]);
  expect(screen.queryByRole("button", { name: "Шаблон проекта Model Studio CS" })).toBeNull();
});

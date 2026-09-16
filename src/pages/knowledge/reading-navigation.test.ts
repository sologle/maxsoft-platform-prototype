import { expect, test, beforeEach } from "vitest";
import { articleTrail } from "./reading-navigation";
import { articles } from "../../data/platform-data";
import { getKnowledgeTree } from "../../data/knowledge-tree";
beforeEach(() => localStorage.clear());
test("крошки разрешают полный путь, а не первое совпадение имени", () => {
  const tree = [
    {
      id: "other",
      name: "Другой продукт",
      children: [{ id: "wrong", name: "Обзор и серийные номера" }],
    },
    ...getKnowledgeTree(),
  ];
  const article = articles.find((a) => a.id === "licensing-system")!;
  expect(articleTrail(tree, article).map((n) => n.id)).toEqual([
    "licensing",
    "licensing-overview",
  ]);
});
test("действующие старые размещения НАВИСА сохраняют реальных родителей", () => {
  expect(
    articleTrail(
      getKnowledgeTree(),
      articles.find((a) => a.id === "network-license")!,
    ).map((n) => n.id),
  ).toEqual(["products", "navisa", "installation"]);
});
test("удалённое размещение не подменяется другим разделом", () => {
  expect(
    articleTrail(
      [],
      articles.find((a) => a.id === "licensing-system")!,
    ),
  ).toEqual([]);
});

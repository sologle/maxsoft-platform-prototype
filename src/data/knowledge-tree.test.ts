import { beforeEach, describe, it, expect } from "vitest";
import { getKnowledgeTree, saveKnowledgeTree, flattenTree } from "./knowledge-tree";
import { articles } from "./platform-data";
import { getArticleSections } from "./prototype-entities";
import { prototypeStorageKeys } from "./prototype-store";
describe("общая структура БЗ", () => {
  beforeEach(() => localStorage.clear());
  it("запрещает совпадающие пути с существующей веткой НАВИСА", () => {
    const before = getKnowledgeTree();
    expect(() => saveKnowledgeTree([...before, { id: "new-root", name: "НАВИСА" }])).toThrow(
      "KB_SECTION_PATH_CONFLICT",
    );
    expect(getKnowledgeTree()).toEqual(before);
  });
  it("переименование сохраняет существующие связи и допускает выбор корня", () => {
    const tree = getKnowledgeTree();
    tree[0]
      .children!.find((node) => node.id === "navisa")!
      .children!.find((node) => node.id === "installation")!.name = "Монтаж";
    saveKnowledgeTree(tree);
    expect(getArticleSections(articles[0])).toEqual(["НАВИСА / Монтаж"]);
    localStorage.setItem(
      prototypeStorageKeys.articleSections,
      JSON.stringify({ "network-license": ["Продукты"] }),
    );
    expect(getArticleSections(articles[0])).toEqual(["Продукты"]);
    expect(flattenTree(getKnowledgeTree()).some((node) => node.path === "НАВИСА / Монтаж")).toBe(
      true,
    );
  });
});

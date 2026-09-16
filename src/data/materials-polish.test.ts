import { beforeEach, expect, it, vi } from "vitest";
import { articles, files } from "./platform-data";
import { articleSearchText, getArticleContent } from "./article-content";
import {
  flattenTree,
  getKnowledgeTree,
  saveKnowledgeTree,
  sectionArticleIds,
} from "./knowledge-tree";
import { getArticleSections } from "./prototype-entities";
import { queryMaterials, visibleArticleIds } from "./material-query";
import { prototypeStorageKeys as keys } from "./prototype-store";
const treeKey = "maxsoft-prototype-knowledge-tree";
const versionKey = "maxsoft-prototype-content-version";
const client = { role: "client-employee" as const, companyType: "Интегратор" };
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
it("adds six readable demo articles, ten nodes and no files", () => {
  expect(articles).toHaveLength(20);
  expect(files).toHaveLength(5);
  const tree = getKnowledgeTree();
  expect(flattenTree(tree)).toHaveLength(23);
  expect(Math.max(...flattenTree(tree).map((n) => n.depth))).toBe(3);
  for (const article of articles.filter((a) => a.id.startsWith("practice-"))) {
    expect(getArticleContent(article.id).length).toBeGreaterThanOrEqual(3);
    expect(articleSearchText(article.id)).toContain("Демонстрационный");
    expect(
      queryMaterials({ role: "portal-admin", query: article.title }).map(
        (r) => r.id,
      ),
    ).toContain(article.id);
    for (const path of getArticleSections(article))
      expect(flattenTree(tree).some((n) => n.path === path)).toBe(true);
  }
});
it("upgrades version 1 once, preserving custom tree, overrides and renamed placements", () => {
  const oldTree = [{ id: "custom", name: "Мой переименованный раздел" }];
  localStorage.setItem(treeKey, JSON.stringify(oldTree));
  localStorage.setItem(versionKey, "1");
  const overrides = {
    [keys.articleAccess]: { "network-license": [], "practice-pilot": [] },
    [keys.articlePublication]: {
      "network-license": false,
      "practice-pilot": false,
    },
    [keys.articleTags]: { "network-license": ["Моя метка"] },
    [keys.articleSections]: {
      "network-license": ["Мой переименованный раздел"],
      "practice-pilot": ["Мой переименованный раздел"],
    },
  };
  for (const [key, value] of Object.entries(overrides))
    localStorage.setItem(key, JSON.stringify(value));
  const tree = getKnowledgeTree();
  expect(tree[0]).toEqual(oldTree[0]);
  expect(tree).toHaveLength(2);
  expect(localStorage.getItem(versionKey)).toBe("2");
  for (const [key, value] of Object.entries(overrides))
    expect(JSON.parse(localStorage.getItem(key)!)).toMatchObject(value);
  saveKnowledgeTree(
    tree.map((n) => (n.id === "practice" ? { ...n, name: "Моя практика" } : n)),
  );
  const once = localStorage.getItem(treeKey);
  expect(
    getArticleSections(articles.find((a) => a.id === "practice-review")!)[0],
  ).toMatch(/^Моя практика/);
  getKnowledgeTree();
  expect(localStorage.getItem(treeKey)).toBe(once);
  saveKnowledgeTree(getKnowledgeTree().filter((n) => n.id !== "practice"));
  expect(getKnowledgeTree().some((n) => n.id === "practice")).toBe(false);
});
it("rolls back tree and placements when the upgrade cannot be saved", () => {
  localStorage.setItem(
    treeKey,
    JSON.stringify([{ id: "custom", name: "Мой раздел" }]),
  );
  localStorage.setItem(versionKey, "1");
  localStorage.setItem(
    keys.articleSections,
    JSON.stringify({ "network-license": ["Мой раздел"] }),
  );
  const before = { ...localStorage };
  const set = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
    this: Storage,
    key,
    value,
  ) {
    if (key === versionKey && value === "2") throw new Error("quota");
    set.call(this, key, value);
  });
  expect(() => getKnowledgeTree()).toThrow("APP_SAVE_FAILED");
  expect({ ...localStorage }).toEqual(before);
});
it("counts unique accessible articles across placements and hides restricted/draft demos", () => {
  const tree = getKnowledgeTree();
  const ids = sectionArticleIds(tree, "practice");
  expect(ids).toHaveLength(6);
  expect(
    getArticleSections(articles.find((a) => a.id === "practice-review")!),
  ).toHaveLength(2);
  const visible = visibleArticleIds(client);
  expect(ids.filter((id) => visible.includes(id))).toHaveLength(4);
  const result = queryMaterials({ ...client, section: "practice" });
  expect(result).toHaveLength(4);
  expect(new Set(result.map((r) => r.id)).size).toBe(4);
  expect(result.map((r) => r.id)).not.toContain("practice-escalation");
  expect(result.map((r) => r.id)).not.toContain("practice-handover");
});
it("rejects a conflicting saved root path without mutating the profile", () => {
  localStorage.setItem(
    treeKey,
    JSON.stringify([{ id: "custom", name: "Практика работы" }]),
  );
  localStorage.setItem(versionKey, "1");
  const before = { ...localStorage };
  expect(() => getKnowledgeTree()).toThrow("KB_CATALOG_CONFLICT");
  expect({ ...localStorage }).toEqual(before);
});
it("first direct section read and search include both new placements before a tree is rendered", () => {
  const review = articles.find((article) => article.id === "practice-review")!;
  expect(getArticleSections(review)).toHaveLength(2);
  localStorage.clear();
  expect(
    queryMaterials({ ...client, query: "Проверка материала" }).find(
      (result) => result.id === review.id,
    )?.sections,
  ).toHaveLength(2);
});

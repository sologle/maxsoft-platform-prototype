import { beforeEach, describe, expect, it } from "vitest";
import { articles, files } from "./platform-data";
import { queryMaterials } from "./material-query";
import {
  personalKey,
  readPersonalArticles,
  recordRead,
  toggleSaved,
} from "./personal-articles";
import { getKnowledgeTree, saveKnowledgeTree } from "./knowledge-tree";
import { prototypeStorageKeys } from "./prototype-store";
const client = {
  role: "client-employee" as const,
  companyType: "Интегратор",
  companyId: "integrator-pro",
};
beforeEach(() => localStorage.clear());
describe("содержимое, поиск и ACL", () => {
  it("наполнен и ищет обе панели вкладок", () => {
    expect(
      articles.filter((a) => a.status === "Опубликована").length,
    ).toBeGreaterThanOrEqual(12);
    for (const query of [
      "бессрочное право",
      "аппаратному обеспечению конкретного ПК",
    ])
      expect(
        queryMaterials({ ...client, query, kind: "article" }).map((r) => r.id),
      ).toContain("licensing-system");
    expect(
      files.find((f) => f.name === "лицензирование-продуктов.pdf"),
    ).toBeDefined();
  });
  it("выдаёт файлы отдельно и не дублирует статьи по разделам", () => {
    localStorage.setItem(
      prototypeStorageKeys.articleSections,
      JSON.stringify({
        "network-license": ["НАВИСА / Установка", "НАВИСА / Настройка"],
      }),
    );
    const result = queryMaterials({
      ...client,
      query: "адрес сервера",
      kind: "file",
    });
    expect(
      result.some(
        (r) => r.id === "инструкция_активации.pdf" && r.kind === "file",
      ),
    ).toBe(true);
    const all = queryMaterials({ ...client, query: "лицензи", kind: "all" });
    expect(new Set(all.map((r) => `${r.kind}:${r.id}`)).size).toBe(all.length);
    expect(all.map((r) => r.id)).not.toContain("server-migration");
  });
  it("сочетает фильтры и сортирует по настоящей дате", () => {
    const result = queryMaterials({
      ...client,
      kind: "article",
      section: "installation",
      tags: ["Лицензирование"],
      sort: "updated",
    });
    expect(result.map((r) => r.id)).toContain("network-license");
    expect(result.every((r) => r.kind === "article")).toBe(true);
    const sorted = queryMaterials({ ...client, kind: "all", sort: "updated" });
    expect(sorted.map((r) => r.updatedAt)).toEqual(
      sorted
        .map((r) => r.updatedAt)
        .sort()
        .reverse(),
    );
  });
  it("исключает файлы без доступных связей", () => {
    const file = files.find((f) => f.name === "инструкция_активации.pdf")!;
    localStorage.setItem(
      prototypeStorageKeys.articlePublication,
      JSON.stringify(
        Object.fromEntries(file.relatedArticleIds.map((id) => [id, false])),
      ),
    );
    expect(
      queryMaterials({ ...client, kind: "file" }).map((r) => r.id),
    ).not.toContain(file.name);
  });
});
describe("персональные списки", () => {
  it("сохраняет действия без дублей и смешения персон", () => {
    const key = personalKey(client.role, client.companyId);
    toggleSaved(key, "network-license");
    recordRead(key, "network-license");
    recordRead(key, "network-license");
    expect(readPersonalArticles(key, client).saved.map((a) => a.id)).toEqual([
      "network-license",
    ]);
    expect(readPersonalArticles(key, client).recent.map((a) => a.id)).toEqual([
      "network-license",
    ]);
    expect(
      readPersonalArticles(
        personalKey("client-admin", client.companyId),
        client,
      ).saved,
    ).toEqual([]);
    expect(
      readPersonalArticles(personalKey(client.role, "severprom"), client)
        .recent,
    ).toEqual([]);
    toggleSaved(key, "network-license");
    expect(readPersonalArticles(key, client).saved).toEqual([]);
  });
  it("повторно применяет ACL к сохранённым материалам", () => {
    const key = personalKey(client.role, client.companyId);
    toggleSaved(key, "network-license");
    localStorage.setItem(
      prototypeStorageKeys.articlePublication,
      JSON.stringify({ "network-license": false }),
    );
    expect(readPersonalArticles(key, client).saved).toEqual([]);
  });
  it("требует компанию клиентского профиля", () => {
    expect(() => personalKey("client-employee")).toThrow("KB_PERSON_REQUIRED");
  });
});
it("дополняет старое дерево один раз и сохраняет настройки", () => {
  localStorage.setItem(
    "maxsoft-prototype-knowledge-tree",
    JSON.stringify([{ id: "custom", name: "Мои разделы" }]),
  );
  localStorage.setItem(
    prototypeStorageKeys.articleTags,
    JSON.stringify({ "network-license": ["Моя метка"] }),
  );
  const tree = getKnowledgeTree();
  expect(tree[0].name).toBe("Мои разделы");
  expect(tree.some((n) => n.id === "licensing")).toBe(true);
  expect(localStorage.getItem(prototypeStorageKeys.articleTags)).toContain(
    "Моя метка",
  );
  saveKnowledgeTree(
    tree.map((n) => (n.id === "licensing" ? { ...n, name: "Лицензии" } : n)),
  );
  expect(getKnowledgeTree().find((n) => n.id === "licensing")?.name).toBe(
    "Лицензии",
  );
});

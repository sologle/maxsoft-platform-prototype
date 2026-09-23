import { expect, test } from "vitest";
import type { TreeNode } from "../../data/knowledge-tree";
import { moveSection } from "./move-section";

const tree: TreeNode[] = [
  { id: "a", name: "А", children: [
    { id: "a1", name: "Один" },
    { id: "a2", name: "Два", children: [{ id: "a2x", name: "Вложенный" }] },
  ] },
  { id: "b", name: "Б", children: [{ id: "b1", name: "Три" }] },
];

test("переставляет разделы внутри родителя", () => {
  const next = moveSection(tree, "a2", "a1", "before");
  expect(next[0].children?.map((node) => node.id)).toEqual(["a2", "a1"]);
  expect(next[0].children?.[0].children?.[0].id).toBe("a2x");
});

test("перемещает ветку на другой уровень и обратно в корень", () => {
  const nested = moveSection(tree, "a2", "b1", "inside");
  expect(nested[1].children?.[0].children?.[0].id).toBe("a2");
  expect(nested[0].children?.map((node) => node.id)).toEqual(["a1"]);
  expect(moveSection(nested, "a2", "root").at(-1)?.id).toBe("a2");
});

test("не переносит родителя в собственного потомка и не меняет дерево", () => {
  expect(moveSection(tree, "a", "a2x", "inside")).toBe(tree);
  expect(moveSection(tree, "a1", "a1", "before")).toBe(tree);
});

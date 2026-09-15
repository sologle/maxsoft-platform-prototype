import { licensingTree } from "./licensing/catalog";
import { readPrototypeValue, writePrototypeBatch } from "./prototype-store";
export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}
// Paths keep the shipped НАВИСА / ... article assignments valid.
export const initialTree: TreeNode[] = [
  {
    id: "products",
    name: "Продукты",
    children: [
      {
        id: "navisa",
        name: "НАВИСА",
        children: [
          { id: "installation", name: "Установка" },
          { id: "settings", name: "Настройка" },
          { id: "updates", name: "Обновление" },
          { id: "administration", name: "Администрирование" },
          { id: "cases", name: "Кейсы внедрения" },
        ],
      },
      { id: "general", name: "Общие рекомендации" },
      { id: "model-studio", name: "Model Studio CS" },
    ],
  },
];
export const getKnowledgeTree = (): TreeNode[] => {
  const key = "maxsoft-prototype-knowledge-tree";
  const versionKey = "maxsoft-prototype-content-version";
  const tree = readPrototypeValue<TreeNode[]>(
    key,
    structuredClone(initialTree),
  );
  if (readPrototypeValue<number>(versionKey, 0) >= 1) return tree;
  const next = tree.some((node) => node.id === licensingTree.id)
    ? tree
    : [...tree, structuredClone(licensingTree)];
  writePrototypeBatch({ [key]: next, [versionKey]: 1 });
  return next;
};
export const flattenTree = (
  nodes: TreeNode[],
  parent = "",
  depth = 0,
): Array<TreeNode & { path: string; depth: number }> =>
  nodes.flatMap((node) => {
    const path =
      node.id === "navisa"
        ? node.name
        : parent
          ? `${parent} / ${node.name}`
          : node.name;
    return [
      { ...node, path, depth },
      ...flattenTree(node.children ?? [], path, depth + 1),
    ];
  });

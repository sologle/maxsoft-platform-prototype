import { practiceTree, practicePlacements } from "./practice/catalog";
import { licensingTree } from "./licensing/catalog";
import {
  prototypeStorageKeys,
  readPrototypeValue,
  writePrototypeBatch,
} from "./prototype-store";
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
  const version = readPrototypeValue<number>(versionKey, 0);
  if (version >= 2) return tree;
  const next =
    version >= 1 || tree.some((node) => node.id === licensingTree.id)
      ? tree
      : [...tree, structuredClone(licensingTree)];
  const reservedIds = new Set(
    flattenTree([practiceTree]).map((node) => node.id),
  );
  if (
    flattenTree(next).some((node) => reservedIds.has(node.id)) ||
    next.some(
      (node) =>
        node.name.trim().toLocaleLowerCase("ru") ===
        practiceTree.name.toLocaleLowerCase("ru"),
    )
  )
    throw new Error(
      "KB_CATALOG_CONFLICT: Не удалось добавить демонстрационные разделы: совпали названия или идентификаторы. Обратитесь к администратору.",
    );
  const sections = readPrototypeValue<Record<string, string[]>>(
    prototypeStorageKeys.articleSections,
    {},
  );
  const populated = [...next, structuredClone(practiceTree)];
  writePrototypeBatch({
    [key]: populated,
    [prototypeStorageKeys.articleSections]: {
      ...practicePlacements,
      ...sections,
    },
    [versionKey]: 2,
  });
  return populated;
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

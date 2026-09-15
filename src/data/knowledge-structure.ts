import { readPrototypeValue } from "./prototype-store";
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
export const getKnowledgeTree = () =>
  readPrototypeValue<TreeNode[]>("maxsoft-prototype-knowledge-tree", structuredClone(initialTree));
export const flattenTree = (
  nodes: TreeNode[],
  parent = "",
  depth = 0,
): Array<TreeNode & { path: string; depth: number }> =>
  nodes.flatMap((node) => {
    const path = node.id === "navisa" ? node.name : parent ? `${parent} / ${node.name}` : node.name;
    return [{ ...node, path, depth }, ...flattenTree(node.children ?? [], path, depth + 1)];
  });

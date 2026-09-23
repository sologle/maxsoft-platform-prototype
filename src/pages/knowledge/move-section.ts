import type { TreeNode } from "../../data/knowledge-tree";

export type DropPosition = "before" | "inside" | "after";

const findNode = (nodes: TreeNode[], id: string): TreeNode | undefined => {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children ?? [], id);
    if (found) return found;
  }
};

const removeNode = (nodes: TreeNode[], id: string): TreeNode[] =>
  nodes
    .filter((node) => node.id !== id)
    .map((node) => ({
      ...node,
      ...(node.children ? { children: removeNode(node.children, id) } : {}),
    }));

const insertNode = (
  nodes: TreeNode[],
  moved: TreeNode,
  targetId: string,
  position: DropPosition,
): TreeNode[] => {
  const index = nodes.findIndex((node) => node.id === targetId);
  if (index >= 0) {
    const next = [...nodes];
    if (position === "inside")
      next[index] = { ...next[index], children: [...(next[index].children ?? []), moved] };
    else next.splice(index + (position === "after" ? 1 : 0), 0, moved);
    return next;
  }
  return nodes.map((node) =>
    node.children
      ? { ...node, children: insertNode(node.children, moved, targetId, position) }
      : node,
  );
};

// Returning the same tree signals an invalid or unchanged move to the caller.
export const moveSection = (
  tree: TreeNode[],
  draggedId: string,
  targetId: string | "root",
  position: DropPosition = "inside",
): TreeNode[] => {
  const moved = findNode(tree, draggedId);
  if (!moved || (targetId !== "root" && !findNode(tree, targetId))) return tree;
  if (targetId === draggedId || findNode(moved.children ?? [], targetId)) return tree;
  const remaining = removeNode(tree, draggedId);
  const next = targetId === "root"
    ? [...remaining, moved]
    : insertNode(remaining, moved, targetId, position);
  return JSON.stringify(next) === JSON.stringify(tree) ? tree : next;
};

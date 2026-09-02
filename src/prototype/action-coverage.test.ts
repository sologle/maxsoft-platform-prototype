import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { screens, type ScreenDefinition } from "../generated/screens";
import { resolveAction, type UserRole } from "./navigation";

const designRoot = resolve(process.cwd(), "public/design");
const htmlByFile = new Map<string, string>();

const actionsForScreen = (screen: ScreenDefinition): string[] => {
  const html = htmlByFile.get(screen.file) ?? readFileSync(resolve(designRoot, screen.file), "utf8");
  htmlByFile.set(screen.file, html);
  const marker = `      <div\n        data-pencil-id="${screen.id}"`;
  const start = html.indexOf(marker);
  if (start < 0) throw new Error(`TEST_SCREEN_ROOT_MISSING: ${screen.id}`);
  const next = html.indexOf("\n      <div\n        data-pencil-id=", start + marker.length);
  const root = html.slice(start, next < 0 ? undefined : next);
  return [...root.matchAll(/data-pencil-name="(ACTION(?: INPUT| SELECT)? → [^"]+)"/g)].map(
    (match) => match[1],
  );
};

const roleForScreen = (screen: ScreenDefinition): UserRole => {
  const name = screen.name.toLowerCase();
  if (name.startsWith("auth-")) return "guest";
  if (name.includes("инженер")) return "support-engineer";
  if (name.includes("менеджер")) return "manager";
  if (name.includes("администратор клиента") || name.startsWith("org-05")) return "client-admin";
  if (name.includes("сотрудник клиента")) return "client-employee";
  return "portal-admin";
};

describe("полнота интерактивной карты Pencil", () => {
  it("даёт каждой ACTION-метке переход, эффект или объясняющую заглушку", () => {
    let actionCount = 0;
    for (const screen of screens) {
      const role = roleForScreen(screen);
      for (const action of actionsForScreen(screen)) {
        actionCount += 1;
        const result = resolveAction(
          action,
          { screenId: screen.id, role, format: screen.format },
          screens,
        );
        const changesScreen = result.nextState?.screenId !== screen.id;
        expect(
          Boolean(changesScreen || result.effect || result.notice),
          `${screen.id} ${screen.name}: ${action}`,
        ).toBe(true);
        if (result.nextState) {
          expect(result.nextState.format, `${screen.id}: ${action}`).toBe(screen.format);
          expect(
            screens.some((candidate) => candidate.id === result.nextState?.screenId),
            `${screen.id}: ${action}`,
          ).toBe(true);
        }
        if (/DISABLED/i.test(action)) {
          expect(result.nextState, `${screen.id}: ${action}`).toBeUndefined();
        }
      }
    }
    expect(actionCount).toBeGreaterThan(1_500);
  });
});

import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  within,
  fireEvent,
} from "@testing-library/react";
import { KnowledgeResults } from "./KnowledgeResults";
import type { MaterialResult } from "../../data/material-query";
const result: MaterialResult = {
  id: "example",
  kind: "article",
  title: "Материал",
  description: "Полное описание",
  updated: "16.09.2026",
  updatedAt: "2026-09-16T09:00:00+03:00",
  tags: [],
  sections: ["Первый раздел", "Второй раздел"],
  related: [],
  match: "Опубликована",
  snippet: "",
};
beforeEach(() => {
  localStorage.clear();
  document.documentElement.style.setProperty("--ms-motion-exit", "120ms");
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});
afterEach(cleanup);
it("groups only unique assigned tags, keeps unknown tags visible, and expands independently", () => {
  const onNavigate = vi.fn();
  render(
    <KnowledgeResults
      view="cards"
      onNavigate={onNavigate}
      results={[
        {
          ...result,
          tags: [
            "Проекты",
            "Стандарты",
            "Проекты",
            "Администратор",
            "Старый тег",
          ],
        },
      ]}
    />,
  );
  const topics = screen.getByRole("button", { name: "Темы · 2" });
  const audience = screen.getByRole("button", { name: "Аудитория · 1" });
  const unknown = screen.getByRole("button", { name: "Без группы · 1" });
  expect(topics).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("button", { name: /Продукты ·/ })).toBeNull();
  fireEvent.click(topics);
  fireEvent.click(audience);
  fireEvent.click(unknown);
  expect(screen.getAllByText("Проекты")).toHaveLength(1);
  expect(screen.getByText("Старый тег")).toBeVisible();
  fireEvent.click(topics);
  expect(audience).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("Проекты").closest("[inert]")).not.toBeNull();
  expect(onNavigate).not.toHaveBeenCalled();
});
it("uses the saved group catalogue and renders materials without tags", () => {
  localStorage.setItem(
    "maxsoft-prototype-tags",
    JSON.stringify([
      { id: "custom", name: "Моя группа", tags: [{ name: "Проекты" }] },
    ]),
  );
  render(
    <KnowledgeResults
      view="cards"
      onNavigate={vi.fn()}
      results={[
        { ...result, tags: ["Проекты"] },
        { ...result, id: "empty", title: "Без тегов" },
      ]}
    />,
  );
  expect(screen.getByRole("button", { name: "Моя группа · 1" })).toBeVisible();
  expect(
    within(screen.getByText("Без тегов").closest("article")!).queryByRole(
      "button",
      { expanded: false },
    ),
  ).toBeNull();
});
it("table has aligned column headings and separate disclosures and navigation", () => {
  const onNavigate = vi.fn();
  render(
    <KnowledgeResults
      view="table"
      onNavigate={onNavigate}
      results={[{ ...result, tags: ["Проекты", "Стандарты", "Администратор"] }]}
    />,
  );
  expect(screen.getByText("Обновлено", { exact: true })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Ещё 1" }));
  expect(screen.getByText("Администратор")).toBeVisible();
  expect(onNavigate).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Открыть материал: Материал" }),
  );
  expect(onNavigate).toHaveBeenCalledWith("article", "example");
});

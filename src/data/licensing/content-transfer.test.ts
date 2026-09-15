import { describe, expect, it } from "vitest";
import { licensingSections } from "./catalog";
import { articleSearchText } from "../article-content";
describe("полнота переноса лицензирования", () => {
  it("сохраняет структуру, таблицы, иллюстрации и заметки", () => {
    expect(licensingSections).toHaveLength(17);
    const doc = document.createElement("div");
    doc.innerHTML = licensingSections.map((s) => s.html).join("");
    const tables = doc.querySelectorAll("table");
    expect(tables).toHaveLength(2);
    expect(tables[0].querySelectorAll("tbody tr")).toHaveLength(5);
    expect(tables[1].querySelectorAll("tbody tr")).toHaveLength(13);
    expect(
      [...tables[1].querySelectorAll("tr")].every(
        (r) => r.children.length === 4,
      ),
    ).toBe(true);
    expect(doc.querySelectorAll("img")).toHaveLength(14);
    expect(
      [...doc.querySelectorAll("img")].every(
        (i) => i.hasAttribute("width") && i.hasAttribute("height") && i.alt,
      ),
    ).toBe(true);
    expect(doc.querySelectorAll(".article-note")).toHaveLength(3);
    expect(doc.textContent).toContain(
      "привязки всегда можно сбросить через техподдержку Нанософт",
    );
    expect(JSON.stringify(licensingSections)).not.toMatch(
      /ispring|wgrid|\{%|\.files|<script|onerror/i,
    );
  });
  it("сохраняет весь текст обеих классификаций и незаполненные разделы", () => {
    const kinds = licensingSections.find((s) => s.id === "license-kinds")!;
    expect(kinds.tabs?.map((t) => t.title)).toEqual([
      "По сетевитости",
      "По сроку действия",
    ]);
    const text = articleSearchText("licensing-system");
    for (const phrase of [
      "Персональная лицензия",
      "Количество рабочих мест",
      "Постоянная лицензия",
      "приобретение подписки на обновления обязательно",
      "NANOSOFT_LICENSE_FILE",
      "NC260P",
      "NSCN40",
      "msinfo32.exe",
    ])
      expect(text).toContain(phrase);
    expect(
      licensingSections
        .filter((s) =>
          ["nanolm", "flexlm", "registration-wizard"].includes(s.id),
        )
        .every((s) => s.html === ""),
    ).toBe(true);
  });
});

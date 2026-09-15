import { describe, it, expect } from "vitest";
import { planAccessChange, planTypeRemoval, type AccessMap } from "./access-policy";
const access = {
  shared: ["T", "U"],
  last: ["T"],
  all: "all",
  other: ["U"],
  draft: [],
} as const;
const source = (): AccessMap =>
  Object.fromEntries(Object.entries(access).map(([id, a]) => [id, a === "all" ? "all" : [...a]]));
describe("атомарное изменение аудитории", () => {
  it("удаляет только потерянную связь и сохраняет режим all", () => {
    expect(planTypeRemoval(source(), "T", "U")).toEqual({
      shared: ["U"],
      last: ["U"],
      all: "all",
      other: ["U"],
      draft: [],
    });
  });
  it("не удаляет последнюю аудиторию без явной замены", () => {
    expect(() => planTypeRemoval(source(), "T")).toThrow("KB_AUDIENCE_REQUIRED");
  });
  it("массовый запрет не применяет часть набора до разрешения конфликта", () => {
    const before = source();
    expect(() =>
      planAccessChange(before, ["shared", "last", "shared"], "T", false, ["T", "U"]),
    ).toThrow("KB_AUDIENCE_REQUIRED");
    expect(before).toEqual(source());
    expect(
      planAccessChange(before, ["shared", "last", "shared"], "T", false, ["T", "U"], "U"),
    ).toMatchObject({ shared: ["U"], last: ["U"], draft: [] });
  });
  it("разрешение уже разрешённого all не фиксирует список типов", () => {
    expect(planAccessChange(source(), ["all"], "T", true, ["T", "U"]).all).toBe("all");
  });
});

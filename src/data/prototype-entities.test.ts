import { beforeEach, describe, expect, it } from "vitest";
import { articles } from "./platform-data";
import { getArticleSections } from "./prototype-entities";
import { prototypeStorageKeys } from "./prototype-store";

describe("настройки материалов прототипа", () => {
  beforeEach(() => window.localStorage.clear());

  it("нормализует старые короткие разделы и удаляет дубликаты путей", () => {
    window.localStorage.setItem(
      prototypeStorageKeys.articleSections,
      JSON.stringify({ "network-license": ["Установка", "НАВИСА / Установка"] }),
    );

    expect(getArticleSections(articles[0])).toEqual(["НАВИСА / Установка"]);
  });
});

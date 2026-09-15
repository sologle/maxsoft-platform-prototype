import { useEffect, useState } from "react";
import type { UserRole } from "../app/types";
import type { ArticleSummary } from "../data/platform-data";
import {
  personalKey,
  readPersonalArticles,
  recordRead,
  toggleSaved,
} from "../data/personal-articles";
export const usePersonalArticle = (
  article: ArticleSummary,
  role: UserRole,
  companyId: string | undefined,
  companyType: string | undefined,
  onNotice: (message: string) => void,
) => {
  const key = personalKey(role, companyId);
  const [saved, setSaved] = useState(() =>
    readPersonalArticles(key, { role, companyType }).saved.some(
      (a) => a.id === article.id,
    ),
  );
  const report = (cause: unknown, action: "read" | "save") => {
    const message =
      action === "save"
        ? "Не удалось сохранить материал. Проверьте, разрешено ли браузеру сохранять данные, и повторите."
        : "Не удалось добавить материал в недавно прочитанное. Проверьте, разрешено ли браузеру сохранять данные.";
    const error = new Error(`KB_PERSONAL_SAVE_FAILED: ${message}`, { cause });
    console.error("KB_PERSONAL_SAVE_FAILED", {
      articleId: article.id,
      action,
      error,
    });
    onNotice(`${message} Код: KB_PERSONAL_SAVE_FAILED.`);
  };
  useEffect(() => {
    try {
      recordRead(key, article.id);
    } catch (cause) {
      report(cause, "read");
    }
  }, [key, article.id]);
  return {
    saved,
    toggle: () => {
      try {
        toggleSaved(key, article.id);
        setSaved((value) => !value);
      } catch (cause) {
        report(cause, "save");
      }
    },
  };
};

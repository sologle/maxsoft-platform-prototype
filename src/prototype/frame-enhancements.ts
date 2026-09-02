import type { ScreenDefinition } from "../generated/screens";

const clearDuplicatePencilIds = (node: HTMLElement) => {
  node.removeAttribute("data-pencil-id");
  node.querySelectorAll<HTMLElement>("[data-pencil-id]").forEach((child) => {
    child.removeAttribute("data-pencil-id");
  });
};

const cloneShortcut = (source: HTMLElement, action: string, label: string) => {
  const shortcut = source.cloneNode(true) as HTMLElement;
  clearDuplicatePencilIds(shortcut);
  shortcut.dataset.pencilName = action;
  shortcut.dataset.prototypeAction = action;
  const text = shortcut.querySelector<HTMLElement>(
    '[data-pencil-name*="Текст действия"], [data-pencil-name*="текст действия"]',
  );
  if (!text) throw new Error(`PROTOTYPE_SHORTCUT_LABEL_MISSING: ${action}`);
  text.textContent = label;
  text.style.whiteSpace = "normal";
  return shortcut;
};

export const addAdminHomeShortcuts = (active: HTMLElement, screen: ScreenDefinition) => {
  if (!(["pmHIA", "NllPS"] as const).includes(screen.id as "pmHIA" | "NllPS")) return;

  if (screen.format === "desktop") {
    const row = active.querySelector<HTMLElement>(
      '[data-pencil-name="SHELL-02 Быстрые действия ряд · Администратор портала"]',
    );
    const source = row?.querySelector<HTMLElement>('[data-pencil-name="ACTION → PLAT-01"]');
    if (!row || !source) throw new Error("PROTOTYPE_ADMIN_SHORTCUTS_DESKTOP_MISSING");
    row.style.gap = "8px";
    Array.from(row.children).forEach((child) => {
      if (child instanceof HTMLElement) child.style.minWidth = "0";
    });
    row.append(
      cloneShortcut(source, "ACTION → ORG-03", "Типы компаний"),
      cloneShortcut(source, "ACTION → KB-06", "Структура БЗ"),
    );
    return;
  }

  const block = active.querySelector<HTMLElement>(
    '[data-pencil-name="SHELL-02 Mobile быстрые действия · Администратор портала"]',
  );
  const source = block?.querySelector<HTMLElement>('[data-pencil-name="ACTION → PLAT-01 · mobile"]');
  const heading = block?.querySelector<HTMLElement>(
    '[data-pencil-name="SHELL-02 Mobile быстрые действия заголовок · Администратор портала"]',
  );
  if (!block || !source || !heading) throw new Error("PROTOTYPE_ADMIN_SHORTCUTS_MOBILE_MISSING");
  block.style.display = "grid";
  block.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
  heading.style.gridColumn = "1 / -1";
  block.append(
    cloneShortcut(source, "ACTION → ORG-03 · mobile", "Типы компаний"),
    cloneShortcut(source, "ACTION → KB-06 · mobile", "Структура БЗ"),
  );
};

const setText = (root: HTMLElement, selector: string, text: string) => {
  const node = root.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`PROTOTYPE_SEARCH_COPY_MISSING: ${selector}`);
  node.textContent = text;
};

export const addSearchVideoResult = (active: HTMLElement, screen: ScreenDefinition) => {
  if (!screen.name.startsWith("SRCH-01 Выдача поиска") || screen.name.includes("пуст")) return;

  if (screen.format === "desktop") {
    const cards = active.querySelectorAll<HTMLElement>('[data-pencil-name="ACTION → KB-02-DESKTOP"]');
    const article = cards.item(0);
    const lastResult = cards.item(cards.length - 1);
    const results = article?.parentElement;
    if (!article || !lastResult || !results) throw new Error("PROTOTYPE_SEARCH_VIDEO_DESKTOP_MISSING");
    const addedHeight = Math.ceil(article.getBoundingClientRect().height) + 12;
    const video = article.cloneNode(true) as HTMLElement;
    clearDuplicatePencilIds(video);
    video.dataset.pencilName = "ACTION → KB-03-DESKTOP";
    video.dataset.prototypeAction = "ACTION → KB-03 Статья с видео";
    setText(video, '[data-pencil-name="SRCH-01 Результат 1 тип текст"]', "ВИДЕО");
    setText(
      video,
      '[data-pencil-name="SRCH-01 Результат 1 название"]',
      "Настройка интеграции с САПР-комплексом",
    );
    setText(video, '[data-pencil-name="SRCH-01 Результат 1 сниппет начало"]', "Видео: ");
    setText(video, '[data-pencil-name="SRCH-01 Результат 1 совпадение"]', "интеграция");
    setText(
      video,
      '[data-pencil-name="SRCH-01 Результат 1 сниппет конец"]',
      "с САПР по шагам и таймкодам.",
    );
    lastResult.after(video);
    active.style.height = `${screen.height + addedHeight}px`;
    return;
  }

  const cards = active.querySelectorAll<HTMLElement>('[data-pencil-name="ACTION → KB-02-MOBILE"]');
  const article = cards.item(0);
  const file = cards.item(1);
  const results = article?.parentElement;
  if (!article || !file || !results) throw new Error("PROTOTYPE_SEARCH_VIDEO_MOBILE_MISSING");
  const addedHeight = Math.ceil(article.getBoundingClientRect().height) + 12;
  const video = article.cloneNode(true) as HTMLElement;
  clearDuplicatePencilIds(video);
  video.dataset.pencilName = "ACTION → KB-03-MOBILE";
  video.dataset.prototypeAction = "ACTION → KB-03 Статья с видео";
  setText(video, '[data-pencil-name="SRCH-01 Mobile Результат 1 Тип"]', "ВИДЕО · НАВИСА");
  setText(
    video,
    '[data-pencil-name="SRCH-01 Mobile Результат 1 Заголовок"]',
    "Настройка интеграции с САПР-комплексом",
  );
  setText(
    video,
    '[data-pencil-name="SRCH-01 Mobile Результат 1 Сниппет"]',
    "Видеоинструкция с быстрыми переходами по ключевым этапам настройки.",
  );
  file.after(video);
  active.style.height = `${screen.height + addedHeight}px`;
};

import { useCallback, useEffect, useRef, useState } from "react";
import type { ScreenDefinition } from "../generated/screens";
import {
  addAdminHomeShortcuts,
  addSearchVideoResult,
  animateMobileDrawer,
  removeDeliveryStageCopy,
} from "../prototype/frame-enhancements";
import { enhanceFormControls } from "../prototype/form-enhancements";
import type { UserRole } from "../prototype/navigation";

interface DesignFrameProps {
  screen: ScreenDefinition;
  onAction: (actionName: string) => void;
  onDismiss?: () => void;
  focusTrap?: boolean;
  inactive?: boolean;
  overlay?: boolean;
  roleLabel: string;
  userRole: UserRole;
}

interface FrameSize {
  width: number;
  height: number;
}

const provisionalHeight = 900;

export const DesignFrame = ({
  screen,
  onAction,
  onDismiss,
  focusTrap = false,
  inactive = false,
  overlay = false,
  roleLabel,
  userRole,
}: DesignFrameProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [size, setSize] = useState<FrameSize>({
    width: screen.width,
    height: screen.height || provisionalHeight,
  });
  const [readyScreenId, setReadyScreenId] = useState("");
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    setSize({ width: screen.width, height: screen.height || provisionalHeight });
  }, [screen]);

  useEffect(() => {
    const updateWidth = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const prepareFrame = useCallback(() => {
    const iframe = iframeRef.current;
    const document = iframe?.contentDocument;
    if (!iframe || !document) return;

    const canvas = document.body.firstElementChild as HTMLElement | null;
    const active = document.querySelector<HTMLElement>(`[data-pencil-id="${screen.id}"]`);
    if (!canvas || !active || active.parentElement !== canvas) {
      throw new Error(`PROTOTYPE_FRAME_RENDER_FAILED: экран ${screen.id} не найден в ${screen.file}`);
    }

    for (const child of Array.from(canvas.children)) {
      if (child instanceof HTMLElement) child.style.display = child === active ? "flex" : "none";
    }
    document.documentElement.lang = "ru";
    document.documentElement.style.width = `${screen.width}px`;
    document.body.style.width = `${screen.width}px`;
    document.body.style.minWidth = `${screen.width}px`;
    document.body.style.overflow = "hidden";
    document.body.style.background = "transparent";
    canvas.style.width = `${screen.width}px`;
    canvas.style.height = "fit-content";
    canvas.style.position = "relative";
    active.style.left = "0";
    active.style.top = "0";
    active.style.position = "relative";

    active.querySelectorAll<HTMLElement>('[data-pencil-name="Navigation/Topbar Имя"]').forEach((node) => {
      node.textContent = roleLabel;
    });

    if (userRole !== "portal-admin") {
      active.querySelectorAll<HTMLElement>('[data-pencil-name^="ACTION → PLAT-"]').forEach((node) => {
        node.style.display = "none";
        node.setAttribute("aria-hidden", "true");
      });
    }

    if (userRole === "support-engineer" || userRole === "manager") {
      active
        .querySelectorAll<HTMLElement>('[data-pencil-name^="ACTION → ORG-04"]')
        .forEach((node) => {
          const name = node.dataset.pencilName?.toLowerCase();
          if (name?.includes("смена рол") || name?.includes("удал")) {
            node.style.display = "none";
            node.setAttribute("aria-hidden", "true");
          }
        });
      active
        .querySelectorAll<HTMLElement>(
          '[data-pencil-name="ORG-04 Роль подпись"], [data-pencil-name="ORG-04 Роль select"], [data-pencil-name="ORG-04 Invite Mobile Роль"]',
        )
        .forEach((node) => {
          node.style.display = "none";
          node.setAttribute("aria-hidden", "true");
        });
      active
        .querySelectorAll<HTMLElement>(
          '[data-pencil-name="ORG-04 Диалог описание"], [data-pencil-name="ORG-04 Invite Mobile Описание"]',
        )
        .forEach((node) => {
          node.textContent = "Добавьте доступ к порталу и при необходимости привяжите компанию.";
        });
    }

    addAdminHomeShortcuts(active, screen);
    addSearchVideoResult(active, screen);
    removeDeliveryStageCopy(active);
    animateMobileDrawer(active, screen);

    const setImplicitAction = (selector: string, action: string) => {
      active.querySelectorAll<HTMLElement>(selector).forEach((node) => {
        if (!node.dataset.pencilName?.startsWith("ACTION →")) node.dataset.prototypeAction = action;
      });
    };
    if (["CQojg", "n50Krp", "shAHh", "WmKrc"].includes(screen.id)) {
      const structureScreen = ["CQojg", "n50Krp"].includes(screen.id);
      const breadcrumbs = active.querySelector<HTMLElement>(
        structureScreen
          ? '[data-pencil-name="KB-06 Хлебные крошки"], [data-pencil-name="KB-06 Mobile Breadcrumb"]'
          : '[data-pencil-name="KB-07 Хлебные крошки"], [data-pencil-name="KB-07 Mobile Breadcrumb"]',
      );
      if (!breadcrumbs) {
        throw new Error(`PROTOTYPE_KB_BREADCRUMBS_MISSING: экран ${screen.id}`);
      }
      const nextLink = document.createElement("button");
      nextLink.type = "button";
      nextLink.dataset.prototypeAction = structureScreen
        ? "ACTION → KB-07 Теги и группы"
        : "ACTION → KB-08 Реестр файлов";
      nextLink.textContent = structureScreen
        ? "Теги"
        : screen.format === "mobile"
          ? "Файлы"
          : "Реестр файлов";
      nextLink.style.marginLeft = "auto";
      nextLink.style.border = "0";
      nextLink.style.background = "transparent";
      nextLink.style.color = "#1478BD";
      nextLink.style.font = "600 12px Inter, system-ui, sans-serif";
      nextLink.style.whiteSpace = "nowrap";
      breadcrumbs.append(nextLink);
    }
    setImplicitAction(
      '[data-pencil-name="KB-01 Статья 1"], [data-pencil-name="KB-01 Mobile Статья 1"]',
      "ACTION → KB-02 Статья",
    );
    setImplicitAction(
      '[data-pencil-name="KB-01 Статья 2"], [data-pencil-name="KB-01 Mobile Статья 2"]',
      "ACTION → KB-03 Статья с видео",
    );
    setImplicitAction(
      '[data-pencil-name="KB-01 Статья 3"], [data-pencil-name="KB-01 Mobile Статья 3"], [data-pencil-name="KB-01 Статья 5"], [data-pencil-name="KB-01 Mobile Статья 5"]',
      "ACTION → KB-02 Статья",
    );
    setImplicitAction(
      '[data-pencil-name="KB-01 Статья 4"], [data-pencil-name="KB-01 Mobile Статья 4"]',
      "ACTION → KB-04 Редактор статьи",
    );
    active
      .querySelectorAll<HTMLElement>('[data-pencil-name^="KB-01 Узел "]')
      .forEach((node) => {
        const name = node.dataset.pencilName;
        if (
          name &&
          /^KB-01 Узел (?:Продукты|НАВИСА|Установка|Настройка|Обновление|Кейсы внедрения|Администрирование)(?: · .+)?$/.test(
            name,
          )
        ) {
          node.dataset.prototypeAction = `ACTION → KB-01 дерево / ${name}`;
        }
      });
    setImplicitAction('[data-pencil-name="Navigation/Topbar Поиск"]', "ACTION → SRCH-01");
    setImplicitAction('[data-pencil-name^="SHELL-02 Mobile меню"]', "ACTION → SHELL-01-MOBILE-MENU");
    setImplicitAction(
      '[data-pencil-name="DISABLED · меню открыто для демонстрации"]',
      "ACTION → SHELL-02 Закрыть меню",
    );
    setImplicitAction('[data-pencil-name="KB-05 Публикация"]', "ACTION → KB-05 Публикация");
    setImplicitAction('[data-pencil-name^="KB-05 Опция тега "]', "ACTION → KB-05 Выбрать тег");
    setImplicitAction('[data-pencil-name^="KB-05 Доступ "]', "ACTION → KB-05 Изменить доступ");
    setImplicitAction('[data-pencil-name="KB-05 Создать тег"]', "ACTION → KB-07 Новый тег");
    active
      .querySelectorAll<HTMLElement>(
        '[data-pencil-name="KB-05 НАВИСА Настройка checkbox"], [data-pencil-name="KB-05 НАВИСА Установка checkbox"], [data-pencil-name="KB-05 Кейсы внедрения checkbox"]',
      )
      .forEach((node) => {
        node.dataset.prototypeAction = "ACTION → KB-05 Изменить раздел";
      });
    setImplicitAction('[data-pencil-name^="KB-08 Фильтр "]', "ACTION → KB-08 Фильтр PDF");
    setImplicitAction('[data-pencil-name^="Table/Usage "]', "ACTION → KB-08 Места использования");
    setImplicitAction('[data-pencil-name^="Table/Actions "]', "ACTION → KB-08 Скачать файл");
    setImplicitAction('[data-pencil-name^="Table/File Cell "]', "ACTION → KB-08 Скачать файл");

    const interactionStyles = document.createElement("style");
    interactionStyles.textContent = `
      [data-pencil-name^="ACTION "], [data-prototype-action] { cursor: pointer; transition: filter 150ms ease, transform 150ms ease, box-shadow 150ms ease; }
      [data-pencil-name^="ACTION "]:hover, [data-prototype-action]:hover { filter: brightness(0.97); transform: translateY(-1px); }
      [data-pencil-name^="ACTION "]:focus-visible, [data-prototype-action]:focus-visible { box-shadow: 0 0 0 3px rgba(20, 120, 189, 0.35); outline: none; }
      [data-pencil-name*="DISABLED"] { cursor: not-allowed !important; }
      [data-pencil-name="SHELL Кнопка помощника"],
      [data-pencil-name^="SHELL/Floating AI Assistant"] { display: none !important; pointer-events: none !important; visibility: hidden !important; }
      .prototype-toggled { filter: saturate(1.25) brightness(0.94) !important; }
      .prototype-control-active { box-shadow: 0 0 0 3px rgba(20, 120, 189, 0.25) !important; }
      .prototype-binary-off { filter: grayscale(0.8) opacity(0.58) !important; }
      .prototype-native-select {
        position: absolute; inset: 0; z-index: 2; width: 100%; height: 100%;
        appearance: none; border: 0; background: transparent; color: transparent; cursor: pointer;
      }
      .prototype-native-select option { color: #1b334b; }
      @keyframes prototype-drawer-in { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      @keyframes prototype-drawer-out { from { transform: translateX(0); } to { transform: translateX(-100%); } }
      .prototype-drawer-open { animation: prototype-drawer-in 180ms ease-out both; }
      .prototype-drawer-closing { animation: prototype-drawer-out 160ms ease-in both; }
    `;
    document.head.append(interactionStyles);

    const actionSelector = "[data-pencil-name^='ACTION '], [data-prototype-action]";
    const actionNodes = active.querySelectorAll<HTMLElement>(actionSelector);
    actionNodes.forEach((node) => {
      node.tabIndex = 0;
      node.setAttribute("role", "button");
      const actionName = node.dataset.prototypeAction ?? node.dataset.pencilName;
      node.setAttribute("aria-label", actionName?.replace("ACTION →", "Перейти:") ?? "Действие");
    });
    enhanceFormControls(active, onAction);

    const activate = (node: HTMLElement) => {
      node.classList.toggle("prototype-toggled");
      const actionName = node.dataset.prototypeAction ?? node.dataset.pencilName;
      if (!actionName) return;
      if (actionName.includes("SHELL-02 Закрыть меню")) {
        const drawer = active.querySelector<HTMLElement>('[data-pencil-name^="Открытое мобильное меню"]');
        drawer?.classList.add("prototype-drawer-closing");
        window.setTimeout(() => onAction(actionName), 160);
        return;
      }
      onAction(actionName);
    };
    const focusableElements = () =>
      Array.from(
        active.querySelectorAll<HTMLElement>(
          'button:not([disabled]), select:not([disabled]), [contenteditable="plaintext-only"], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((node) => node.getClientRects().length > 0 && node.getAttribute("aria-disabled") !== "true");
    const onActionClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest('[data-prototype-editable="true"], [data-prototype-select="true"]')) {
        event.stopPropagation();
        return;
      }
      const node = event.currentTarget as HTMLElement;
      event.preventDefault();
      event.stopPropagation();
      activate(node);
    };
    actionNodes.forEach((node) => node.addEventListener("click", onActionClick));
    const onClickOutsideAction = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest(actionSelector)) return;
      const profileMenu = active.querySelector<HTMLElement>('[data-pencil-name^="Профильное меню"]');
      if (profileMenu && target && !profileMenu.contains(target)) {
        event.preventDefault();
        event.stopPropagation();
        onAction("ACTION → SHELL-02 Закрыть меню профиля");
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onDismiss) {
        event.preventDefault();
        event.stopPropagation();
        onDismiss();
        return;
      }
      if (event.key === "Tab" && focusTrap) {
        const focusable = focusableElements();
        const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
        const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;
        if (currentIndex === -1 || nextIndex < 0 || nextIndex >= focusable.length) {
          event.preventDefault();
          focusable[event.shiftKey ? focusable.length - 1 : 0]?.focus();
        }
        return;
      }
      const target = event.target as Element | null;
      if (target?.closest('[data-prototype-select="true"]')) return;
      const editable = target?.closest<HTMLElement>('[data-prototype-editable="true"]');
      if (editable && (event.key !== "Enter" || editable.getAttribute("aria-multiline") === "true")) {
        return;
      }
      if (event.key !== "Enter" && event.key !== " ") return;
      const node = target?.closest<HTMLElement>(actionSelector);
      if (!node || !active.contains(node)) return;
      event.preventDefault();
      activate(node);
    };
    document.addEventListener("click", onClickOutsideAction);
    document.addEventListener("keydown", onKeyDown);

    const measure = () => {
      const height = Math.ceil(active.getBoundingClientRect().height || active.scrollHeight);
      if (height > 0) setSize({ width: screen.width, height });
    };
    measure();
    void document.fonts?.ready.then(measure);
    if (focusTrap) window.setTimeout(() => focusableElements()[0]?.focus(), 0);
    setReadyScreenId(screen.id);
  }, [focusTrap, onAction, onDismiss, roleLabel, screen, userRole]);

  const availableWidth = overlay ? Math.min(viewportWidth - 32, 760) : viewportWidth;
  const scale = Math.min(1, availableWidth / size.width);
  const displayedWidth = Math.round(size.width * scale);
  const displayedHeight = Math.round(size.height * scale);
  const source = `${import.meta.env.BASE_URL}design/${screen.file}`;

  return (
    <div
      className={overlay ? "relative max-h-[calc(100vh-32px)] overflow-auto" : "relative mx-auto overflow-hidden"}
      style={{ width: displayedWidth, height: displayedHeight }}
    >
      <iframe
        aria-hidden={inactive || undefined}
        className="absolute left-0 top-0 border-0 bg-transparent"
        key={screen.id}
        data-prototype-ready={readyScreenId === screen.id ? "true" : "false"}
        onLoad={prepareFrame}
        ref={iframeRef}
        src={source}
        tabIndex={inactive ? -1 : 0}
        style={{
          width: size.width,
          height: size.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: readyScreenId === screen.id ? "auto" : "none",
        }}
        title={screen.name}
      />
    </div>
  );
};

import { useCallback, useEffect, useRef, useState } from "react";
import type { ScreenDefinition } from "../generated/screens";

interface DesignFrameProps {
  screen: ScreenDefinition;
  onAction: (actionName: string) => void;
  overlay?: boolean;
}

interface FrameSize {
  width: number;
  height: number;
}

const provisionalHeight = 900;

export const DesignFrame = ({ screen, onAction, overlay = false }: DesignFrameProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [size, setSize] = useState<FrameSize>({
    width: screen.width,
    height: screen.height || provisionalHeight,
  });
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

    const interactionStyles = document.createElement("style");
    interactionStyles.textContent = `
      [data-pencil-name^="ACTION →"] { cursor: pointer; transition: filter 150ms ease, transform 150ms ease, box-shadow 150ms ease; }
      [data-pencil-name^="ACTION →"]:hover { filter: brightness(0.97); transform: translateY(-1px); }
      [data-pencil-name^="ACTION →"]:focus-visible { box-shadow: 0 0 0 3px rgba(20, 120, 189, 0.35); outline: none; }
      [data-pencil-name*="DISABLED"] { cursor: not-allowed !important; }
      .prototype-toggled { filter: saturate(1.25) brightness(0.94) !important; }
    `;
    document.head.append(interactionStyles);

    const actionNodes = active.querySelectorAll<HTMLElement>("[data-pencil-name^='ACTION →']");
    actionNodes.forEach((node) => {
      node.tabIndex = 0;
      node.setAttribute("role", "button");
      node.setAttribute("aria-label", node.dataset.pencilName?.replace("ACTION →", "Перейти:") ?? "Действие");
    });

    const activate = (node: HTMLElement) => {
      node.classList.toggle("prototype-toggled");
      const actionName = node.dataset.pencilName;
      if (actionName) onAction(actionName);
    };
    const onClick = (event: MouseEvent) => {
      const node = (event.target as Element | null)?.closest<HTMLElement>("[data-pencil-name^='ACTION →']");
      if (!node || !active.contains(node)) return;
      event.preventDefault();
      event.stopPropagation();
      activate(node);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const node = (event.target as Element | null)?.closest<HTMLElement>("[data-pencil-name^='ACTION →']");
      if (!node || !active.contains(node)) return;
      event.preventDefault();
      activate(node);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);

    const measure = () => {
      const height = Math.ceil(active.getBoundingClientRect().height || active.scrollHeight);
      if (height > 0) setSize({ width: screen.width, height });
    };
    measure();
    void document.fonts?.ready.then(measure);
  }, [onAction, screen]);

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
        className="absolute left-0 top-0 border-0 bg-transparent"
        key={screen.id}
        onLoad={prepareFrame}
        ref={iframeRef}
        src={source}
        style={{
          width: size.width,
          height: size.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        title={screen.name}
      />
    </div>
  );
};

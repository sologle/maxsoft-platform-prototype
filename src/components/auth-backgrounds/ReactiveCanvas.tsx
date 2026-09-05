import { useLayoutEffect, useRef, type RefObject } from "react";
import type { DrawScene, SceneFactory, ScenePointer } from "./scene-types";

const MAX_PIXEL_RATIO = 2;
const MAX_BACKING_PIXELS = 6_000_000;
const MAX_DELTA_SECONDS = 1 / 30;
export const ReactiveCanvas = ({ createScene, darkBackground, pointer }: {
  createScene: SceneFactory;
  darkBackground: string;
  pointer: RefObject<ScenePointer>;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("AUTH_BACKGROUND_UNAVAILABLE: Не удалось показать фон. Обновите страницу.");
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let draw: DrawScene;
    let frame: number | null = null;
    let previousTime: number | null = null;
    let elapsed = 0;
    let dark = document.documentElement.dataset.theme === "dark";

    const stop = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      previousTime = null;
    };
    const render = (now: number) => {
      frame = null;
      const motion = !preference.matches;
      const delta = motion && previousTime !== null ? Math.min((now - previousTime) / 1000, MAX_DELTA_SECONDS) : 0;
      previousTime = now;
      elapsed += delta;
      context.fillStyle = dark ? darkBackground : "#ffffff";
      context.fillRect(0, 0, width, height);
      draw({ context, width, height, delta, time: elapsed, pointer: pointer.current, dark, motion });
      if (motion && !document.hidden) frame = window.requestAnimationFrame(render);
    };
    const refresh = () => {
      stop();
      if (width > 0 && height > 0) render(performance.now());
    };
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) { stop(); return; }
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO, Math.sqrt(MAX_BACKING_PIXELS / (width * height)));
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
      draw = createScene(width, height);
      refresh();
    };
    const themeObserver = new MutationObserver(() => {
      dark = document.documentElement.dataset.theme === "dark";
      refresh();
    });
    const sizeObserver = new ResizeObserver(resize);
    const visibilityChanged = () => document.hidden ? stop() : refresh();
    resize();
    sizeObserver.observe(canvas);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    preference.addEventListener("change", refresh);
    document.addEventListener("visibilitychange", visibilityChanged);
    // ResizeObserver alone does not cover moving a window between displays with different DPR.
    window.addEventListener("resize", resize);
    return () => {
      stop();
      sizeObserver.disconnect();
      themeObserver.disconnect();
      preference.removeEventListener("change", refresh);
      document.removeEventListener("visibilitychange", visibilityChanged);
      window.removeEventListener("resize", resize);
    };
  }, [createScene, darkBackground, pointer]);

  return <canvas className="auth-reactive-canvas" data-testid="auth-reactive-canvas" ref={canvasRef} />;
};

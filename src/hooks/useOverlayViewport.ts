import { useLayoutEffect, type RefObject } from "react";

// The visual viewport shrinks above the on-screen keyboard and under pinch zoom.
export const useOverlayViewport = (ref: RefObject<HTMLElement | null>) => {
  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return; // jsdom/embedded windows keep the CSS viewport sizing.
    const update = () => {
      const element = ref.current;
      if (!element) return;
      Object.assign(element.style, {
        top: `${viewport.offsetTop}px`,
        left: `${viewport.offsetLeft}px`,
        width: `${viewport.width}px`,
        height: `${viewport.height}px`,
        right: "auto",
        bottom: "auto",
      });
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [ref]);
};

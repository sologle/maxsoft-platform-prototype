import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { ThemeToggle } from "./Theme";
import { BackgroundArt } from "./auth-backgrounds/BackgroundArt";
import { BackgroundPicker, readBackground, type AuthBackground } from "./auth-backgrounds/BackgroundPicker";
import type { ScenePointer } from "./auth-backgrounds/scene-types";
import "./auth-backgrounds/base.css";
import "./auth-backgrounds/variants.css";

export const AuthStage = ({ children, layout }: {
  children: ReactNode | ((variant: AuthBackground) => ReactNode);
  layout: "landing" | "form";
}) => {
  const stageRef = useRef<HTMLElement>(null);
  const pointerRef = useRef<ScenePointer>({ x: 0, y: 0, active: false });
  const frameRef = useRef<number | null>(null);
  const [{ variant, comparing }, setBackground] = useState(readBackground);

  useEffect(() => {
    const syncBackground = () => setBackground(readBackground());
    window.addEventListener("popstate", syncBackground);
    return () => {
      window.removeEventListener("popstate", syncBackground);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const setPointer = (x: number, y: number) => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      const style = stageRef.current?.style;
      style?.setProperty("--pointer-x", `${x}%`);
      style?.setProperty("--pointer-y", `${y}%`);
      frameRef.current = null;
    });
  };

  const moveBackdrop = (event: PointerEvent<HTMLElement>) => {
    if (variant !== "minimal") {
      pointerRef.current = { x: event.clientX, y: event.clientY, active: true };
      return;
    }
    if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setPointer(((event.clientX - bounds.left) / bounds.width) * 100, ((event.clientY - bounds.top) / bounds.height) * 100);
  };

  const leaveBackdrop = () => {
    pointerRef.current.active = false;
    if (variant === "minimal") setPointer(50, 50);
  };

  const changeBackground = (next: AuthBackground) => {
    pointerRef.current.active = false;
    const url = new URL(window.location.href);
    url.searchParams.set("background", next);
    window.history.replaceState(window.history.state, "", url);
    setBackground({ variant: next, comparing: true });
  };

  return (
    <main
      className="portal-auth-stage"
      data-comparing={comparing}
      onPointerCancel={variant !== "minimal" ? leaveBackdrop : undefined}
      onPointerDown={variant !== "minimal" ? moveBackdrop : undefined}
      onPointerLeave={leaveBackdrop}
      onPointerUp={(event) => { if (variant !== "minimal" && event.pointerType === "touch") leaveBackdrop(); }}
      onPointerMove={moveBackdrop}
      ref={stageRef}
    >
      <div aria-hidden="true" className="portal-auth-backdrop" data-background={variant} data-testid="portal-auth-backdrop">
        <BackgroundArt key={variant} pointer={pointerRef} variant={variant} showWordmark={layout === "landing"} />
      </div>
      {comparing ? <BackgroundPicker onChange={changeBackground} value={variant} /> : null}
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6"><ThemeToggle /></div>
      <div className="portal-auth-content">{typeof children === "function" ? children(variant) : children}</div>
    </main>
  );
};

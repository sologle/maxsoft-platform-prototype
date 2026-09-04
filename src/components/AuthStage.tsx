import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { ThemeToggle } from "./Theme";

export const AuthStage = ({ children }: { children: ReactNode }) => {
  const stageRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const moveBackdrop = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      stageRef.current?.style.setProperty("--pointer-x", `${x}%`);
      stageRef.current?.style.setProperty("--pointer-y", `${y}%`);
    });
  };

  return (
    <main
      className="portal-auth-stage"
      onPointerMove={moveBackdrop}
      ref={stageRef}
    >
      <div aria-hidden="true" className="portal-auth-backdrop" data-testid="portal-auth-backdrop">
        <div className="portal-auth-grid" />
        <div className="portal-auth-glow" />
        <div className="portal-auth-orbit portal-auth-orbit-one" />
        <div className="portal-auth-orbit portal-auth-orbit-two" />
        <div className="portal-auth-word">MAXSOFT</div>
      </div>
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="relative z-10 min-h-dvh">{children}</div>
    </main>
  );
};

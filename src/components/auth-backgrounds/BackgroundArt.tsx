import type { RefObject } from "react";
import type { AuthBackground } from "./BackgroundPicker";
import { ReactiveCanvas } from "./ReactiveCanvas";
import type { ScenePointer } from "./scene-types";

export const BackgroundArt = ({ variant, pointer, showWordmark }: {
  variant: AuthBackground;
  showWordmark: boolean;
  pointer: RefObject<ScenePointer>;
}) => variant === "minimal" ? (
  <>
    <div className="portal-auth-grid" />
    <div className="portal-auth-glow" />
    <div className="portal-auth-orbit portal-auth-orbit-one" />
    <div className="portal-auth-orbit portal-auth-orbit-two" />
    <div className="portal-auth-word">MAXSOFT</div>
  </>
) : <ReactiveCanvas pointer={pointer} variant={variant} showWordmark={showWordmark} />;

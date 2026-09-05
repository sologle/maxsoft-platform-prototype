import { lazy, Suspense, type RefObject } from "react";
import type { AuthBackground } from "./background-state";
import { ReactiveCanvas } from "./ReactiveCanvas";
import { createAmbientField, createWordmarkField } from "./field-scene";
import type { ScenePointer } from "./scene-types";

const ArchivedBackgroundArt = lazy(() => import("./archive/BackgroundArt"));

export const BackgroundArt = ({ variant, pointer, showWordmark }: {
  variant: AuthBackground;
  showWordmark: boolean;
  pointer: RefObject<ScenePointer>;
}) => variant === "wordmark" ? (
  <ReactiveCanvas pointer={pointer} createScene={showWordmark ? createWordmarkField : createAmbientField} darkBackground="#0c1722" />
) : (
  <Suspense fallback={null}>
    <ArchivedBackgroundArt variant={variant} pointer={pointer} showWordmark={showWordmark} />
  </Suspense>
);

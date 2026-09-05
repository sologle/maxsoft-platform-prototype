import type { RefObject } from "react";
import type { AuthBackground } from "../background-state";
import { ReactiveCanvas } from "../ReactiveCanvas";
import { createAmbientField, createLivingField, createWordmarkField } from "../field-scene";
import type { ScenePointer } from "../scene-types";
import { createEcho } from "./echo-scene";
import { createSilk } from "./silk-scene";
import { createRibbon } from "./ribbon-scene";
import { ScatterExperiment } from "./ScatterExperiment";
import "./minimal.css";

const scenes = { echo: createEcho, silk: createSilk, ribbon: createRibbon, "living-field": createLivingField };
const colors = { echo: "#0d1825", silk: "#101c29", ribbon: "#0c1724", "living-field": "#0c1722" };

export default function ArchivedBackgroundArt({ variant, pointer, showWordmark }: {
  showWordmark: boolean;
  variant: AuthBackground;
  pointer: RefObject<ScenePointer>;
}) {
  if (variant === "wordmark") return <ReactiveCanvas pointer={pointer} createScene={showWordmark ? createWordmarkField : createAmbientField} darkBackground="#0c1722" />;
  if (variant === "scatter") return showWordmark ? <ScatterExperiment pointer={pointer} /> : <ReactiveCanvas pointer={pointer} createScene={createAmbientField} darkBackground="#0c1722" />;
  if (variant === "minimal") return (
    <>
      <div className="portal-auth-grid" />
      <div className="portal-auth-glow" />
      <div className="portal-auth-orbit portal-auth-orbit-one" />
      <div className="portal-auth-orbit portal-auth-orbit-two" />
      <div className="portal-auth-word">MAXSOFT</div>
    </>
  );
  return <ReactiveCanvas pointer={pointer} createScene={scenes[variant]} darkBackground={colors[variant]} />;
}

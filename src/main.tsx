import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("PROTOTYPE_ROOT_MISSING: не найден корневой элемент приложения");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

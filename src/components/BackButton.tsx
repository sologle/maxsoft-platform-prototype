import { ArrowLeft } from "lucide-react";
import type { AppPage, Navigate } from "../app/types";
import { Button } from "./ui";
export const goBack = (onNavigate: Navigate, fallback: AppPage, resource?: string) => {
  if (window.history.state?.maxsoftBack) window.history.back();
  else onNavigate(fallback, resource);
};
export const BackButton = ({
  onNavigate,
  fallback = "knowledge",
  resource,
}: {
  onNavigate: Navigate;
  fallback?: AppPage;
  resource?: string;
}) => (
  <Button
    aria-label="Назад"
    icon={<ArrowLeft className="h-4 w-4" />}
    onClick={() => goBack(onNavigate, fallback, resource)}
    tone="secondary"
  >
    Назад
  </Button>
);

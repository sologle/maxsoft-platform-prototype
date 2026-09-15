import {
  BookOpen,
  Building2,
  Home,
  Search,
  Settings,
  UsersRound,
} from "lucide-react";
import { canOpenPage } from "./routes";
import type { AppPage, UserRole } from "./types";

const navigation: { icon: typeof Home; label: string; page: AppPage }[] = [
  { icon: Home, label: "Главная", page: "home" },
  { icon: BookOpen, label: "База знаний", page: "knowledge" },
  { icon: Search, label: "Поиск", page: "search" },
  { icon: Building2, label: "Компании", page: "companies" },
  { icon: UsersRound, label: "Пользователи", page: "users" },
  { icon: UsersRound, label: "Сотрудники", page: "client-users" },
  { icon: Settings, label: "Администрирование", page: "administration" },
];
export const navigationForRole = (role: UserRole) =>
  navigation.filter(({ page }) => canOpenPage(page, role));

export const profileNavigation = [
  { label: "Как пользоваться порталом", page: "help" as const },
];

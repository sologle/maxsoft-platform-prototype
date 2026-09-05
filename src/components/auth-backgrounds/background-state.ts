export const backgroundOptions = [
  { id: "minimal", label: "Тишина", description: "Минимум деталей · мягкий свет и тонкая сетка" },
  { id: "echo", label: "Эхо", description: "Ведите курсор: волны расходятся по точкам, как круги по воде" },
  { id: "silk", label: "Шёлк", description: "Потяните мышью невесомую ткань — нити плавно вернутся на место" },
  { id: "ribbon", label: "След", description: "Рисуйте курсором: световые ленты переплетаются и медленно гаснут" },
  { id: "living-field", label: "Живое", description: "Штрихи вращаются, следуют за курсором и в паузах складываются в MaxSoft" },
  { id: "wordmark", label: "MaxSoft", description: "Прежний вариант · мягкая орбита без разлёта" },
  { id: "scatter", label: "Разлёт", description: "Выбранный вариант · орбита, разлёт и возврат; здесь можно менять настройки" },
] as const;

export type AuthBackground = (typeof backgroundOptions)[number]["id"];

export const readBackground = (): { variant: AuthBackground; comparing: boolean } => {
  const params = new URLSearchParams(window.location.search);
  const value = params.get("background");
  const comparing = params.get("backgroundArchive") === "1";
  return {
    variant: comparing ? backgroundOptions.find((option) => option.id === value)?.id ?? "scatter" : "scatter",
    comparing,
  };
};


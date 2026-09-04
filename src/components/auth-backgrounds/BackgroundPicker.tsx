export const backgroundOptions = [
  { id: "minimal", label: "Тишина", description: "Минимум деталей · мягкий свет и тонкая сетка" },
  { id: "field", label: "Поле", description: "Ведите курсор: штрихи изгибаются и поворачиваются рядом с ним" },
  { id: "swarm", label: "Рой", description: "Ведите курсор: частицы собираются в вихрь и оставляют след" },
  { id: "signal", label: "Сигнал", description: "Наведите курсор: ближайший узел отправит импульсы по связям" },
  { id: "living-field", label: "Живое", description: "Штрихи вращаются, следуют за курсором и в паузах складываются в MaxSoft" },
] as const;

export type AuthBackground = (typeof backgroundOptions)[number]["id"];

export const readBackground = (): { variant: AuthBackground; comparing: boolean } => {
  const value = new URLSearchParams(window.location.search).get("background");
  return {
    variant: backgroundOptions.find((option) => option.id === value)?.id ?? "minimal",
    comparing: value !== null,
  };
};

export const BackgroundPicker = ({ value, onChange }: {
  value: AuthBackground;
  onChange: (value: AuthBackground) => void;
}) => (
  <div className="auth-background-picker">
    <div aria-label="Варианты фона" className="auth-background-options" role="group">
      {backgroundOptions.map((option, index) => (
        <button
          aria-pressed={value === option.id}
          className="auth-background-option"
          key={option.id}
          onClick={() => onChange(option.id)}
          title={option.description}
          type="button"
        >
          <span aria-hidden="true" className={`auth-background-swatch auth-swatch-${option.id}`} />
          <span><small>0{index + 1}</small><strong>{option.label}</strong></span>
        </button>
      ))}
    </div>
    <p aria-live="polite" className="auth-background-caption">
      {backgroundOptions.find((option) => option.id === value)?.description}
    </p>
  </div>
);

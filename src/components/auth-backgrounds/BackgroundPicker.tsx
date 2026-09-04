export const backgroundOptions = [
  { id: "minimal", label: "Тишина", description: "Минимум деталей · мягкий свет и тонкая сетка" },
  { id: "flow", label: "Поток", description: "Плавные линии · движение и лёгкость" },
  { id: "prism", label: "Призма", description: "Стеклянная геометрия · объём и глубина" },
  { id: "orbit", label: "Орбита", description: "Цифровая сфера · частицы и световые траектории" },
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

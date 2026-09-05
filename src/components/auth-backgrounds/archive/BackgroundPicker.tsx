import { backgroundOptions, type AuthBackground } from "../background-state";
import "./archive.css";

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

export default BackgroundPicker;

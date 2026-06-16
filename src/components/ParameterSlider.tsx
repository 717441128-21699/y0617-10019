interface ParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
}

export default function ParameterSlider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  unit = "",
}: ParameterSliderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
          {label}
        </span>
        <span className="text-[11px] font-mono text-cyan-400 tabular-nums">
          {value.toFixed(2)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider-input"
      />
    </div>
  );
}

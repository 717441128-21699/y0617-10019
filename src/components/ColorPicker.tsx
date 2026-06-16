interface ColorPickerProps {
  label: string;
  color: { r: number; g: number; b: number; a: number };
  onChange: (r: number, g: number, b: number, a: number) => void;
}

export default function ColorPicker({ label, color, onChange }: ColorPickerProps) {
  const hex = rgbaToHex(color.r, color.g, color.b);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={hex}
            onChange={(e) => {
              const [r, g, b] = hexToRgb(e.target.value);
              onChange(r, g, b, color.a);
            }}
            className="w-8 h-8 rounded-lg cursor-pointer border border-white/10 bg-transparent appearance-none"
            style={{ padding: 0 }}
          />
        </div>
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={color.a}
            onChange={(e) => onChange(color.r, color.g, color.b, parseFloat(e.target.value))}
            className="slider-input"
          />
        </div>
        <span className="text-[10px] font-mono text-cyan-400/70 w-8 text-right">
          {(color.a * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function rgbaToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => {
    const h = Math.round(v * 255).toString(16);
    return h.length === 1 ? "0" + h : h;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

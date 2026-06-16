import { useRef } from "react";
import { useParticleStore } from "@/store/useParticleStore";
import { ParticleConfig } from "@/store/particleStore";
import { Download, Upload, RotateCcw, ChevronLeft, ChevronRight, Settings } from "lucide-react";

export default function ExportButton() {
  const { config, loadConfig } = useParticleStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "particle-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as ParticleConfig;
        if (data.emissionRate !== undefined) {
          loadConfig(data);
        }
      } catch {
        console.error("Invalid config file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleExport}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl
                   bg-gradient-to-r from-cyan-600/80 to-teal-600/80
                   hover:from-cyan-500 hover:to-teal-500
                   text-white text-xs font-semibold tracking-wider uppercase
                   transition-all duration-200 shadow-lg shadow-cyan-900/30
                   hover:shadow-cyan-700/40 border border-cyan-400/20"
      >
        <Download size={14} />
        Export JSON
      </button>
      <button
        onClick={handleImport}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl
                   bg-white/5 hover:bg-white/10 border border-white/10
                   text-slate-300 text-xs font-semibold tracking-wider uppercase
                   transition-all duration-200"
      >
        <Upload size={14} />
        Import JSON
      </button>
    </div>
  );
}

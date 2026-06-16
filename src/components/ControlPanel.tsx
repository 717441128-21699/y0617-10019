import { useParticleStore } from "@/store/useParticleStore";
import ParameterSlider from "@/components/ParameterSlider";
import ColorPicker from "@/components/ColorPicker";
import ExportButton from "@/components/ExportButton";
import {
  ChevronLeft, ChevronRight, RotateCcw, Zap,
  Sparkles, Target, Download,
} from "lucide-react";

export default function ControlPanel() {
  const {
    particleConfig,
    explosionConfig,
    setEmissionRate,
    setGravity,
    setWind,
    setTurbulence,
    setColorStart,
    setColorEnd,
    setParticleSize,
    setExplosionStrength,
    setExplosionRadius,
    setExplosionDuration,
    presets,
    activePresetId,
    applyPreset,
    resetConfig,
    panelOpen,
    togglePanel,
  } = useParticleStore();

  return (
    <>
      <button
        onClick={togglePanel}
        className="fixed top-4 left-4 z-50 w-10 h-10 rounded-xl
                   bg-black/50 backdrop-blur-xl border border-cyan-500/20
                   flex items-center justify-center text-cyan-400
                   hover:bg-black/70 hover:border-cyan-400/40
                   transition-all duration-300 shadow-lg"
        title={panelOpen ? "Close panel" : "Open panel"}
      >
        {panelOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      <div
        className={`fixed top-0 left-0 z-40 h-full w-[310px] transition-transform duration-300 ease-out
                    ${panelOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-full bg-black/50 backdrop-blur-2xl border-r border-cyan-500/10 overflow-y-auto custom-scrollbar">
          <div className="p-5 pt-16 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-cyan-300">
                Particle Workbench
              </h2>
              <button
                onClick={resetConfig}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors"
                title="Reset to defaults"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            <div className="h-px bg-gradient-to-r from-cyan-500/30 via-cyan-500/10 to-transparent" />

            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-fuchsia-400/80 font-bold">
                <Sparkles size={12} />
                Presets
              </div>
              <div className="grid grid-cols-3 gap-2">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-1.5 rounded-xl
                               text-[10px] font-medium transition-all duration-200
                               border ${activePresetId === p.id
                      ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-lg shadow-cyan-900/30"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-lg leading-none">{p.icon}</span>
                    <span className="uppercase tracking-wider">{p.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <div className="h-px bg-gradient-to-r from-cyan-500/30 via-cyan-500/10 to-transparent" />

            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-amber-400/80 font-bold">
                <Zap size={12} />
                Emission
              </div>
              <ParameterSlider
                label="Rate"
                value={particleConfig.emissionRate}
                min={0}
                max={1}
                step={0.01}
                onChange={setEmissionRate}
              />
              <ParameterSlider
                label="Size"
                value={particleConfig.particleSize}
                min={0.5}
                max={20}
                step={0.1}
                onChange={setParticleSize}
                unit="px"
              />
            </section>

            <div className="h-px bg-gradient-to-r from-cyan-500/30 via-cyan-500/10 to-transparent" />

            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-emerald-400/80 font-bold">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M2 12h20" />
                </svg>
                Forces
              </div>
              <ParameterSlider
                label="Gravity X"
                value={particleConfig.gravity.x}
                min={-5}
                max={5}
                step={0.1}
                onChange={(v) => setGravity(v, particleConfig.gravity.y)}
              />
              <ParameterSlider
                label="Gravity Y"
                value={particleConfig.gravity.y}
                min={-10}
                max={10}
                step={0.1}
                onChange={(v) => setGravity(particleConfig.gravity.x, v)}
              />
              <ParameterSlider
                label="Wind X"
                value={particleConfig.wind.x}
                min={-5}
                max={5}
                step={0.1}
                onChange={(v) => setWind(v, particleConfig.wind.y)}
              />
              <ParameterSlider
                label="Wind Y"
                value={particleConfig.wind.y}
                min={-5}
                max={5}
                step={0.1}
                onChange={(v) => setWind(particleConfig.wind.x, v)}
              />
              <ParameterSlider
                label="Turbulence"
                value={particleConfig.turbulence}
                min={0}
                max={3}
                step={0.01}
                onChange={setTurbulence}
              />
            </section>

            <div className="h-px bg-gradient-to-r from-cyan-500/30 via-cyan-500/10 to-transparent" />

            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-orange-400/80 font-bold">
                <Target size={12} />
                Explosion
              </div>
              <ParameterSlider
                label="Strength"
                value={explosionConfig.strength}
                min={1000}
                max={40000}
                step={500}
                onChange={setExplosionStrength}
              />
              <ParameterSlider
                label="Radius"
                value={explosionConfig.radius}
                min={30}
                max={600}
                step={5}
                onChange={setExplosionRadius}
                unit="px"
              />
              <ParameterSlider
                label="Duration"
                value={explosionConfig.duration}
                min={0.3}
                max={4}
                step={0.05}
                onChange={setExplosionDuration}
                unit="s"
              />
            </section>

            <div className="h-px bg-gradient-to-r from-cyan-500/30 via-cyan-500/10 to-transparent" />

            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-violet-400/80 font-bold">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
                Color Gradient
              </div>
              <ColorPicker
                label="Start Color"
                color={particleConfig.colorStart}
                onChange={setColorStart}
              />
              <ColorPicker
                label="End Color"
                color={particleConfig.colorEnd}
                onChange={setColorEnd}
              />
              <div
                className="h-3 rounded-full border border-white/10"
                style={{
                  background: `linear-gradient(to right,
                    rgba(${Math.round(particleConfig.colorStart.r * 255)}, ${Math.round(particleConfig.colorStart.g * 255)}, ${Math.round(particleConfig.colorStart.b * 255)}, ${particleConfig.colorStart.a}),
                    rgba(${Math.round(particleConfig.colorEnd.r * 255)}, ${Math.round(particleConfig.colorEnd.g * 255)}, ${Math.round(particleConfig.colorEnd.b * 255)}, ${particleConfig.colorEnd.a}))`,
                }}
              />
            </section>

            <div className="h-px bg-gradient-to-r from-cyan-500/30 via-cyan-500/10 to-transparent" />

            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-rose-400/80 font-bold">
                <Download size={12} />
                Config I/O
              </div>
              <ExportButton />
            </section>

            <div className="pb-4" />

            <div className="text-[10px] text-slate-500 text-center leading-relaxed">
              Click canvas to trigger explosion &middot; up to 8 simultaneous
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

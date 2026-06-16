import { useState, useRef, useEffect } from "react";
import { useParticleStore } from "@/store/useParticleStore";
import { EMITTER_SHAPES } from "@/store/particleStore";
import ParameterSlider from "@/components/ParameterSlider";
import ColorPicker from "@/components/ColorPicker";
import ExportButton from "@/components/ExportButton";
import {
  ChevronLeft, ChevronRight, RotateCcw, Zap,
  Sparkles, Target, Download, Circle,
  Save, Trash2, Edit2, Check, X,
  Play, Square, Pause,
} from "lucide-react";

export default function ControlPanel() {
  const {
    particleConfig,
    explosionConfig,
    builtinPresets,
    customPresets,
    activePresetId,
    isRecording,
    isPlaying,
    playbackTime,
    currentRecordingId,
    recordings,
    recordingEvents,
    setEmissionRate,
    setGravity,
    setWind,
    setTurbulence,
    setColorStart,
    setColorEnd,
    setParticleSize,
    setEmitterShape,
    setExplosionStrength,
    setExplosionRadius,
    setExplosionDuration,
    applyPreset,
    saveAsCustomPreset,
    renameCustomPreset,
    deleteCustomPreset,
    startRecording,
    stopRecording,
    cancelRecording,
    startPlayback,
    stopPlayback,
    deleteRecording,
    resetConfig,
    panelOpen,
    togglePanel,
  } = useParticleStore();

  const allPresets = [...builtinPresets, ...customPresets];

  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [stopOpen, setStopOpen] = useState(false);
  const [recName, setRecName] = useState("");

  const saveInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const recNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (saveOpen && saveInputRef.current) saveInputRef.current.focus();
  }, [saveOpen]);

  useEffect(() => {
    if (stopOpen && recNameInputRef.current) recNameInputRef.current.focus();
  }, [stopOpen]);

  useEffect(() => {
    if (editingId && renameInputRef.current) renameInputRef.current.focus();
  }, [editingId]);

  const handleSavePreset = () => {
    if (!saveName.trim()) return;
    saveAsCustomPreset(saveName.trim());
    setSaveName("");
    setSaveOpen(false);
  };

  const handleStartRecording = () => {
    setRecName("");
    startRecording();
  };

  const handleStopRecording = () => {
    if (!recName.trim()) {
      stopRecording(`Recording ${recordings.length + 1}`);
    } else {
      stopRecording(recName.trim());
    }
    setStopOpen(false);
    setRecName("");
  };

  const currentRecording = recordings.find((r) => r.id === currentRecordingId);

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
        className={`fixed top-0 left-0 z-40 h-full w-[320px] transition-transform duration-300 ease-out
                    ${panelOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-full bg-black/50 backdrop-blur-2xl border-r border-cyan-500/10 overflow-y-auto custom-scrollbar">
          <div className="p-5 pt-16 flex flex-col gap-5">
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

            {/* 录制控制 */}
            <section className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-sky-400/90 font-bold">
                <Circle size={12} className={isRecording ? "text-red-400 animate-pulse" : ""} />
                Timeline
              </div>
              <div className="flex gap-2">
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    disabled={isPlaying}
                    className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 rounded-lg
                               bg-red-500/20 hover:bg-red-500/30 border border-red-400/30
                               text-red-300 text-xs font-semibold transition-all
                               disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Circle size={12} fill="currentColor" />
                    Record
                  </button>
                ) : (
                  <>
                    <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-400/30 text-red-300 text-xs">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      {recordingEvents.length} events
                    </div>
                    <button
                      onClick={() => { setRecName(""); setStopOpen(true); }}
                      className="flex items-center justify-center w-10 py-2 rounded-lg
                                 bg-red-500/20 hover:bg-red-500/40 border border-red-400/30
                                 text-red-300 transition-all"
                      title="Stop recording"
                    >
                      <Square size={12} fill="currentColor" />
                    </button>
                  </>
                )}
                {!isPlaying ? (
                  recordings.length > 0 && !isRecording && (
                    <button
                      onClick={() => startPlayback(recordings[recordings.length - 1].id)}
                      className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 rounded-lg
                                 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30
                                 text-emerald-300 text-xs font-semibold transition-all"
                    >
                      <Play size={12} />
                      Replay Last
                    </button>
                  )
                ) : (
                  <button
                    onClick={stopPlayback}
                    className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 rounded-lg
                               bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30
                               text-amber-300 text-xs font-semibold transition-all"
                  >
                    <Pause size={12} />
                    Stop
                  </button>
                )}
              </div>

              {isPlaying && currentRecording && (
                <div className="text-[10px] text-slate-400 font-mono">
                  ▶ {currentRecording.name} &middot; {playbackTime.toFixed(1)}s / {currentRecording.duration.toFixed(1)}s
                </div>
              )}

              {recordings.length > 0 && !isRecording && (
                <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {recordings.slice().reverse().map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all
                                 ${currentRecordingId === r.id
                        ? "bg-emerald-500/15 border border-emerald-400/30 text-emerald-300"
                        : "bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <span className="flex-1 truncate">{r.name}</span>
                      <span className="text-[10px] text-slate-500 mr-2 tabular-nums">
                        {r.duration.toFixed(1)}s
                      </span>
                      <button
                        onClick={() => currentRecordingId === r.id ? stopPlayback() : startPlayback(r.id)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-emerald-300"
                        title={currentRecordingId === r.id ? "Stop" : "Play"}
                      >
                        {currentRecordingId === r.id ? <Pause size={12} /> : <Play size={12} />}
                      </button>
                      <button
                        onClick={() => deleteRecording(r.id)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="h-px bg-gradient-to-r from-cyan-500/30 via-cyan-500/10 to-transparent" />

            {/* 预设 */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-fuchsia-400/80 font-bold">
                  <Sparkles size={12} />
                  Presets
                </div>
                {!saveOpen && (
                  <button
                    onClick={() => { setSaveName(""); setSaveOpen(true); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10
                               text-[10px] text-slate-400 hover:text-fuchsia-300 transition-colors"
                  >
                    <Save size={11} />
                    Save
                  </button>
                )}
              </div>

              {saveOpen && (
                <div className="flex gap-2 items-center">
                  <input
                    ref={saveInputRef}
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSavePreset(); else if (e.key === "Escape") setSaveOpen(false); }}
                    placeholder="My preset"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10
                               text-xs text-slate-200 placeholder-slate-500
                               focus:outline-none focus:border-fuchsia-400/50"
                  />
                  <button
                    onClick={handleSavePreset}
                    className="p-1.5 rounded-md bg-fuchsia-500/20 hover:bg-fuchsia-500/30
                               text-fuchsia-300 border border-fuchsia-400/30"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => setSaveOpen(false)}
                    className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {allPresets.map((p) => (
                  <div key={p.id} className="relative group">
                    <button
                      onClick={() => applyPreset(p.id)}
                      className={`w-full flex flex-col items-center gap-1 py-2.5 px-1.5 rounded-xl
                                 text-[10px] font-medium transition-all duration-200 border
                                 ${activePresetId === p.id
                        ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-lg shadow-cyan-900/30"
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-lg leading-none">{p.icon}</span>
                      <span className="uppercase tracking-wider truncate w-full px-1">
                        {editingId === p.id ? (
                          <input
                            ref={renameInputRef}
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                renameCustomPreset(p.id, editingName.trim());
                                setEditingId(null);
                              } else if (e.key === "Escape") {
                                setEditingId(null);
                              }
                              e.stopPropagation();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-transparent border-b border-white/20 text-center focus:outline-none"
                          />
                        ) : (
                          p.name
                        )}
                      </span>
                    </button>
                    {p.isCustom && (
                      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingId !== p.id ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingId(p.id); setEditingName(p.name); }}
                              className="p-0.5 rounded bg-white/10 text-slate-400 hover:text-cyan-300"
                              title="Rename"
                            >
                              <Edit2 size={10} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteCustomPreset(p.id); }}
                              className="p-0.5 rounded bg-white/10 text-slate-400 hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 size={10} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                renameCustomPreset(p.id, editingName.trim());
                                setEditingId(null);
                              }}
                              className="p-0.5 rounded bg-white/10 text-slate-400 hover:text-emerald-300"
                            >
                              <Check size={10} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                              className="p-0.5 rounded bg-white/10 text-slate-400 hover:text-red-400"
                            >
                              <X size={10} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px bg-gradient-to-r from-cyan-500/30 via-cyan-500/10 to-transparent" />

            {/* 发射器形状 */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-indigo-400/80 font-bold">
                <Circle size={12} />
                Emitter Shape
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {EMITTER_SHAPES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setEmitterShape(s.id)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-medium
                               transition-all border
                               ${particleConfig.emitterShape === s.id
                        ? "bg-indigo-500/20 border-indigo-400/50 text-indigo-200"
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                      }`}
                  >
                    <span className="text-base leading-none font-bold">{s.icon}</span>
                    <span className="uppercase tracking-wider">{s.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <div className="h-px bg-gradient-to-r from-cyan-500/30 via-cyan-500/10 to-transparent" />

            {/* 发射参数 */}
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
                unit=""
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

            {/* 力场 */}
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

            {/* 爆炸 */}
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

            {/* 颜色 */}
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

            {/* IO */}
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

      {/* Stop recording modal */}
      {stopOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[300px] p-5 rounded-2xl bg-black/80 border border-cyan-500/20 shadow-2xl">
            <h3 className="text-sm font-bold text-cyan-300 mb-3 tracking-wider uppercase">
              Save Recording
            </h3>
            <input
              ref={recNameInputRef}
              type="text"
              value={recName}
              onChange={(e) => setRecName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleStopRecording(); else if (e.key === "Escape") { setStopOpen(false); cancelRecording(); } }}
              placeholder={`Recording ${recordings.length + 1}`}
              className="w-full px-3 py-2 mb-4 rounded-lg bg-white/5 border border-white/10
                         text-sm text-slate-200 placeholder-slate-500
                         focus:outline-none focus:border-cyan-400/50"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setStopOpen(false); cancelRecording(); }}
                className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10
                           border border-white/10 text-slate-300 text-xs font-semibold
                           uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleStopRecording}
                className="flex-1 px-4 py-2 rounded-lg bg-cyan-500/80 hover:bg-cyan-400
                           text-white text-xs font-semibold uppercase tracking-wider transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useState, useRef, useEffect } from "react";
import { useParticleStore } from "@/store/useParticleStore";
import { EMITTER_SHAPES, RecordedEvent } from "@/store/particleStore";
import ParameterSlider from "@/components/ParameterSlider";
import ColorPicker from "@/components/ColorPicker";
import ExportButton from "@/components/ExportButton";
import {
  ChevronLeft, ChevronRight, RotateCcw, Zap,
  Sparkles, Target, Download, Circle,
  Save, Trash2, Edit2, Check, X,
  Play, Square, Pause, FolderPlus, Copy,
  Folder, ChevronDown, ChevronUp,
} from "lucide-react";

const SPEED_OPTIONS = [0.5, 1, 1.5, 2, 4];

function formatEventPayload(ev: RecordedEvent): string {
  if (ev.type === "param_change") {
    const key = ev.payload.key as string;
    const value = ev.payload.value;
    if (typeof value === "object" && value !== null) {
      const v = value as Record<string, unknown>;
      if ("x" in v && "y" in v) {
        return `${key}: (${Number(v.x).toFixed(1)}, ${Number(v.y).toFixed(1)})`;
      }
      if ("r" in v && "g" in v && "b" in v) {
        return `${key}: rgba`;
      }
      return `${key}`;
    }
    if (typeof value === "number") {
      return `${key}: ${value.toFixed(2)}`;
    }
    return `${key}: ${String(value)}`;
  }
  if (ev.type === "preset_apply") {
    return `preset: ${ev.payload.presetId as string}`;
  }
  if (ev.type === "explosion") {
    const x = Number(ev.payload.x ?? 0);
    const y = Number(ev.payload.y ?? 0);
    return `explosion: (${x.toFixed(0)}, ${y.toFixed(0)})`;
  }
  return ev.type;
}

export default function ControlPanel() {
  const {
    particleConfig,
    explosionConfig,
    builtinPresets,
    customPresets,
    groups,
    activePresetId,
    activeGroupId,
    isRecording,
    isPlaying,
    isPaused,
    playbackSpeed,
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
    togglePausePlayback,
    seekPlayback,
    setPlaybackSpeed,
    deleteRecording,
    duplicateRecording,
    renameRecording,
    addGroup,
    renameGroup,
    deleteGroup,
    setActiveGroupId,
    resetConfig,
    panelOpen,
    togglePanel,
  } = useParticleStore();

  const currentRecording = recordings.find((r) => r.id === currentRecordingId);

  const filteredCustomPresets =
    activeGroupId === "all"
      ? customPresets
      : customPresets.filter((p) => (p.groupId ?? "default") === activeGroupId);

  const allVisiblePresets = [...builtinPresets, ...filteredCustomPresets];

  const filteredRecordings =
    activeGroupId === "all"
      ? recordings
      : recordings.filter((r) => (r.groupId ?? "default") === activeGroupId);

  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingPresetName, setEditingPresetName] = useState("");
  const [stopOpen, setStopOpen] = useState(false);
  const [recName, setRecName] = useState("");
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [renamingGroup, setRenamingGroup] = useState(false);
  const [renamingGroupName, setRenamingGroupName] = useState("");
  const [eventsExpanded, setEventsExpanded] = useState(false);
  const [renamingRecordingId, setRenamingRecordingId] = useState<string | null>(null);
  const [renamingRecordingName, setRenamingRecordingName] = useState("");
  const [hoveredRecordingId, setHoveredRecordingId] = useState<string | null>(null);

  const saveInputRef = useRef<HTMLInputElement>(null);
  const renamePresetInputRef = useRef<HTMLInputElement>(null);
  const recNameInputRef = useRef<HTMLInputElement>(null);
  const addGroupInputRef = useRef<HTMLInputElement>(null);
  const renameGroupInputRef = useRef<HTMLInputElement>(null);
  const renameRecordingInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (saveOpen && saveInputRef.current) saveInputRef.current.focus();
  }, [saveOpen]);

  useEffect(() => {
    if (stopOpen && recNameInputRef.current) recNameInputRef.current.focus();
  }, [stopOpen]);

  useEffect(() => {
    if (editingPresetId && renamePresetInputRef.current) renamePresetInputRef.current.focus();
  }, [editingPresetId]);

  useEffect(() => {
    if (addGroupOpen && addGroupInputRef.current) addGroupInputRef.current.focus();
  }, [addGroupOpen]);

  useEffect(() => {
    if (renamingGroup && renameGroupInputRef.current) renameGroupInputRef.current.focus();
  }, [renamingGroup]);

  useEffect(() => {
    if (renamingRecordingId && renameRecordingInputRef.current) renameRecordingInputRef.current.focus();
  }, [renamingRecordingId]);

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

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    addGroup(newGroupName.trim());
    setNewGroupName("");
    setAddGroupOpen(false);
  };

  const handleRenameGroup = () => {
    if (!renamingGroupName.trim()) return;
    renameGroup(activeGroupId, renamingGroupName.trim());
    setRenamingGroup(false);
    setRenamingGroupName("");
  };

  const handleRenameRecording = (id: string) => {
    if (!renamingRecordingName.trim()) {
      setRenamingRecordingId(null);
      return;
    }
    renameRecording(id, renamingRecordingName.trim());
    setRenamingRecordingId(null);
    setRenamingRecordingName("");
  };

  const activeGroup = groups.find((g) => g.id === activeGroupId);

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
                  filteredRecordings.length > 0 && !isRecording && (
                    <button
                      onClick={() => startPlayback(filteredRecordings[filteredRecordings.length - 1].id)}
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
                <div className="flex flex-col gap-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-400/15">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-cyan-200 font-medium truncate">
                        ▶ {currentRecording.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                        {playbackTime.toFixed(2)}s / {currentRecording.duration.toFixed(2)}s
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={togglePausePlayback}
                        className="p-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 transition-all"
                        title={isPaused ? "Resume" : "Pause"}
                      >
                        {isPaused ? <Play size={14} /> : <Pause size={14} />}
                      </button>
                      <button
                        onClick={() => duplicateRecording(currentRecording.id)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-cyan-300 transition-all"
                        title="Duplicate recording"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={currentRecording.duration}
                    step={0.01}
                    value={playbackTime}
                    onInput={(e) => seekPlayback(Number((e.target as HTMLInputElement).value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer
                               bg-white/10 accent-cyan-400
                               [&::-webkit-slider-thumb]:appearance-none
                               [&::-webkit-slider-thumb]:w-4
                               [&::-webkit-slider-thumb]:h-4
                               [&::-webkit-slider-thumb]:rounded-full
                               [&::-webkit-slider-thumb]:bg-cyan-400
                               [&::-webkit-slider-thumb]:shadow-lg
                               [&::-webkit-slider-thumb]:shadow-cyan-400/50
                               [&::-webkit-slider-thumb]:cursor-pointer
                               [&::-webkit-slider-thumb]:transition-transform
                               [&::-webkit-slider-thumb]:hover:scale-110"
                  />

                  <div className="flex flex-wrap gap-1.5">
                    {SPEED_OPTIONS.map((sp) => (
                      <button
                        key={sp}
                        onClick={() => setPlaybackSpeed(sp)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border
                                   ${playbackSpeed === sp
                                     ? "bg-cyan-500/25 border-cyan-400/50 text-cyan-200"
                                     : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                                   }`}
                      >
                        {sp}×
                      </button>
                    ))}
                  </div>

                  <div>
                    <button
                      onClick={() => setEventsExpanded(!eventsExpanded)}
                      className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      {eventsExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      Events ({currentRecording.events.length})
                    </button>
                    {eventsExpanded && (
                      <div className="mt-2 max-h-[180px] overflow-y-auto pr-1 space-y-0.5 custom-scrollbar">
                        {currentRecording.events
                          .slice()
                          .sort((a, b) => a.time - b.time)
                          .map((ev, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 px-2 py-1 rounded-md bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                            >
                              <span className={`text-[10px] font-mono tabular-nums shrink-0 pt-0.5 w-14 text-right
                                               ${ev.time <= playbackTime ? "text-cyan-300" : "text-slate-500"}`}>
                                {ev.time.toFixed(2)}s
                              </span>
                              <span className={`text-[10px] truncate
                                               ${ev.type === "explosion" ? "text-orange-300" :
                                                 ev.type === "preset_apply" ? "text-fuchsia-300" :
                                                 "text-slate-300"}`}>
                                {formatEventPayload(ev)}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {filteredRecordings.length > 0 && !isRecording && (
                <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {filteredRecordings.slice().reverse().map((r) => (
                    <div
                      key={r.id}
                      onMouseEnter={() => setHoveredRecordingId(r.id)}
                      onMouseLeave={() => setHoveredRecordingId(null)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all relative
                                 ${currentRecordingId === r.id
                                   ? "bg-emerald-500/15 border border-emerald-400/30 text-emerald-300"
                                   : "bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10"
                                 }`}
                    >
                      {renamingRecordingId === r.id ? (
                        <input
                          ref={renameRecordingInputRef}
                          type="text"
                          value={renamingRecordingName}
                          onChange={(e) => setRenamingRecordingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameRecording(r.id);
                            else if (e.key === "Escape") setRenamingRecordingId(null);
                            e.stopPropagation();
                          }}
                          onBlur={() => handleRenameRecording(r.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-transparent border-b border-white/20 text-slate-200 focus:outline-none text-[11px] mr-2"
                        />
                      ) : (
                        <span className="flex-1 truncate">{r.name}</span>
                      )}
                      <span className="text-[10px] text-slate-500 mr-1 tabular-nums shrink-0">
                        {r.duration.toFixed(1)}s
                      </span>
                      {renamingRecordingId !== r.id && (
                        <div className={`flex items-center gap-0.5 transition-opacity ${hoveredRecordingId === r.id ? "opacity-100" : "opacity-0"}`}>
                          <button
                            onClick={() => { setRenamingRecordingId(r.id); setRenamingRecordingName(r.name); }}
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-300 shrink-0"
                            title="Rename"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            onClick={() => duplicateRecording(r.id)}
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-emerald-300 shrink-0"
                            title="Duplicate"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => currentRecordingId === r.id ? stopPlayback() : startPlayback(r.id)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-emerald-300 shrink-0"
                        title={currentRecordingId === r.id ? "Stop" : "Play"}
                      >
                        {currentRecordingId === r.id ? <Pause size={12} /> : <Play size={12} />}
                      </button>
                      <button
                        onClick={() => deleteRecording(r.id)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-red-400 shrink-0"
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

            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-teal-400/80 font-bold">
                  <Folder size={12} />
                  Group Manager
                </div>
                {!addGroupOpen && (
                  <button
                    onClick={() => { setNewGroupName(""); setAddGroupOpen(true); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10
                               text-[10px] text-slate-400 hover:text-teal-300 transition-colors"
                  >
                    <FolderPlus size={11} />
                    Add
                  </button>
                )}
              </div>

              {addGroupOpen && (
                <div className="flex gap-2 items-center">
                  <input
                    ref={addGroupInputRef}
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddGroup();
                      else if (e.key === "Escape") setAddGroupOpen(false);
                    }}
                    placeholder="New group name"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10
                               text-xs text-slate-200 placeholder-slate-500
                               focus:outline-none focus:border-teal-400/50"
                  />
                  <button
                    onClick={handleAddGroup}
                    className="p-1.5 rounded-md bg-teal-500/20 hover:bg-teal-500/30
                               text-teal-300 border border-teal-400/30"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => setAddGroupOpen(false)}
                    className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-center">
                <select
                  value={activeGroupId}
                  onChange={(e) => setActiveGroupId(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10
                             text-xs text-slate-200
                             focus:outline-none focus:border-teal-400/50
                             [&>option]:bg-neutral-900"
                >
                  <option value="all">🌐 全部 (All)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.icon} {g.name}
                    </option>
                  ))}
                </select>
                {activeGroup && activeGroupId !== "all" && activeGroupId !== "default" && (
                  <>
                    {renamingGroup ? (
                      <>
                        <input
                          ref={renameGroupInputRef}
                          type="text"
                          value={renamingGroupName}
                          onChange={(e) => setRenamingGroupName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameGroup();
                            else if (e.key === "Escape") setRenamingGroup(false);
                          }}
                          onBlur={handleRenameGroup}
                          placeholder="Rename"
                          className="w-24 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10
                                     text-xs text-slate-200
                                     focus:outline-none focus:border-teal-400/50"
                        />
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setRenamingGroup(true); setRenamingGroupName(activeGroup.name); }}
                          className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-teal-300 transition-colors"
                          title="Rename group"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete group "${activeGroup.name}"? Items will move to default.`)) {
                              deleteGroup(activeGroupId);
                            }
                          }}
                          className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete group"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </section>

            <div className="h-px bg-gradient-to-r from-cyan-500/30 via-cyan-500/10 to-transparent" />

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
                {allVisiblePresets.map((p) => (
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
                        {editingPresetId === p.id ? (
                          <input
                            ref={renamePresetInputRef}
                            type="text"
                            value={editingPresetName}
                            onChange={(e) => setEditingPresetName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                renameCustomPreset(p.id, editingPresetName.trim());
                                setEditingPresetId(null);
                              } else if (e.key === "Escape") {
                                setEditingPresetId(null);
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
                        {editingPresetId !== p.id ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingPresetId(p.id); setEditingPresetName(p.name); }}
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
                                renameCustomPreset(p.id, editingPresetName.trim());
                                setEditingPresetId(null);
                              }}
                              className="p-0.5 rounded bg-white/10 text-slate-400 hover:text-emerald-300"
                            >
                              <Check size={10} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingPresetId(null); }}
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

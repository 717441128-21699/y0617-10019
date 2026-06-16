import { create } from "zustand";
import {
  DEFAULT_PARTICLE_CONFIG,
  DEFAULT_EXPLOSION_CONFIG,
  BUILTIN_PRESETS,
  ParticleConfig,
  ExplosionConfig,
  Preset,
  EmitterShape,
  RecordedEvent,
  Recording,
} from "@/store/particleStore";

const CUSTOM_PRESETS_KEY = "particle-workbench:custom-presets";
const RECORDINGS_KEY = "particle-workbench:recordings";

function loadCustomPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Preset[];
  } catch {
    return [];
  }
}

function saveCustomPresets(presets: Preset[]) {
  try {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
  } catch {
    /* noop */
  }
}

function loadRecordings(): Recording[] {
  try {
    const raw = localStorage.getItem(RECORDINGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Recording[];
  } catch {
    return [];
  }
}

function saveRecordings(recordings: Recording[]) {
  try {
    localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
  } catch {
    /* noop */
  }
}

interface ParticleState {
  // 粒子参数
  particleConfig: ParticleConfig;
  setEmissionRate: (v: number) => void;
  setGravity: (x: number, y: number) => void;
  setWind: (x: number, y: number) => void;
  setTurbulence: (v: number) => void;
  setColorStart: (r: number, g: number, b: number, a: number) => void;
  setColorEnd: (r: number, g: number, b: number, a: number) => void;
  setParticleSize: (v: number) => void;
  setEmitterShape: (v: EmitterShape) => void;

  // 爆炸参数
  explosionConfig: ExplosionConfig;
  setExplosionStrength: (v: number) => void;
  setExplosionRadius: (v: number) => void;
  setExplosionDuration: (v: number) => void;

  // 预设
  builtinPresets: Preset[];
  customPresets: Preset[];
  activePresetId: string;
  applyPreset: (id: string) => void;
  saveAsCustomPreset: (name: string, icon?: string) => void;
  renameCustomPreset: (id: string, name: string) => void;
  deleteCustomPreset: (id: string) => void;

  // 工具
  resetConfig: () => void;
  loadConfig: (data: Record<string, unknown>) => void;

  // 录制回放
  isRecording: boolean;
  isPlaying: boolean;
  recordingStartTime: number;
  recordingEvents: RecordedEvent[];
  recordings: Recording[];
  currentRecordingId: string | null;
  playbackTime: number;
  startRecording: () => void;
  stopRecording: (name: string) => void;
  cancelRecording: () => void;
  startPlayback: (id: string) => void;
  stopPlayback: () => void;
  deleteRecording: (id: string) => void;
  recordEvent: (type: RecordedEvent["type"], payload: Record<string, unknown>) => void;
  setPlaybackTime: (t: number) => void;

  // 运行时统计
  fps: number;
  activeParticles: number;
  lastExplosionPos: { x: number; y: number } | null;
  setFps: (v: number) => void;
  setActiveParticles: (v: number) => void;
  setLastExplosionPos: (x: number, y: number) => void;

  // UI
  panelOpen: boolean;
  togglePanel: () => void;
}

export const useParticleStore = create<ParticleState>((set, get) => ({
  particleConfig: { ...DEFAULT_PARTICLE_CONFIG },
  setEmissionRate: (v) => {
    const s = get();
    s.recordEvent("param_change", { key: "emissionRate", value: v });
    set({
      particleConfig: { ...s.particleConfig, emissionRate: v },
      activePresetId: "",
    });
  },
  setGravity: (x, y) => {
    const s = get();
    s.recordEvent("param_change", { key: "gravity", value: { x, y } });
    set({
      particleConfig: { ...s.particleConfig, gravity: { x, y } },
      activePresetId: "",
    });
  },
  setWind: (x, y) => {
    const s = get();
    s.recordEvent("param_change", { key: "wind", value: { x, y } });
    set({
      particleConfig: { ...s.particleConfig, wind: { x, y } },
      activePresetId: "",
    });
  },
  setTurbulence: (v) => {
    const s = get();
    s.recordEvent("param_change", { key: "turbulence", value: v });
    set({
      particleConfig: { ...s.particleConfig, turbulence: v },
      activePresetId: "",
    });
  },
  setColorStart: (r, g, b, a) => {
    const s = get();
    s.recordEvent("param_change", { key: "colorStart", value: { r, g, b, a } });
    set({
      particleConfig: { ...s.particleConfig, colorStart: { r, g, b, a } },
      activePresetId: "",
    });
  },
  setColorEnd: (r, g, b, a) => {
    const s = get();
    s.recordEvent("param_change", { key: "colorEnd", value: { r, g, b, a } });
    set({
      particleConfig: { ...s.particleConfig, colorEnd: { r, g, b, a } },
      activePresetId: "",
    });
  },
  setParticleSize: (v) => {
    const s = get();
    s.recordEvent("param_change", { key: "particleSize", value: v });
    set({
      particleConfig: { ...s.particleConfig, particleSize: v },
      activePresetId: "",
    });
  },
  setEmitterShape: (v) => {
    const s = get();
    s.recordEvent("param_change", { key: "emitterShape", value: v });
    set({
      particleConfig: { ...s.particleConfig, emitterShape: v },
      activePresetId: "",
    });
  },

  explosionConfig: { ...DEFAULT_EXPLOSION_CONFIG },
  setExplosionStrength: (v) => {
    const s = get();
    s.recordEvent("param_change", { key: "explosionStrength", value: v });
    set({
      explosionConfig: { ...s.explosionConfig, strength: v },
      activePresetId: "",
    });
  },
  setExplosionRadius: (v) => {
    const s = get();
    s.recordEvent("param_change", { key: "explosionRadius", value: v });
    set({
      explosionConfig: { ...s.explosionConfig, radius: v },
      activePresetId: "",
    });
  },
  setExplosionDuration: (v) => {
    const s = get();
    s.recordEvent("param_change", { key: "explosionDuration", value: v });
    set({
      explosionConfig: { ...s.explosionConfig, duration: v },
      activePresetId: "",
    });
  },

  builtinPresets: BUILTIN_PRESETS,
  customPresets: loadCustomPresets(),
  activePresetId: "default",

  applyPreset: (id) => {
    const s = get();
    const all = [...s.builtinPresets, ...s.customPresets];
    const preset = all.find((p) => p.id === id);
    if (!preset) return;
    s.recordEvent("preset_apply", { presetId: id });
    set({
      particleConfig: { ...preset.particle },
      explosionConfig: { ...preset.explosion },
      activePresetId: id,
    });
  },

  saveAsCustomPreset: (name, icon = "💾") => {
    const s = get();
    const newPreset: Preset = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name || `Custom ${s.customPresets.length + 1}`,
      icon,
      particle: JSON.parse(JSON.stringify(s.particleConfig)),
      explosion: JSON.parse(JSON.stringify(s.explosionConfig)),
      isCustom: true,
      createdAt: Date.now(),
    };
    const next = [...s.customPresets, newPreset];
    saveCustomPresets(next);
    set({ customPresets: next, activePresetId: newPreset.id });
  },

  renameCustomPreset: (id, name) => {
    const s = get();
    const next = s.customPresets.map((p) =>
      p.id === id ? { ...p, name } : p
    );
    saveCustomPresets(next);
    set({ customPresets: next });
  },

  deleteCustomPreset: (id) => {
    const s = get();
    const next = s.customPresets.filter((p) => p.id !== id);
    saveCustomPresets(next);
    set({
      customPresets: next,
      activePresetId: s.activePresetId === id ? "default" : s.activePresetId,
    });
  },

  resetConfig: () => {
    const s = get();
    s.recordEvent("preset_apply", { presetId: "default" });
    set({
      particleConfig: { ...DEFAULT_PARTICLE_CONFIG },
      explosionConfig: { ...DEFAULT_EXPLOSION_CONFIG },
      activePresetId: "default",
    });
  },

  loadConfig: (data) => {
    if (!data || typeof data !== "object") return;
    const d = data as Record<string, unknown>;
    let particle = { ...DEFAULT_PARTICLE_CONFIG };
    let explosion = { ...DEFAULT_EXPLOSION_CONFIG };

    if ("customPresets" in d && Array.isArray(d.customPresets)) {
      const merged = [...loadCustomPresets(), ...(d.customPresets as Preset[])];
      const unique = Array.from(
        new Map(merged.map((p) => [p.id, p])).values()
      );
      saveCustomPresets(unique);
      set({ customPresets: unique });
    }

    if ("recordings" in d && Array.isArray(d.recordings)) {
      const merged = [...loadRecordings(), ...(d.recordings as Recording[])];
      const unique = Array.from(
        new Map(merged.map((r) => [r.id, r])).values()
      );
      saveRecordings(unique);
      set({ recordings: unique });
    }

    if ("particleConfig" in d && d.particleConfig && typeof d.particleConfig === "object") {
      const pc = d.particleConfig as Record<string, unknown>;
      if (typeof pc.emissionRate === "number") particle.emissionRate = pc.emissionRate;
      if (typeof pc.particleSize === "number") particle.particleSize = pc.particleSize;
      if (typeof pc.turbulence === "number") particle.turbulence = pc.turbulence;
      if (typeof pc.maxParticles === "number") particle.maxParticles = pc.maxParticles;
      if (typeof pc.emitterShape === "string") particle.emitterShape = pc.emitterShape as EmitterShape;
      if (pc.gravity && typeof pc.gravity === "object") {
        const g = pc.gravity as Record<string, unknown>;
        if (typeof g.x === "number") particle.gravity.x = g.x;
        if (typeof g.y === "number") particle.gravity.y = g.y;
      }
      if (pc.wind && typeof pc.wind === "object") {
        const w = pc.wind as Record<string, unknown>;
        if (typeof w.x === "number") particle.wind.x = w.x;
        if (typeof w.y === "number") particle.wind.y = w.y;
      }
      if (pc.colorStart && typeof pc.colorStart === "object") {
        const c = pc.colorStart as Record<string, unknown>;
        if (typeof c.r === "number") particle.colorStart.r = c.r;
        if (typeof c.g === "number") particle.colorStart.g = c.g;
        if (typeof c.b === "number") particle.colorStart.b = c.b;
        if (typeof c.a === "number") particle.colorStart.a = c.a;
      }
      if (pc.colorEnd && typeof pc.colorEnd === "object") {
        const c = pc.colorEnd as Record<string, unknown>;
        if (typeof c.r === "number") particle.colorEnd.r = c.r;
        if (typeof c.g === "number") particle.colorEnd.g = c.g;
        if (typeof c.b === "number") particle.colorEnd.b = c.b;
        if (typeof c.a === "number") particle.colorEnd.a = c.a;
      }
    } else {
      const pc = d;
      if (typeof pc.emissionRate === "number") particle.emissionRate = pc.emissionRate;
      if (typeof pc.particleSize === "number") particle.particleSize = pc.particleSize;
      if (typeof pc.turbulence === "number") particle.turbulence = pc.turbulence;
      if (typeof pc.maxParticles === "number") particle.maxParticles = pc.maxParticles;
      if (typeof pc.emitterShape === "string") particle.emitterShape = pc.emitterShape as EmitterShape;
      if (pc.gravity && typeof pc.gravity === "object") {
        const g = pc.gravity as Record<string, unknown>;
        if (typeof g.x === "number") particle.gravity.x = g.x;
        if (typeof g.y === "number") particle.gravity.y = g.y;
      }
      if (pc.wind && typeof pc.wind === "object") {
        const w = pc.wind as Record<string, unknown>;
        if (typeof w.x === "number") particle.wind.x = w.x;
        if (typeof w.y === "number") particle.wind.y = w.y;
      }
      if (pc.colorStart && typeof pc.colorStart === "object") {
        const c = pc.colorStart as Record<string, unknown>;
        if (typeof c.r === "number") particle.colorStart.r = c.r;
        if (typeof c.g === "number") particle.colorStart.g = c.g;
        if (typeof c.b === "number") particle.colorStart.b = c.b;
        if (typeof c.a === "number") particle.colorStart.a = c.a;
      }
      if (pc.colorEnd && typeof pc.colorEnd === "object") {
        const c = pc.colorEnd as Record<string, unknown>;
        if (typeof c.r === "number") particle.colorEnd.r = c.r;
        if (typeof c.g === "number") particle.colorEnd.g = c.g;
        if (typeof c.b === "number") particle.colorEnd.b = c.b;
        if (typeof c.a === "number") particle.colorEnd.a = c.a;
      }
    }

    if ("explosionConfig" in d && d.explosionConfig && typeof d.explosionConfig === "object") {
      const ec = d.explosionConfig as Record<string, unknown>;
      if (typeof ec.strength === "number") explosion.strength = ec.strength;
      if (typeof ec.radius === "number") explosion.radius = ec.radius;
      if (typeof ec.duration === "number") explosion.duration = ec.duration;
    }

    set({
      particleConfig: particle,
      explosionConfig: explosion,
      activePresetId: "",
    });
  },

  // 录制回放
  isRecording: false,
  isPlaying: false,
  recordingStartTime: 0,
  recordingEvents: [],
  recordings: loadRecordings(),
  currentRecordingId: null,
  playbackTime: 0,

  startRecording: () => {
    set({
      isRecording: true,
      isPlaying: false,
      recordingStartTime: performance.now() / 1000,
      recordingEvents: [],
      currentRecordingId: null,
      playbackTime: 0,
    });
  },

  stopRecording: (name) => {
    const s = get();
    if (!s.isRecording) return;
    const now = performance.now() / 1000;
    const duration = now - s.recordingStartTime;
    if (duration < 0.5 || s.recordingEvents.length === 0) {
      set({ isRecording: false, recordingEvents: [] });
      return;
    }
    const rec: Recording = {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name || `Recording ${s.recordings.length + 1}`,
      duration,
      events: [...s.recordingEvents],
      createdAt: Date.now(),
    };
    const next = [...s.recordings, rec];
    saveRecordings(next);
    set({
      isRecording: false,
      recordingEvents: [],
      recordings: next,
    });
  },

  cancelRecording: () => {
    set({ isRecording: false, recordingEvents: [] });
  },

  startPlayback: (id) => {
    const rec = get().recordings.find((r) => r.id === id);
    if (!rec) return;
    set({
      isPlaying: true,
      isRecording: false,
      currentRecordingId: id,
      playbackTime: 0,
    });
  },

  stopPlayback: () => {
    set({ isPlaying: false, currentRecordingId: null, playbackTime: 0 });
  },

  deleteRecording: (id) => {
    const s = get();
    const next = s.recordings.filter((r) => r.id !== id);
    saveRecordings(next);
    set({
      recordings: next,
      currentRecordingId: s.currentRecordingId === id ? null : s.currentRecordingId,
      isPlaying: s.currentRecordingId === id ? false : s.isPlaying,
    });
  },

  recordEvent: (type, payload) => {
    const s = get();
    if (!s.isRecording) return;
    const now = performance.now() / 1000;
    const t = now - s.recordingStartTime;
    const event: RecordedEvent = { type, time: t, payload };
    set({ recordingEvents: [...s.recordingEvents, event] });
  },

  setPlaybackTime: (t) => set({ playbackTime: t }),

  fps: 0,
  activeParticles: 0,
  lastExplosionPos: null,
  setFps: (v) => set({ fps: v }),
  setActiveParticles: (v) => set({ activeParticles: v }),
  setLastExplosionPos: (x, y) => set({ lastExplosionPos: { x, y } }),

  panelOpen: true,
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
}));

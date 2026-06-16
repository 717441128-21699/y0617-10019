import { create } from "zustand";
import {
  DEFAULT_PARTICLE_CONFIG,
  DEFAULT_EXPLOSION_CONFIG,
  BUILTIN_PRESETS,
  DEFAULT_GROUPS,
  ParticleConfig,
  ExplosionConfig,
  Preset,
  EmitterShape,
  RecordedEvent,
  Recording,
  RecordingSnapshot,
  Group,
  ConflictItem,
  ConflictResolveMode,
} from "@/store/particleStore";

const CUSTOM_PRESETS_KEY = "particle-workbench:custom-presets";
const RECORDINGS_KEY = "particle-workbench:recordings";
const GROUPS_KEY = "particle-workbench:groups";

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
    const arr = JSON.parse(raw) as Recording[];
    // 旧版录制数据兼容 - 补全 startSnapshot
    return arr.map((r) => ({
      ...r,
      startSnapshot: r.startSnapshot ?? {
        particleConfig: { ...DEFAULT_PARTICLE_CONFIG },
        explosionConfig: { ...DEFAULT_EXPLOSION_CONFIG },
        activePresetId: "",
      },
    }));
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

function loadGroups(): Group[] {
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    if (!raw) return DEFAULT_GROUPS;
    const arr = JSON.parse(raw) as Group[];
    // 确保默认组存在
    if (!arr.find((g) => g.id === "default")) {
      return [...DEFAULT_GROUPS, ...arr];
    }
    return arr;
  } catch {
    return DEFAULT_GROUPS;
  }
}

function saveGroups(groups: Group[]) {
  try {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  } catch {
    /* noop */
  }
}

function makeSnapshot(): RecordingSnapshot {
  const s = useParticleStore.getState();
  return {
    particleConfig: JSON.parse(JSON.stringify(s.particleConfig)),
    explosionConfig: JSON.parse(JSON.stringify(s.explosionConfig)),
    activePresetId: s.activePresetId,
  };
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
  groups: Group[];
  activePresetId: string;
  activeGroupId: string;
  applyPreset: (id: string) => void;
  saveAsCustomPreset: (name: string, icon?: string) => void;
  renameCustomPreset: (id: string, name: string) => void;
  deleteCustomPreset: (id: string) => void;
  setPresetGroup: (id: string, groupId: string) => void;
  addGroup: (name: string, icon?: string) => void;
  renameGroup: (id: string, name: string) => void;
  deleteGroup: (id: string) => void;
  setActiveGroupId: (id: string) => void;
  duplicatePreset: (id: string, name?: string) => void;

  // 工具
  resetConfig: () => void;
  loadConfig: (data: Record<string, unknown>) => void;
  // 批量导出（分组过滤）
  exportBundle: (presetIds?: string[], recordingIds?: string[]) => Record<string, unknown>;

  // 冲突
  pendingConflicts: ConflictItem[];
  conflictDefaultMode: ConflictResolveMode;
  resolveConflict: (itemId: string, mode: ConflictResolveMode, newName?: string) => void;
  clearConflicts: () => void;
  setConflictDefaultMode: (mode: ConflictResolveMode) => void;

  // 录制回放
  isRecording: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  playbackSpeed: number;
  recordingStartTime: number;
  recordingEvents: RecordedEvent[];
  recordings: Recording[];
  currentRecordingId: string | null;
  playbackTime: number;
  startRecording: () => void;
  stopRecording: (name: string) => void;
  cancelRecording: () => void;
  startPlayback: (id: string) => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
  togglePausePlayback: () => void;
  stopPlayback: () => void;
  seekPlayback: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  deleteRecording: (id: string) => void;
  duplicateRecording: (id: string, name?: string) => void;
  renameRecording: (id: string, name: string) => void;
  setRecordingGroup: (id: string, groupId: string) => void;
  recordEvent: (type: RecordedEvent["type"], payload: Record<string, unknown>) => void;
  setPlaybackTime: (t: number) => void;

  // 运行时统计
  fps: number;
  activeParticles: number;
  lastExplosionPos: { x: number; y: number } | null; // 引擎 buffer 坐标
  setFps: (v: number) => void;
  setActiveParticles: (v: number) => void;
  setLastExplosionPos: (x: number, y: number) => void;

  // UI
  panelOpen: boolean;
  togglePanel: () => void;
}

// 内部辅助：执行单条回放事件（不触发 recordEvent 录制）
function _applyPlaybackEvent(e: RecordedEvent) {
  const { type, payload } = e;
  const s = useParticleStore.getState();

  if (type === "param_change") {
    const key = payload.key as string;
    const value = payload.value as unknown;
    // 绕过 setter 的 recordEvent 副作用 - 直接 set
    switch (key) {
      case "emissionRate":
        s.particleConfig = { ...s.particleConfig, emissionRate: value as number };
        s.activePresetId = "";
        break;
      case "gravity": {
        const g = value as { x: number; y: number };
        s.particleConfig = { ...s.particleConfig, gravity: { x: g.x, y: g.y } };
        s.activePresetId = "";
        break;
      }
      case "wind": {
        const w = value as { x: number; y: number };
        s.particleConfig = { ...s.particleConfig, wind: { x: w.x, y: w.y } };
        s.activePresetId = "";
        break;
      }
      case "turbulence":
        s.particleConfig = { ...s.particleConfig, turbulence: value as number };
        s.activePresetId = "";
        break;
      case "particleSize":
        s.particleConfig = { ...s.particleConfig, particleSize: value as number };
        s.activePresetId = "";
        break;
      case "emitterShape":
        s.particleConfig = { ...s.particleConfig, emitterShape: value as EmitterShape };
        s.activePresetId = "";
        break;
      case "explosionStrength":
        s.explosionConfig = { ...s.explosionConfig, strength: value as number };
        s.activePresetId = "";
        break;
      case "explosionRadius":
        s.explosionConfig = { ...s.explosionConfig, radius: value as number };
        s.activePresetId = "";
        break;
      case "explosionDuration":
        s.explosionConfig = { ...s.explosionConfig, duration: value as number };
        s.activePresetId = "";
        break;
      case "colorStart": {
        const c = value as { r: number; g: number; b: number; a: number };
        s.particleConfig = {
          ...s.particleConfig,
          colorStart: { r: c.r, g: c.g, b: c.b, a: c.a },
        };
        s.activePresetId = "";
        break;
      }
      case "colorEnd": {
        const c = value as { r: number; g: number; b: number; a: number };
        s.particleConfig = {
          ...s.particleConfig,
          colorEnd: { r: c.r, g: c.g, b: c.b, a: c.a },
        };
        s.activePresetId = "";
        break;
      }
    }
  } else if (type === "preset_apply") {
    const pid = payload.presetId as string;
    const all = [...s.builtinPresets, ...s.customPresets];
    const preset = all.find((p) => p.id === pid);
    if (preset) {
      s.particleConfig = { ...preset.particle };
      s.explosionConfig = { ...preset.explosion };
      s.activePresetId = pid;
    }
  }
  // explosion 事件由引擎层通过 window.__pe 触发
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
  groups: loadGroups(),
  activePresetId: "default",
  activeGroupId: "all",

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
      groupId: s.activeGroupId !== "all" ? s.activeGroupId : "default",
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

  duplicatePreset: (id, name) => {
    const s = get();
    const src = s.customPresets.find((p) => p.id === id);
    if (!src) return;
    const copy: Preset = {
      ...JSON.parse(JSON.stringify(src)),
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name || `${src.name} (Copy)`,
      createdAt: Date.now(),
    };
    const next = [...s.customPresets, copy];
    saveCustomPresets(next);
    set({ customPresets: next, activePresetId: copy.id });
  },

  setPresetGroup: (id, groupId) => {
    const s = get();
    const next = s.customPresets.map((p) =>
      p.id === id ? { ...p, groupId } : p
    );
    saveCustomPresets(next);
    set({ customPresets: next });
  },

  addGroup: (name, icon = "📁") => {
    const s = get();
    const g: Group = {
      id: `grp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      icon,
      createdAt: Date.now(),
    };
    const next = [...s.groups, g];
    saveGroups(next);
    set({ groups: next, activeGroupId: g.id });
  },

  renameGroup: (id, name) => {
    const s = get();
    const next = s.groups.map((g) =>
      g.id === id ? { ...g, name } : g
    );
    saveGroups(next);
    set({ groups: next });
  },

  deleteGroup: (id) => {
    if (id === "default") return;
    const s = get();
    const next = s.groups.filter((g) => g.id !== id);
    const presets = s.customPresets.map((p) =>
      p.groupId === id ? { ...p, groupId: "default" } : p
    );
    const recs = s.recordings.map((r) =>
      r.groupId === id ? { ...r, groupId: "default" } : r
    );
    saveGroups(next);
    saveCustomPresets(presets);
    saveRecordings(recs);
    set({
      groups: next,
      customPresets: presets,
      recordings: recs,
      activeGroupId: s.activeGroupId === id ? "all" : s.activeGroupId,
    });
  },

  setActiveGroupId: (id) => set({ activeGroupId: id }),

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
    const s = get();
    const d = data as Record<string, unknown>;
    let particle = { ...DEFAULT_PARTICLE_CONFIG };
    let explosion = { ...DEFAULT_EXPLOSION_CONFIG };

    const incomingPresets: Preset[] =
      "customPresets" in d && Array.isArray(d.customPresets)
        ? (d.customPresets as Preset[])
        : [];
    const incomingRecordings: Recording[] =
      "recordings" in d && Array.isArray(d.recordings)
        ? (d.recordings as Recording[])
        : [];
    const incomingGroups: Group[] =
      "groups" in d && Array.isArray(d.groups)
        ? (d.groups as Group[])
        : [];

    // 冲突检测
    const conflicts: ConflictItem[] = [];

    for (const inc of incomingPresets) {
      const existing = s.customPresets.find((e) => e.id === inc.id);
      if (existing) {
        conflicts.push({
          kind: "preset",
          id: inc.id,
          name: inc.name,
          existingName: existing.name,
          incoming: inc as unknown as Record<string, unknown>,
          existing: existing as unknown as Record<string, unknown>,
        });
      }
    }
    for (const inc of incomingRecordings) {
      const existing = s.recordings.find((e) => e.id === inc.id);
      if (existing) {
        conflicts.push({
          kind: "recording",
          id: inc.id,
          name: inc.name,
          existingName: existing.name,
          incoming: inc as unknown as Record<string, unknown>,
          existing: existing as unknown as Record<string, unknown>,
        });
      }
    }
    for (const inc of incomingGroups) {
      if (inc.id === "default") continue;
      const existing = s.groups.find((e) => e.id === inc.id);
      if (existing) {
        conflicts.push({
          kind: "group",
          id: inc.id,
          name: inc.name,
          existingName: existing.name,
          incoming: inc as unknown as Record<string, unknown>,
          existing: existing as unknown as Record<string, unknown>,
        });
      }
    }

    // 先合并无冲突的组
    const mergedGroups = (() => {
      const unique = new Map(s.groups.map((g) => [g.id, g]));
      for (const g of incomingGroups) {
        if (g.id === "default") continue;
        const existing = unique.get(g.id);
        if (!existing) unique.set(g.id, g);
        // 冲突的暂不处理
      }
      return Array.from(unique.values());
    })();

    const mergedPresets = (() => {
      const unique = new Map(s.customPresets.map((p) => [p.id, p]));
      for (const p of incomingPresets) {
        if (!unique.has(p.id)) unique.set(p.id, p);
      }
      return Array.from(unique.values());
    })();

    const mergedRecordings = (() => {
      const unique = new Map(s.recordings.map((r) => [r.id, r]));
      for (const r of incomingRecordings) {
        if (!unique.has(r.id)) unique.set(r.id, r);
      }
      return Array.from(unique.values());
    })();

    saveGroups(mergedGroups);
    saveCustomPresets(mergedPresets);
    saveRecordings(mergedRecordings);

    // 导入主参数
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
      groups: mergedGroups,
      customPresets: mergedPresets,
      recordings: mergedRecordings,
      pendingConflicts: conflicts,
    });
  },

  exportBundle: (presetIds, recordingIds) => {
    const s = get();
    let presets = s.customPresets;
    let recs = s.recordings;
    if (presetIds) presets = presets.filter((p) => presetIds.includes(p.id));
    if (recordingIds) recs = recs.filter((r) => recordingIds.includes(r.id));
    // 导出被引用的组
    const groupIds = new Set<string>();
    for (const p of presets) if (p.groupId) groupIds.add(p.groupId);
    for (const r of recs) if (r.groupId) groupIds.add(r.groupId);
    const groups = s.groups.filter((g) => groupIds.has(g.id) || g.id !== "default");

    return {
      version: 4,
      particleConfig: s.particleConfig,
      explosionConfig: s.explosionConfig,
      groups,
      customPresets: presets,
      recordings: recs,
      exportedAt: new Date().toISOString(),
    };
  },

  pendingConflicts: [],
  conflictDefaultMode: "ask",

  resolveConflict: (itemId, mode, newName) => {
    const s = get();
    const idx = s.pendingConflicts.findIndex((c) => c.id === itemId);
    if (idx < 0) return;
    const conflict = s.pendingConflicts[idx];
    const rest = s.pendingConflicts.filter((_, i) => i !== idx);

    let presets = s.customPresets;
    let recs = s.recordings;
    let groups = s.groups;

    if (conflict.kind === "preset") {
      const incoming = conflict.incoming as unknown as Preset;
      if (mode === "overwrite") {
        presets = presets.map((p) => (p.id === conflict.id ? incoming : p));
      } else if (mode === "rename") {
        const copy: Preset = {
          ...incoming,
          id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: newName || `${incoming.name} (Imported)`,
          createdAt: Date.now(),
        };
        presets = [...presets, copy];
      }
      // skip 不做处理
    } else if (conflict.kind === "recording") {
      const incoming = conflict.incoming as unknown as Recording;
      if (mode === "overwrite") {
        recs = recs.map((r) => (r.id === conflict.id ? incoming : r));
      } else if (mode === "rename") {
        const copy: Recording = {
          ...incoming,
          id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: newName || `${incoming.name} (Imported)`,
          createdAt: Date.now(),
        };
        recs = [...recs, copy];
      }
    } else if (conflict.kind === "group") {
      const incoming = conflict.incoming as unknown as Group;
      if (mode === "overwrite") {
        groups = groups.map((g) => (g.id === conflict.id ? incoming : g));
      } else if (mode === "rename") {
        const copy: Group = {
          ...incoming,
          id: `grp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: newName || `${incoming.name} (Imported)`,
          createdAt: Date.now(),
        };
        groups = [...groups, copy];
      }
    }

    saveCustomPresets(presets);
    saveRecordings(recs);
    saveGroups(groups);
    set({ customPresets: presets, recordings: recs, groups, pendingConflicts: rest });
  },

  clearConflicts: () => set({ pendingConflicts: [] }),
  setConflictDefaultMode: (mode) => set({ conflictDefaultMode: mode }),

  // ============ 录制回放 ============
  isRecording: false,
  isPlaying: false,
  isPaused: false,
  playbackSpeed: 1.0,
  recordingStartTime: 0,
  recordingEvents: [],
  recordings: loadRecordings(),
  currentRecordingId: null,
  playbackTime: 0,

  startRecording: () => {
    const s = get();
    if (s.isPlaying) s.stopPlayback();
    set({
      isRecording: true,
      isPlaying: false,
      isPaused: false,
      playbackSpeed: 1.0,
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
    const snapshot = makeSnapshot();
    const rec: Recording = {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name || `Recording ${s.recordings.length + 1}`,
      duration,
      events: [...s.recordingEvents],
      createdAt: Date.now(),
      startSnapshot: snapshot,
      groupId: s.activeGroupId !== "all" ? s.activeGroupId : "default",
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
    // 先还原起点快照
    const snap = rec.startSnapshot;
    // 强制清空粒子 - 用 reset 的方式
    const presetRestore = snap.activePresetId;
    if (presetRestore) {
      const all = [...BUILTIN_PRESETS, ...get().customPresets];
      const p = all.find((x) => x.id === presetRestore);
      if (p) {
        set({
          particleConfig: { ...p.particle },
          explosionConfig: { ...p.explosion },
          activePresetId: p.id,
          isRecording: false,
          isPlaying: true,
          isPaused: false,
          currentRecordingId: id,
          playbackTime: 0,
        });
        return;
      }
    }
    set({
      particleConfig: JSON.parse(JSON.stringify(snap.particleConfig)),
      explosionConfig: JSON.parse(JSON.stringify(snap.explosionConfig)),
      activePresetId: snap.activePresetId,
      isRecording: false,
      isPlaying: true,
      isPaused: false,
      currentRecordingId: id,
      playbackTime: 0,
    });
  },

  pausePlayback: () => {
    const s = get();
    if (!s.isPlaying) return;
    set({ isPaused: true });
  },

  resumePlayback: () => {
    const s = get();
    if (!s.isPlaying || !s.isPaused) return;
    set({ isPaused: false });
  },

  togglePausePlayback: () => {
    const s = get();
    if (!s.isPlaying) return;
    set({ isPaused: !s.isPaused });
  },

  stopPlayback: () => {
    set({
      isPlaying: false,
      isPaused: false,
      currentRecordingId: null,
      playbackTime: 0,
    });
  },

  seekPlayback: (time) => {
    const s = get();
    const rec = s.recordings.find((r) => r.id === s.currentRecordingId);
    if (!rec) return;
    const t = Math.max(0, Math.min(rec.duration, time));

    // 先还原起点快照，再重新执行所有 <= t 的事件
    const snap = rec.startSnapshot;
    let particle: ParticleConfig = JSON.parse(JSON.stringify(snap.particleConfig));
    let explosion: ExplosionConfig = JSON.parse(JSON.stringify(snap.explosionConfig));
    let activePresetId = snap.activePresetId;

    const allPresets = [...BUILTIN_PRESETS, ...s.customPresets];

    for (const ev of rec.events) {
      if (ev.time > t) break;
      if (ev.type === "param_change") {
        const key = ev.payload.key as string;
        const value = ev.payload.value as unknown;
        switch (key) {
          case "emissionRate":
            particle = { ...particle, emissionRate: value as number };
            activePresetId = "";
            break;
          case "gravity": {
            const g = value as { x: number; y: number };
            particle = { ...particle, gravity: { x: g.x, y: g.y } };
            activePresetId = "";
            break;
          }
          case "wind": {
            const w = value as { x: number; y: number };
            particle = { ...particle, wind: { x: w.x, y: w.y } };
            activePresetId = "";
            break;
          }
          case "turbulence":
            particle = { ...particle, turbulence: value as number };
            activePresetId = "";
            break;
          case "particleSize":
            particle = { ...particle, particleSize: value as number };
            activePresetId = "";
            break;
          case "emitterShape":
            particle = { ...particle, emitterShape: value as EmitterShape };
            activePresetId = "";
            break;
          case "explosionStrength":
            explosion = { ...explosion, strength: value as number };
            activePresetId = "";
            break;
          case "explosionRadius":
            explosion = { ...explosion, radius: value as number };
            activePresetId = "";
            break;
          case "explosionDuration":
            explosion = { ...explosion, duration: value as number };
            activePresetId = "";
            break;
          case "colorStart": {
            const c = value as { r: number; g: number; b: number; a: number };
            particle = {
              ...particle,
              colorStart: { r: c.r, g: c.g, b: c.b, a: c.a },
            };
            activePresetId = "";
            break;
          }
          case "colorEnd": {
            const c = value as { r: number; g: number; b: number; a: number };
            particle = {
              ...particle,
              colorEnd: { r: c.r, g: c.g, b: c.b, a: c.a },
            };
            activePresetId = "";
            break;
          }
        }
      } else if (ev.type === "preset_apply") {
        const pid = ev.payload.presetId as string;
        const p = allPresets.find((x) => x.id === pid);
        if (p) {
          particle = { ...p.particle };
          explosion = { ...p.explosion };
          activePresetId = pid;
        }
      }
      // explosion 事件在引擎层通过时间差触发
    }

    set({
      particleConfig: particle,
      explosionConfig: explosion,
      activePresetId,
      playbackTime: t,
    });
  },

  setPlaybackSpeed: (speed) => {
    set({ playbackSpeed: Math.max(0.1, Math.min(8, speed)) });
  },

  deleteRecording: (id) => {
    const s = get();
    const next = s.recordings.filter((r) => r.id !== id);
    saveRecordings(next);
    set({
      recordings: next,
      currentRecordingId: s.currentRecordingId === id ? null : s.currentRecordingId,
      isPlaying: s.currentRecordingId === id ? false : s.isPlaying,
      isPaused: false,
    });
  },

  duplicateRecording: (id, name) => {
    const s = get();
    const src = s.recordings.find((r) => r.id === id);
    if (!src) return;
    const copy: Recording = {
      ...JSON.parse(JSON.stringify(src)),
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name || `${src.name} (Copy)`,
      createdAt: Date.now(),
    };
    const next = [...s.recordings, copy];
    saveRecordings(next);
    set({ recordings: next });
  },

  renameRecording: (id, name) => {
    const s = get();
    const next = s.recordings.map((r) =>
      r.id === id ? { ...r, name } : r
    );
    saveRecordings(next);
    set({ recordings: next });
  },

  setRecordingGroup: (id, groupId) => {
    const s = get();
    const next = s.recordings.map((r) =>
      r.id === id ? { ...r, groupId } : r
    );
    saveRecordings(next);
    set({ recordings: next });
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

  // ============ 运行时统计 ============
  fps: 0,
  activeParticles: 0,
  lastExplosionPos: null,
  setFps: (v) => set({ fps: v }),
  setActiveParticles: (v) => set({ activeParticles: v }),
  setLastExplosionPos: (x, y) => set({ lastExplosionPos: { x, y } }),

  // UI
  panelOpen: true,
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
}));

// 导出供引擎层 _applyPlaybackEvent 调用的公开入口
export { _applyPlaybackEvent };

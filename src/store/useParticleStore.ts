import { create } from "zustand";
import {
  DEFAULT_PARTICLE_CONFIG,
  DEFAULT_EXPLOSION_CONFIG,
  PRESETS,
  ParticleConfig,
  ExplosionConfig,
  Preset,
} from "@/store/particleStore";

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

  // 爆炸参数
  explosionConfig: ExplosionConfig;
  setExplosionStrength: (v: number) => void;
  setExplosionRadius: (v: number) => void;
  setExplosionDuration: (v: number) => void;

  // 预设
  presets: Preset[];
  activePresetId: string;
  applyPreset: (id: string) => void;

  // 工具
  resetConfig: () => void;
  loadConfig: (data: Record<string, unknown>) => void;

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

export const useParticleStore = create<ParticleState>((set) => ({
  particleConfig: { ...DEFAULT_PARTICLE_CONFIG },
  setEmissionRate: (v) =>
    set((s) => ({
      particleConfig: { ...s.particleConfig, emissionRate: v, maxParticles: s.particleConfig.maxParticles },
      activePresetId: "",
    })),
  setGravity: (x, y) =>
    set((s) => ({
      particleConfig: { ...s.particleConfig, gravity: { x, y } },
      activePresetId: "",
    })),
  setWind: (x, y) =>
    set((s) => ({
      particleConfig: { ...s.particleConfig, wind: { x, y } },
      activePresetId: "",
    })),
  setTurbulence: (v) =>
    set((s) => ({
      particleConfig: { ...s.particleConfig, turbulence: v },
      activePresetId: "",
    })),
  setColorStart: (r, g, b, a) =>
    set((s) => ({
      particleConfig: { ...s.particleConfig, colorStart: { r, g, b, a } },
      activePresetId: "",
    })),
  setColorEnd: (r, g, b, a) =>
    set((s) => ({
      particleConfig: { ...s.particleConfig, colorEnd: { r, g, b, a } },
      activePresetId: "",
    })),
  setParticleSize: (v) =>
    set((s) => ({
      particleConfig: { ...s.particleConfig, particleSize: v },
      activePresetId: "",
    })),

  explosionConfig: { ...DEFAULT_EXPLOSION_CONFIG },
  setExplosionStrength: (v) =>
    set((s) => ({
      explosionConfig: { ...s.explosionConfig, strength: v },
      activePresetId: "",
    })),
  setExplosionRadius: (v) =>
    set((s) => ({
      explosionConfig: { ...s.explosionConfig, radius: v },
      activePresetId: "",
    })),
  setExplosionDuration: (v) =>
    set((s) => ({
      explosionConfig: { ...s.explosionConfig, duration: v },
      activePresetId: "",
    })),

  presets: PRESETS,
  activePresetId: "default",
  applyPreset: (id) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    set({
      particleConfig: { ...preset.particle },
      explosionConfig: { ...preset.explosion },
      activePresetId: id,
    });
  },

  resetConfig: () =>
    set({
      particleConfig: { ...DEFAULT_PARTICLE_CONFIG },
      explosionConfig: { ...DEFAULT_EXPLOSION_CONFIG },
      activePresetId: "default",
    }),

  loadConfig: (data) => {
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      let particle = { ...DEFAULT_PARTICLE_CONFIG };
      let explosion = { ...DEFAULT_EXPLOSION_CONFIG };

      if ("particleConfig" in d && d.particleConfig && typeof d.particleConfig === "object") {
        const pc = d.particleConfig as Record<string, unknown>;
        if (typeof pc.emissionRate === "number") particle.emissionRate = pc.emissionRate;
        if (typeof pc.particleSize === "number") particle.particleSize = pc.particleSize;
        if (typeof pc.turbulence === "number") particle.turbulence = pc.turbulence;
        if (typeof pc.maxParticles === "number") particle.maxParticles = pc.maxParticles;
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
        // 兼容旧格式：直接根字段
        const pc = d;
        if (typeof pc.emissionRate === "number") particle.emissionRate = pc.emissionRate;
        if (typeof pc.particleSize === "number") particle.particleSize = pc.particleSize;
        if (typeof pc.turbulence === "number") particle.turbulence = pc.turbulence;
        if (typeof pc.maxParticles === "number") particle.maxParticles = pc.maxParticles;
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
    }
  },

  fps: 0,
  activeParticles: 0,
  lastExplosionPos: null,
  setFps: (v) => set({ fps: v }),
  setActiveParticles: (v) => set({ activeParticles: v }),
  setLastExplosionPos: (x, y) => set({ lastExplosionPos: { x, y } }),

  panelOpen: true,
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
}));

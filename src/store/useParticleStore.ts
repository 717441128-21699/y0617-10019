import { create } from "zustand";
import { DEFAULT_CONFIG, ParticleConfig } from "@/store/particleStore";

interface ParticleState {
  config: ParticleConfig;
  setEmissionRate: (v: number) => void;
  setGravity: (x: number, y: number) => void;
  setWind: (x: number, y: number) => void;
  setTurbulence: (v: number) => void;
  setColorStart: (r: number, g: number, b: number, a: number) => void;
  setColorEnd: (r: number, g: number, b: number, a: number) => void;
  setParticleSize: (v: number) => void;
  loadConfig: (config: ParticleConfig) => void;
  resetConfig: () => void;
  fps: number;
  activeParticles: number;
  setFps: (v: number) => void;
  setActiveParticles: (v: number) => void;
  panelOpen: boolean;
  togglePanel: () => void;
}

export const useParticleStore = create<ParticleState>((set) => ({
  config: { ...DEFAULT_CONFIG },
  setEmissionRate: (v) => set((s) => ({ config: { ...s.config, emissionRate: v } })),
  setGravity: (x, y) => set((s) => ({ config: { ...s.config, gravity: { x, y } } })),
  setWind: (x, y) => set((s) => ({ config: { ...s.config, wind: { x, y } } })),
  setTurbulence: (v) => set((s) => ({ config: { ...s.config, turbulence: v } })),
  setColorStart: (r, g, b, a) => set((s) => ({ config: { ...s.config, colorStart: { r, g, b, a } } })),
  setColorEnd: (r, g, b, a) => set((s) => ({ config: { ...s.config, colorEnd: { r, g, b, a } } })),
  setParticleSize: (v) => set((s) => ({ config: { ...s.config, particleSize: v } })),
  loadConfig: (config) => set({ config }),
  resetConfig: () => set({ config: { ...DEFAULT_CONFIG } }),
  fps: 0,
  activeParticles: 0,
  setFps: (v) => set({ fps: v }),
  setActiveParticles: (v) => set({ activeParticles: v }),
  panelOpen: true,
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
}));

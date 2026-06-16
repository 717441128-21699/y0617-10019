export type EmitterShape = "point" | "ring" | "rect" | "bottom";

export const EMITTER_SHAPES: { id: EmitterShape; name: string; icon: string }[] = [
  { id: "point", name: "点源", icon: "●" },
  { id: "ring", name: "圆环", icon: "◎" },
  { id: "rect", name: "矩形", icon: "▢" },
  { id: "bottom", name: "底部", icon: "╶" },
];

export interface ParticleConfig {
  emissionRate: number;
  gravity: { x: number; y: number };
  wind: { x: number; y: number };
  turbulence: number;
  colorStart: { r: number; g: number; b: number; a: number };
  colorEnd: { r: number; g: number; b: number; a: number };
  particleSize: number;
  maxParticles: number;
  emitterShape: EmitterShape;
}

export interface ExplosionConfig {
  strength: number;
  radius: number;
  duration: number;
}

export interface Preset {
  id: string;
  name: string;
  icon: string;
  particle: ParticleConfig;
  explosion: ExplosionConfig;
  isCustom?: boolean;
  createdAt?: number;
}

export const DEFAULT_PARTICLE_CONFIG: ParticleConfig = {
  emissionRate: 0.5,
  gravity: { x: 0, y: -2.0 },
  wind: { x: 0.5, y: 0 },
  turbulence: 0.4,
  colorStart: { r: 0.0, g: 0.95, b: 0.85, a: 1.0 },
  colorEnd: { r: 0.1, g: 0.2, b: 0.9, a: 0.0 },
  particleSize: 4.0,
  maxParticles: 50000,
  emitterShape: "point",
};

export const DEFAULT_EXPLOSION_CONFIG: ExplosionConfig = {
  strength: 10000,
  radius: 180,
  duration: 1.2,
};

export const BUILTIN_PRESETS: Preset[] = [
  {
    id: "default",
    name: "Default",
    icon: "✨",
    particle: { ...DEFAULT_PARTICLE_CONFIG, emitterShape: "point" },
    explosion: { ...DEFAULT_EXPLOSION_CONFIG },
  },
  {
    id: "fountain",
    name: "喷泉",
    icon: "⛲",
    particle: {
      emissionRate: 0.75,
      gravity: { x: 0, y: -3.5 },
      wind: { x: 0, y: 0 },
      turbulence: 0.15,
      colorStart: { r: 0.5, g: 0.85, b: 1.0, a: 1.0 },
      colorEnd: { r: 0.1, g: 0.3, b: 0.9, a: 0.0 },
      particleSize: 3.5,
      maxParticles: 50000,
      emitterShape: "point",
    },
    explosion: {
      strength: 14000,
      radius: 150,
      duration: 1.4,
    },
  },
  {
    id: "fireworks",
    name: "烟花",
    icon: "🎆",
    particle: {
      emissionRate: 0.08,
      gravity: { x: 0, y: -1.2 },
      wind: { x: 0.2, y: 0 },
      turbulence: 0.08,
      colorStart: { r: 1.0, g: 0.85, b: 0.3, a: 1.0 },
      colorEnd: { r: 1.0, g: 0.1, b: 0.3, a: 0.0 },
      particleSize: 4.5,
      maxParticles: 50000,
      emitterShape: "point",
    },
    explosion: {
      strength: 22000,
      radius: 260,
      duration: 1.8,
    },
  },
  {
    id: "nebula",
    name: "星云",
    icon: "🌌",
    particle: {
      emissionRate: 0.4,
      gravity: { x: 0, y: 0 },
      wind: { x: 0.05, y: -0.05 },
      turbulence: 1.6,
      colorStart: { r: 0.9, g: 0.3, b: 0.85, a: 1.0 },
      colorEnd: { r: 0.2, g: 0.1, b: 0.6, a: 0.0 },
      particleSize: 6.0,
      maxParticles: 50000,
      emitterShape: "ring",
    },
    explosion: {
      strength: 6000,
      radius: 380,
      duration: 2.5,
    },
  },
  {
    id: "fire",
    name: "火焰",
    icon: "🔥",
    particle: {
      emissionRate: 0.95,
      gravity: { x: 0, y: 3.5 },
      wind: { x: 0.15, y: 0 },
      turbulence: 1.1,
      colorStart: { r: 1.0, g: 0.95, b: 0.3, a: 1.0 },
      colorEnd: { r: 1.0, g: 0.15, b: 0.05, a: 0.0 },
      particleSize: 5.0,
      maxParticles: 50000,
      emitterShape: "bottom",
    },
    explosion: {
      strength: 12000,
      radius: 200,
      duration: 1.0,
    },
  },
];

// 录制回放类型
export type RecordedEventType =
  | "param_change"
  | "explosion"
  | "preset_apply";

export interface RecordedEvent {
  type: RecordedEventType;
  time: number;
  payload: Record<string, unknown>;
}

export interface Recording {
  id: string;
  name: string;
  duration: number;
  events: RecordedEvent[];
  createdAt: number;
}

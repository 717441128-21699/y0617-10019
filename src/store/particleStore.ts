export interface ParticleConfig {
  emissionRate: number;
  gravity: { x: number; y: number };
  wind: { x: number; y: number };
  turbulence: number;
  colorStart: { r: number; g: number; b: number; a: number };
  colorEnd: { r: number; g: number; b: number; a: number };
  particleSize: number;
  maxParticles: number;
}

export const DEFAULT_CONFIG: ParticleConfig = {
  emissionRate: 0.5,
  gravity: { x: 0, y: -2.0 },
  wind: { x: 0.5, y: 0 },
  turbulence: 0.4,
  colorStart: { r: 0.0, g: 0.95, b: 0.85, a: 1.0 },
  colorEnd: { r: 0.1, g: 0.2, b: 0.9, a: 0.0 },
  particleSize: 4.0,
  maxParticles: 50000,
};

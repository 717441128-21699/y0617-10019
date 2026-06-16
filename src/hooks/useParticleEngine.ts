import { useEffect, useRef, useCallback } from "react";
import { createParticleEngine, ParticleEngine } from "@/utils/glUtils";
import { useParticleStore } from "@/store/useParticleStore";

export function useParticleEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const fpsFramesRef = useRef(0);
  const fpsTimeRef = useRef(0);
  const currentEngineTimeRef = useRef(0);
  const maxParticlesRef = useRef(50000);

  const { config } = useParticleStore();
  maxParticlesRef.current = config.maxParticles;

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
    });

    if (!gl) {
      console.error("WebGL 2 not supported");
      return;
    }

    gl.clearColor(0.02, 0.02, 0.04, 1.0);
    gl.viewport(0, 0, canvas.width, canvas.height);

    const engine = createParticleEngine(gl, maxParticlesRef.current);
    if (!engine) {
      console.error("Failed to create particle engine");
      return;
    }

    engineRef.current = engine;
    startTimeRef.current = performance.now() / 1000;
    lastTimeRef.current = startTimeRef.current;
    fpsTimeRef.current = startTimeRef.current;

    const animate = () => {
      const state = useParticleStore.getState();
      const { config: cfg, setFps, setActiveParticles } = state;

      const now = performance.now() / 1000;
      const dt = Math.min(now - lastTimeRef.current, 0.05);
      lastTimeRef.current = now;
      const time = now - startTimeRef.current;
      currentEngineTimeRef.current = time;

      fpsFramesRef.current++;
      if (now - fpsTimeRef.current >= 1.0) {
        setFps(fpsFramesRef.current);
        fpsFramesRef.current = 0;
        fpsTimeRef.current = now;
      }

      engine.setUniforms({
        uGravity: new Float32Array([cfg.gravity.x, cfg.gravity.y]),
        uWind: new Float32Array([cfg.wind.x, cfg.wind.y]),
        uTurbulence: cfg.turbulence,
        uEmissionRate: cfg.emissionRate,
        uColorStart: new Float32Array([cfg.colorStart.r, cfg.colorStart.g, cfg.colorStart.b, cfg.colorStart.a]),
        uColorEnd: new Float32Array([cfg.colorEnd.r, cfg.colorEnd.g, cfg.colorEnd.b, cfg.colorEnd.a]),
        uParticleSize: cfg.particleSize,
      });

      engine.update(dt, time);
      engine.render();
      setActiveParticles(engine.getActiveCount());

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    init();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (engineRef.current) engineRef.current.destroy();
    };
  }, [init]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !engineRef.current) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      engineRef.current.resize(canvas.width, canvas.height);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    engineRef.current.triggerExplosion(x, y, currentEngineTimeRef.current, 8000);
  }, []);

  return { canvasRef, handleClick };
}

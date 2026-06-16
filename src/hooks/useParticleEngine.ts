import { useEffect, useRef, useCallback } from "react";
import { createParticleEngine, ParticleEngine } from "@/utils/glUtils";
import { useParticleStore } from "@/store/useParticleStore";

export function useParticleEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);

  const startTimeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const fpsFramesRef = useRef(0);
  const fpsTimeRef = useRef(0);
  const currentEngineTimeRef = useRef(0);
  const resolutionRef = useRef<[number, number]>([0, 0]);
  const dprRef = useRef(1);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return () => {};
    if (engineRef.current) return () => {};

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
    });

    if (!gl) {
      console.error("WebGL 2 not supported");
      return () => {};
    }

    gl.clearColor(0.02, 0.02, 0.04, 1.0);

    const { particleConfig } = useParticleStore.getState();
    const engine = createParticleEngine(gl, particleConfig.maxParticles);
    if (!engine) {
      console.error("Failed to create particle engine");
      return () => {};
    }

    engineRef.current = engine;

    dprRef.current = Math.min(window.devicePixelRatio || 1, 2);

    const doResize = () => {
      const c = canvasRef.current;
      const e = engineRef.current;
      if (!c || !e) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      const w = window.innerWidth;
      const h = window.innerHeight;
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      c.style.width = w + "px";
      c.style.height = h + "px";
      resolutionRef.current = [c.width, c.height];
      e.resize(c.width, c.height);
    };
    doResize();
    window.addEventListener("resize", doResize);

    startTimeRef.current = performance.now() / 1000;
    lastTimeRef.current = startTimeRef.current;
    fpsTimeRef.current = startTimeRef.current;
    fpsFramesRef.current = 0;

    const animate = () => {
      if (!runningRef.current) return;
      const e = engineRef.current;
      if (!e) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const state = useParticleStore.getState();
      const {
        particleConfig: cfg,
        setFps,
        setActiveParticles,
        setLastExplosionPos,
      } = state;

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

      e.setUniforms({
        uGravity: new Float32Array([cfg.gravity.x, cfg.gravity.y]),
        uWind: new Float32Array([cfg.wind.x, cfg.wind.y]),
        uTurbulence: cfg.turbulence,
        uEmissionRate: cfg.emissionRate,
        uColorStart: new Float32Array([
          cfg.colorStart.r, cfg.colorStart.g, cfg.colorStart.b, cfg.colorStart.a,
        ]),
        uColorEnd: new Float32Array([
          cfg.colorEnd.r, cfg.colorEnd.g, cfg.colorEnd.b, cfg.colorEnd.a,
        ]),
        uParticleSize: cfg.particleSize,
      });

      e.update(dt, time);
      e.render();
      setActiveParticles(e.getActiveCount());

      const lastExpIdx = e.getLastExplosionIndex();
      if (lastExpIdx >= 0) {
        const [ex, ey] = e.getExplosionPos(lastExpIdx);
        setLastExplosionPos(ex, ey);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    runningRef.current = true;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      runningRef.current = false;
      window.removeEventListener("resize", doResize);
    };
  }, []);

  useEffect(() => {
    let cleanup: void | (() => void);
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      cleanup = init();
    };
    queueMicrotask(run);

    return () => {
      cancelled = true;
      runningRef.current = false;
      if (typeof cleanup === "function") cleanup();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      const engine = engineRef.current;
      engineRef.current = null;
      if (engine) {
        setTimeout(() => {
          try { engine.destroy(); } catch (_e) { /* noop */ }
        }, 80);
      }
    };
  }, [init]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;

    const dpr = dprRef.current;
    const rect = canvas.getBoundingClientRect();

    const clickCssX = e.clientX - rect.left;
    const clickCssY = e.clientY - rect.top;

    const bufX = clickCssX * dpr;
    const bufYTop = clickCssY * dpr;

    const [bufW] = resolutionRef.current;
    const [, bufH] = resolutionRef.current;
    const engineX = bufX;
    const engineY = bufH - bufYTop;

    const { explosionConfig } = useParticleStore.getState();
    engine.triggerExplosion(engineX, engineY, currentEngineTimeRef.current, {
      strength: explosionConfig.strength,
      radius: explosionConfig.radius,
      duration: explosionConfig.duration,
    });
  }, []);

  return { canvasRef, handleClick };
}

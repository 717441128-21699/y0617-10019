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
  const resolutionRef = useRef([0, 0]);
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

    const engine = createParticleEngine(gl, maxParticlesRef.current);
    if (!engine) {
      console.error("Failed to create particle engine");
      return;
    }
    engineRef.current = engine;

    startTimeRef.current = performance.now() / 1000;
    lastTimeRef.current = startTimeRef.current;
    fpsTimeRef.current = startTimeRef.current;

    const doResize = () => {
      const c = canvasRef.current;
      const e = engineRef.current;
      if (!c || !e) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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

    const animate = () => {
      const state = useParticleStore.getState();
      const { config: cfg, setFps, setActiveParticles } = state;
      const e = engineRef.current;
      if (!e) { rafRef.current = requestAnimationFrame(animate); return; }

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
        uColorStart: new Float32Array([cfg.colorStart.r, cfg.colorStart.g, cfg.colorStart.b, cfg.colorStart.a]),
        uColorEnd: new Float32Array([cfg.colorEnd.r, cfg.colorEnd.g, cfg.colorEnd.b, cfg.colorEnd.a]),
        uParticleSize: cfg.particleSize,
      });

      e.update(dt, time);
      e.render();
      setActiveParticles(e.getActiveCount());

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", doResize);
    };
  }, []);

  useEffect(() => {
    let cleanup: void | (() => void);
    let cancelled = false;

    const run = () => {
      cleanup = init();
    };
    // useLayoutEffect-like timing
    queueMicrotask(run);

    return () => {
      cancelled = true;
      if (typeof cleanup === "function") cleanup();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // 允许下一帧结束后销毁，避免正在执行的回调内访问 engineRef
      setTimeout(() => {
        if (engineRef.current) {
          engineRef.current.destroy();
          engineRef.current = null;
        }
      }, 50);
    };
  }, [init]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();

    // 点击在 CSS 像素下相对画布左上角的位置
    const clickCssX = e.clientX - rect.left;
    const clickCssY = e.clientY - rect.top;

    // 缓冲区（设备）像素：左上角为 (0,0)，右下 (w*dpr, h*dpr)
    const bufX = clickCssX * dpr;
    const bufYTop = clickCssY * dpr;

    // 引擎内部粒子空间：与 aPosition 一致 —— 左下 (0,0)，右上 (bufW, bufH)
    const [bufW, bufH] = resolutionRef.current;
    const engineX = bufX;
    const engineY = bufH - bufYTop;

    engine.triggerExplosion(engineX, engineY, currentEngineTimeRef.current, 10000);
  }, []);

  return { canvasRef, handleClick };
}

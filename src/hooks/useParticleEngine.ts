import { useEffect, useRef, useCallback } from "react";
import { createParticleEngine, ParticleEngine } from "@/utils/glUtils";
import { useParticleStore } from "@/store/useParticleStore";
import { EmitterShape, RecordedEvent } from "@/store/particleStore";

const EMITTER_SHAPE_MAP: Record<EmitterShape, number> = {
  point: 0,
  ring: 1,
  rect: 2,
  bottom: 3,
};

function applyEvent(e: RecordedEvent) {
  const store = useParticleStore.getState();
  const { type, payload } = e;

  if (type === "param_change") {
    const key = payload.key as string;
    const value = payload.value as unknown;
    switch (key) {
      case "emissionRate":
        store.setEmissionRate(value as number);
        break;
      case "gravity": {
        const g = value as { x: number; y: number };
        store.setGravity(g.x, g.y);
        break;
      }
      case "wind": {
        const w = value as { x: number; y: number };
        store.setWind(w.x, w.y);
        break;
      }
      case "turbulence":
        store.setTurbulence(value as number);
        break;
      case "particleSize":
        store.setParticleSize(value as number);
        break;
      case "emitterShape":
        store.setEmitterShape(value as EmitterShape);
        break;
      case "explosionStrength":
        store.setExplosionStrength(value as number);
        break;
      case "explosionRadius":
        store.setExplosionRadius(value as number);
        break;
      case "explosionDuration":
        store.setExplosionDuration(value as number);
        break;
      case "colorStart": {
        const c = value as { r: number; g: number; b: number; a: number };
        store.setColorStart(c.r, c.g, c.b, c.a);
        break;
      }
      case "colorEnd": {
        const c = value as { r: number; g: number; b: number; a: number };
        store.setColorEnd(c.r, c.g, c.b, c.a);
        break;
      }
    }
  } else if (type === "preset_apply") {
    const pid = payload.presetId as string;
    store.applyPreset(pid);
  } else if (type === "explosion") {
    const x = payload.x as number;
    const y = payload.y as number;
    const engine = (window as unknown as { __pe?: ParticleEngine | null }).__pe;
    if (engine) {
      const cfg = store.explosionConfig;
      engine.triggerExplosion(x, y, store.playbackTime, {
        strength: cfg.strength,
        radius: cfg.radius,
        duration: cfg.duration,
      });
    }
  }
}

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
  const playbackEventIndexRef = useRef(0);
  const playbackStartTimeRef = useRef(0);

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
    (window as unknown as { __pe?: ParticleEngine | null }).__pe = engine;

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
        isPlaying,
        currentRecordingId,
        recordings,
        setPlaybackTime,
        stopPlayback,
      } = state;

      const now = performance.now() / 1000;
      const dt = Math.min(now - lastTimeRef.current, 0.05);
      lastTimeRef.current = now;

      let time: number;
      if (isPlaying && currentRecordingId) {
        const rec = recordings.find((r) => r.id === currentRecordingId);
        if (rec) {
          if (playbackStartTimeRef.current === 0) {
            playbackStartTimeRef.current = now;
            playbackEventIndexRef.current = 0;
          }
          const pt = now - playbackStartTimeRef.current;
          setPlaybackTime(pt);
          time = pt;

          while (
            playbackEventIndexRef.current < rec.events.length &&
            rec.events[playbackEventIndexRef.current].time <= pt
          ) {
            const ev = rec.events[playbackEventIndexRef.current];
            applyEvent(ev);
            playbackEventIndexRef.current++;
          }

          if (pt >= rec.duration) {
            stopPlayback();
            playbackStartTimeRef.current = 0;
          }
        } else {
          time = now - startTimeRef.current;
        }
      } else {
        playbackStartTimeRef.current = 0;
        playbackEventIndexRef.current = 0;
        time = now - startTimeRef.current;
      }

      currentEngineTimeRef.current = time;

      fpsFramesRef.current++;
      if (now - fpsTimeRef.current >= 1.0) {
        setFps(fpsFramesRef.current);
        fpsFramesRef.current = 0;
        fpsTimeRef.current = now;
      }

      const shapeCode = EMITTER_SHAPE_MAP[cfg.emitterShape] ?? 0;
      e.setUniforms({
        uGravity: new Float32Array([cfg.gravity.x, cfg.gravity.y]),
        uWind: new Float32Array([cfg.wind.x, cfg.wind.y]),
        uTurbulence: cfg.turbulence,
        uEmissionRate: cfg.emissionRate,
        uEmitterShape: shapeCode,
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
      (window as unknown as { __pe?: ParticleEngine | null }).__pe = null;
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

    const [, bufH] = resolutionRef.current;
    const engineX = bufX;
    const engineY = bufH - bufYTop;

    const state = useParticleStore.getState();
    const { explosionConfig, recordEvent, isPlaying } = state;

    if (!isPlaying) {
      recordEvent("explosion", { x: engineX, y: engineY });
    }

    engine.triggerExplosion(engineX, engineY, currentEngineTimeRef.current, {
      strength: explosionConfig.strength,
      radius: explosionConfig.radius,
      duration: explosionConfig.duration,
    });
  }, []);

  return { canvasRef, handleClick };
}

import { useEffect, useRef, useCallback, useMemo } from "react";
import { createParticleEngine, ParticleEngine } from "@/utils/glUtils";
import { useParticleStore, _applyPlaybackEvent } from "@/store/useParticleStore";
import { EmitterShape, RecordedEvent } from "@/store/particleStore";

const EMITTER_SHAPE_MAP: Record<EmitterShape, number> = {
  point: 0,
  ring: 1,
  rect: 2,
  bottom: 3,
};

export interface CoordinateConverter {
  toScreen: (engineX: number, engineY: number) => { x: number; y: number };
  toEngine: (screenX: number, screenY: number) => { x: number; y: number };
}

export function useParticleEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);

  const startTimeRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const fpsFramesRef = useRef(0);
  const fpsTimeRef = useRef(0);
  const currentEngineTimeRef = useRef(0);
  const resolutionRef = useRef<[number, number]>([0, 0]);
  const dprRef = useRef(1);
  const playbackEventIndexRef = useRef(0);
  const playbackStartTimeRef = useRef(0);
  const playbackAccumRef = useRef(0); // 用于播放速度累积

  const converter = useMemo<CoordinateConverter>(
    () => ({
      toScreen: (ex, ey) => {
        const [bufW, bufH] = resolutionRef.current;
        const dpr = dprRef.current || 1;
        if (bufW === 0 || bufH === 0) return { x: 0, y: 0 };
        return {
          x: ex / dpr,
          y: (bufH - ey) / dpr,
        };
      },
      toEngine: (sx, sy) => {
        const [bufW, bufH] = resolutionRef.current;
        const dpr = dprRef.current || 1;
        return {
          x: sx * dpr,
          y: bufH - sy * dpr,
        };
      },
    }),
    []
  );

  // 暴露转换器引用给外部（StatsOverlay用）
  useEffect(() => {
    (window as unknown as { __coordConv?: CoordinateConverter | null }).__coordConv = null;
  }, []);

  const triggerExplosionAtScreen = useCallback((sx: number, sy: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    const { x, y } = converter.toEngine(sx, sy);
    const state = useParticleStore.getState();
    engine.triggerExplosion(x, y, currentEngineTimeRef.current, {
      strength: state.explosionConfig.strength,
      radius: state.explosionConfig.radius,
      duration: state.explosionConfig.duration,
    });
  }, [converter]);

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
    (window as unknown as { __coordConv?: CoordinateConverter | null }).__coordConv = converter;

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
    lastFrameTimeRef.current = startTimeRef.current;
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
        isPaused,
        playbackSpeed,
        currentRecordingId,
        recordings,
        setPlaybackTime,
        stopPlayback,
      } = state;

      const now = performance.now() / 1000;
      const rawDt = Math.min(now - lastFrameTimeRef.current, 0.05);
      lastFrameTimeRef.current = now;

      // 根据播放状态决定 dt 和 time
      let dt: number;
      let time: number;

      if (isPlaying && currentRecordingId) {
        const rec = recordings.find((r) => r.id === currentRecordingId);
        if (rec) {
          if (playbackStartTimeRef.current === 0) {
            playbackStartTimeRef.current = now;
            playbackEventIndexRef.current = 0;
            playbackAccumRef.current = 0;
          }
          const scaledDt = isPaused ? 0 : rawDt * playbackSpeed;
          playbackAccumRef.current += scaledDt;
          const pt = playbackAccumRef.current;
          // 防止超出
          if (pt >= rec.duration) {
            setPlaybackTime(rec.duration);
            // 最后再把剩余事件执行完
            while (playbackEventIndexRef.current < rec.events.length) {
              const ev = rec.events[playbackEventIndexRef.current];
              if (ev.time > rec.duration) break;
              if (ev.type === "explosion") {
                const px = ev.payload.x as number;
                const py = ev.payload.y as number;
                const cfg2 = state.explosionConfig;
                e.triggerExplosion(px, py, rec.duration, {
                  strength: cfg2.strength,
                  radius: cfg2.radius,
                  duration: cfg2.duration,
                });
              } else {
                _applyPlaybackEvent(ev);
              }
              playbackEventIndexRef.current++;
            }
            stopPlayback();
            playbackStartTimeRef.current = 0;
            time = now - startTimeRef.current; // 结束后走实时时间
          } else {
            setPlaybackTime(pt);
            time = pt;

            // 按时间差推进事件
            while (
              playbackEventIndexRef.current < rec.events.length &&
              rec.events[playbackEventIndexRef.current].time <= pt
            ) {
              const ev = rec.events[playbackEventIndexRef.current];
              if (ev.type === "explosion") {
                const px = ev.payload.x as number;
                const py = ev.payload.y as number;
                const cfg2 = state.explosionConfig;
                // 用 pt 作为爆炸时间（按当前进度）
                e.triggerExplosion(px, py, pt, {
                  strength: cfg2.strength,
                  radius: cfg2.radius,
                  duration: cfg2.duration,
                });
              } else {
                _applyPlaybackEvent(ev);
              }
              playbackEventIndexRef.current++;
            }
          }
          dt = scaledDt;
          // 如果暂停则不推进模拟
          if (isPaused) dt = 0;
        } else {
          time = now - startTimeRef.current;
          dt = rawDt;
          playbackStartTimeRef.current = 0;
        }
      } else {
        playbackStartTimeRef.current = 0;
        playbackEventIndexRef.current = 0;
        playbackAccumRef.current = 0;
        time = now - startTimeRef.current;
        dt = rawDt;
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

      if (dt > 0) {
        e.update(dt, time);
      }
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
  }, [converter]);

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
      (window as unknown as { __coordConv?: CoordinateConverter | null }).__coordConv = null;
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

  return { canvasRef, handleClick, triggerExplosionAtScreen, converter };
}

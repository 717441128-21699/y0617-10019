import { useParticleStore } from "@/store/useParticleStore";
import { CoordinateConverter } from "@/hooks/useParticleEngine";
import { Pause, Play, Circle } from "lucide-react";

function formatMem(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getConv(): CoordinateConverter | null {
  try {
    return (window as unknown as { __coordConv?: CoordinateConverter | null }).__coordConv ?? null;
  } catch {
    return null;
  }
}

export default function StatsOverlay() {
  const {
    fps,
    activeParticles,
    particleConfig,
    lastExplosionPos,
    isRecording,
    isPlaying,
    isPaused,
    playbackSpeed,
    playbackTime,
    currentRecordingId,
    recordings,
  } = useParticleStore();

  const maxP = particleConfig.maxParticles;
  const bytesPerParticle = 36;
  const totalMem = maxP * bytesPerParticle * 2;

  // 爆炸坐标：buffer 坐标 → CSS 屏幕坐标 (x 相同/dpr, y 翻转/dpr)
  let screenPos: { x: number; y: number } | null = null;
  if (lastExplosionPos) {
    const conv = getConv();
    if (conv) {
      screenPos = conv.toScreen(lastExplosionPos.x, lastExplosionPos.y);
    } else {
      const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
      const h = (typeof window !== "undefined" ? window.innerHeight : 800) * dpr;
      screenPos = {
        x: lastExplosionPos.x / dpr,
        y: (h - lastExplosionPos.y) / dpr,
      };
    }
  }

  const currentRecording = currentRecordingId
    ? recordings.find((r) => r.id === currentRecordingId)
    : null;

  return (
    <div className="fixed top-4 right-4 z-30 flex flex-col items-end gap-1.5 font-mono text-[11px] select-none pointer-events-none">
      {isRecording && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 backdrop-blur-md border border-red-500/30 text-red-300 text-[11px]">
          <Circle size={9} fill="currentColor" className="animate-pulse" />
          <span className="uppercase tracking-wider text-[10px] font-semibold">REC</span>
        </div>
      )}

      {isPlaying && currentRecording && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 backdrop-blur-md border border-emerald-500/30 text-emerald-300">
          {isPaused ? <Pause size={9} /> : <Play size={9} />}
          <span className="tabular-nums">
            {playbackTime.toFixed(1)}s / {currentRecording.duration.toFixed(1)}s
          </span>
          {playbackSpeed !== 1 && (
            <span className="text-emerald-400/70 text-[10px]">×{playbackSpeed.toFixed(1)}</span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1 px-3 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-cyan-500/20 min-w-[170px]">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400 uppercase tracking-wider text-[9px]">FPS</span>
          <span className="text-cyan-300 tabular-nums font-semibold">{fps}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400 uppercase tracking-wider text-[9px]">Active</span>
          <span className="text-emerald-300 tabular-nums">
            {activeParticles.toLocaleString()}
          </span>
        </div>
        <div className="h-px bg-white/5 my-0.5" />
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400 uppercase tracking-wider text-[9px]">Pool</span>
          <span className="text-amber-300/80 tabular-nums">
            {maxP.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400 uppercase tracking-wider text-[9px]">VRAM</span>
          <span className="text-amber-300/80 tabular-nums">{formatMem(totalMem)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400 uppercase tracking-wider text-[9px]">Emit Rate</span>
          <span className="text-fuchsia-300/90 tabular-nums">
            {(particleConfig.emissionRate * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {screenPos && (
        <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-orange-500/20 text-orange-300/90 tabular-nums">
          💥 ({Math.round(screenPos.x)}, {Math.round(screenPos.y)})
        </div>
      )}
    </div>
  );
}

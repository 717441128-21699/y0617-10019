import { useParticleStore } from "@/store/useParticleStore";

function formatMem(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function StatsOverlay() {
  const {
    fps,
    activeParticles,
    particleConfig,
    lastExplosionPos,
  } = useParticleStore();

  const maxP = particleConfig.maxParticles;
  const bytesPerParticle = 36;
  const totalMem = maxP * bytesPerParticle * 2; // ping-pong double buffer

  const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);

  return (
    <div className="fixed top-4 right-4 z-30 flex flex-col items-end gap-1.5 font-mono text-[11px] select-none">
      <div className="flex flex-col gap-1 px-3 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-cyan-500/20 min-w-[160px]">
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

      {lastExplosionPos && (
        <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-orange-500/20 text-orange-300/90 tabular-nums">
          💥 ({Math.round(lastExplosionPos.x / dpr)}, {Math.round(lastExplosionPos.y / dpr)})
        </div>
      )}
    </div>
  );
}

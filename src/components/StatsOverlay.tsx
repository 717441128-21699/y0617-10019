import { useParticleStore } from "@/store/useParticleStore";

export default function StatsOverlay() {
  const { fps, activeParticles } = useParticleStore();

  return (
    <div className="fixed top-4 right-4 z-30 flex flex-col items-end gap-1 font-mono text-xs select-none">
      <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-cyan-500/20 text-cyan-300">
        {fps} FPS
      </div>
      <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-cyan-500/20 text-emerald-300">
        {activeParticles.toLocaleString()} particles
      </div>
    </div>
  );
}

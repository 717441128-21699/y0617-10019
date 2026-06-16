import ParticleCanvas from "@/components/ParticleCanvas";
import ControlPanel from "@/components/ControlPanel";
import StatsOverlay from "@/components/StatsOverlay";

export default function Home() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#050510]">
      <ParticleCanvas />
      <ControlPanel />
      <StatsOverlay />
    </div>
  );
}

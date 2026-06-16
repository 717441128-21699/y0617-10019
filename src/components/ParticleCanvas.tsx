import { useParticleEngine } from "@/hooks/useParticleEngine";

export default function ParticleCanvas() {
  const { canvasRef, handleClick } = useParticleEngine();

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="fixed inset-0 w-full h-full cursor-crosshair"
      style={{ touchAction: "none" }}
    />
  );
}

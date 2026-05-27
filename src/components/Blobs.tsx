export function Blobs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      <div className="blob" style={{ width: 520, height: 520, top: -120, left: -120, background: "oklch(0.78 0.18 295 / 0.5)" }} />
      <div className="blob" style={{ width: 460, height: 460, top: 200, right: -160, background: "oklch(0.78 0.16 200 / 0.45)", animationDelay: "-4s" }} />
      <div className="blob" style={{ width: 400, height: 400, bottom: -120, left: "30%", background: "oklch(0.8 0.14 340 / 0.4)", animationDelay: "-8s" }} />
    </div>
  );
}

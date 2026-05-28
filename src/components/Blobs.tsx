export function Blobs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      <div className="blob" style={{ width: 560, height: 560, top: -140, left: -140, background: "oklch(0.72 0.18 295 / 0.55)" }} />
      <div className="blob" style={{ width: 480, height: 480, top: 180, right: -180, background: "oklch(0.72 0.16 200 / 0.45)", animationDelay: "-4s" }} />
      <div className="blob" style={{ width: 420, height: 420, bottom: -140, left: "32%", background: "oklch(0.75 0.14 340 / 0.4)", animationDelay: "-8s" }} />
    </div>
  );
}

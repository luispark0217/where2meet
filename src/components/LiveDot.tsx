export function LiveDot({ size = 8 }: { size?: number }) {
  return <span className="live-dot block shrink-0 rounded-full bg-live" style={{ width: size, height: size }} />
}

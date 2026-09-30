/** 왕관 아이콘. 피그마의 Crown 벡터(가로:세로 = 1.625:1)를 다시 그린 것 */
export function Crown({ width = 22, fill = 'var(--color-lime)', stroke, className = '' }: { width?: number; fill?: string; stroke?: string; className?: string }) {
  const h = width / 1.625
  return (
    <svg width={width} height={h} viewBox="0 0 26 16" className={`block shrink-0 overflow-visible ${className}`} aria-hidden="true">
      <path d="M1.5 15V4l6 5L13 1.5 18.5 9l6-5v11z" fill={fill} stroke={stroke ?? fill} strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  )
}

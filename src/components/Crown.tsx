const D = 'M1.5 15V4l6 5L13 1.5 18.5 9l6-5v11z'

/**
 * 왕관 아이콘. 피그마의 Crown 벡터(가로:세로 = 1.625:1)를 다시 그린 것.
 * - 기본: 피그마처럼 채운 모양 바깥에 잉크색(#111412) 테두리 1px (어두운 카드 위에서 보여요)
 * - stroke 를 주면 그 색으로 가운데 테두리를 그려요 (지도 위 핀 등 A–G 에서 쓰던 방식)
 * - outline={false}: 테두리 없이 채우기만
 */
export function Crown({ width = 22, fill = 'var(--color-lime)', stroke, outline = true, className = '' }: {
  width?: number; fill?: string; stroke?: string; outline?: boolean; className?: string
}) {
  const h = width / 1.625
  const unit = width / 26 // 화면 px / 벡터 단위
  const ring = outline && !stroke
  return (
    <svg width={width} height={h} viewBox="0 0 26 16" className={`block shrink-0 overflow-visible ${className}`} aria-hidden="true">
      {ring && <path d={D} fill="var(--color-ink)" stroke="var(--color-ink)" strokeWidth={1.6 + 2 / unit} strokeLinejoin="round" />}
      <path d={D} fill={fill} stroke={stroke ?? fill} strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  )
}

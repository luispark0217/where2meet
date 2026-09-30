/**
 * 사진 자리. 실제 사진(src)이 없으면 피그마 시안과 같은 회색 자리표시를 보여줘요.
 * plain = 장소 썸네일과 같은 그라데이션 + 오른쪽 위 밝은 원만 (O 채팅 장소 카드 · S 공유 미리보기 시안).
 * 기본은 아래쪽 건물 모양도 그려요 (A·B).
 */
export function Photo({ src, className = '', radius = 20, tone = 'mid', alt = '', plain = false }: { src?: string | null; className?: string; radius?: number; tone?: 'light' | 'mid' | 'dark'; alt?: string; plain?: boolean }) {
  if (src) return <img src={src} alt={alt} className={`block object-cover ${className}`} style={{ borderRadius: radius }} />
  const g = plain ? THUMB_TONE[tone] : tone === 'light' ? ['#c9c9c9', '#8f8f8f'] : tone === 'dark' ? ['#7a7a7a', '#2c2c2c'] : ['#b4b4b4', '#5c5c5c']
  return (
    <div className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} overflow-hidden ${className}`} style={{ borderRadius: radius, background: `linear-gradient(180deg, ${g[0]}, ${g[1]})` }} role="img" aria-label={alt || '사진'}>
      <span className="absolute rounded-full bg-white/15" style={{ width: '46%', aspectRatio: '1', right: '-10%', top: '-16%' }} />
      {!plain && <span className="absolute rounded-t-[18px] bg-black/15" style={{ width: '34%', height: '52%', left: '12%', bottom: 0 }} />}
    </div>
  )
}

/** 동그란 사진 (모임 대표사진) */
export function RoundPhoto({ src, size, ring = 0, ringColor = 'var(--color-lime)', tone = 'mid' }: { src?: string | null; size: number; ring?: number; ringColor?: string; tone?: 'light' | 'mid' | 'dark' }) {
  const g = tone === 'light' ? ['#d8d8d8', '#8a8a8a'] : tone === 'dark' ? ['#8a8a8a', '#2f2f2f'] : ['#bdbdbd', '#555']
  return (
    <span className="block shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size, border: ring ? `${ring}px solid ${ringColor}` : undefined, background: src ? `center/cover url("${src}")` : `linear-gradient(160deg, ${g[0]}, ${g[1]})` }} />
  )
}

/** 장소 썸네일 자리표시 색 (N·P·O·S 시안) */
const THUMB_TONE = {
  light: ['#e0e0e0', '#7a7a7a'],
  mid: ['#d5d5d5', '#5e5e5e'],
  dark: ['#8a8a8a', '#2e2e2e'],
} as const

/**
 * 정사각 장소 썸네일 (N·P). 사진이 없으면 피그마 시안과 같은 회색 그라데이션 자리표시.
 * circle = P 시안처럼 오른쪽 위 밝은 원
 */
export function Thumb({ src, size, radius = 16, tone = 'mid', circle = false, alt = '' }: {
  src?: string | null; size: number; radius?: number; tone?: keyof typeof THUMB_TONE; circle?: boolean; alt?: string
}) {
  if (src) return <img src={src} alt={alt} className="block shrink-0 object-cover" style={{ width: size, height: size, borderRadius: radius }} />
  const [a, b] = THUMB_TONE[tone]
  return (
    <span className="relative block shrink-0 overflow-hidden" style={{ width: size, height: size, borderRadius: radius, background: `linear-gradient(180deg, ${a}, ${b})` }}
      role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
      {circle && <span className="absolute rounded-full bg-white/15" style={{ width: size * 0.68, height: size * 0.68, right: -size * 0.16, top: -size * 0.2 }} />}
    </span>
  )
}

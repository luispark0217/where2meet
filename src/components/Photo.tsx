/** 사진 자리. 실제 사진(src)이 없으면 피그마 시안과 같은 회색 자리표시를 보여줘요. */
export function Photo({ src, className = '', radius = 20, tone = 'mid', alt = '' }: { src?: string | null; className?: string; radius?: number; tone?: 'light' | 'mid' | 'dark'; alt?: string }) {
  if (src) return <img src={src} alt={alt} className={`block object-cover ${className}`} style={{ borderRadius: radius }} />
  const g = tone === 'light' ? ['#c9c9c9', '#8f8f8f'] : tone === 'dark' ? ['#7a7a7a', '#2c2c2c'] : ['#b4b4b4', '#5c5c5c']
  return (
    <div className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} overflow-hidden ${className}`} style={{ borderRadius: radius, background: `linear-gradient(180deg, ${g[0]}, ${g[1]})` }} role="img" aria-label={alt || '사진'}>
      <span className="absolute rounded-full bg-white/15" style={{ width: '46%', aspectRatio: '1', right: '-10%', top: '-16%' }} />
      <span className="absolute rounded-t-[18px] bg-black/15" style={{ width: '34%', height: '52%', left: '12%', bottom: 0 }} />
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

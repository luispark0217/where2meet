import { CAT_COLOR, CAT_SHORT } from '../data/categories'
import type { ReactNode } from 'react'
import { SEOUL_OUTLINE } from './seoulOutline'

/**
 * 지도판 (카카오맵 자리)
 * ─ 지금은 피그마 시안과 같은 그림 지도를 깔아요. 카카오맵 키가 생기면 이 부분만 카카오맵으로 바꾸고,
 *   위에 올린 핀·숫자 원은 그대로 써요.
 * ─ 피그마 좌표(390×844)를 그대로 쓰기 위해 390px 폭 판을 화면 가운데에 둬요.
 */
export function MapBoard({ height = 844, children, art, className = '' }: { height?: number; children?: ReactNode; art: ReactNode; className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 top-0 z-0 overflow-hidden ${className}`} style={{ height: `calc(var(--sat) - 44px + ${height}px)` }}>
      <div className="absolute left-1/2 w-[390px] -translate-x-1/2" style={{ top: 'calc(var(--sat) - 44px)', height }}>
        <div className="absolute inset-0">{art}</div>
        <div className="pointer-events-auto absolute inset-0">{children}</div>
      </div>
    </div>
  )
}

const road = '#ffffff'

/** D · 서울 전체 */
export function SeoulArt() {
  const labels: [string, number, number][] = [
    ['은평구', 84, 244], ['종로구', 176, 326], ['노원구', 292, 196], ['마포구', 82, 416], ['용산구', 176, 478], ['성동구', 254, 422],
    ['강서구', 36, 500], ['영등포구', 108, 538], ['강남구', 248, 568], ['송파구', 312, 532], ['관악구', 150, 620],
  ]
  return (
    <svg width="390" height="844" viewBox="0 0 390 844" className="absolute inset-0 bg-map" aria-hidden>
      <g fill={road}>
        {[150, 260, 350, 600, 700].map((y) => <rect key={y} x="0" y={y} width="390" height="3" />)}
        {[90, 200, 300].map((x) => <rect key={x} x={x} y="0" width="3" height="844" />)}
      </g>
      <path d={SEOUL_OUTLINE} fill="#f7f8f3" fillOpacity=".75" stroke="#8fae4f" strokeWidth="1.5" strokeDasharray="4 4" strokeLinejoin="round" />
      <g fill="var(--color-park)">
        <ellipse cx="170" cy="238" rx="50" ry="28" /><ellipse cx="202" cy="434" rx="22" ry="14" />
        <ellipse cx="200" cy="586" rx="40" ry="20" /><ellipse cx="326" cy="285" rx="30" ry="35" />
      </g>
      <path d="M0 452 C 60 440, 110 462, 170 450 S 280 438, 330 452 S 380 460, 390 452" fill="none" stroke="#cfe2ee" strokeWidth="18" strokeLinecap="round" />
      {labels.map(([t, x, y]) => <text key={t} x={x} y={y} fontSize="11" fontWeight="500" fill="var(--color-paper-muted)">{t}</text>)}
    </svg>
  )
}

/** E · 홍대·연남 확대 */
export function HongdaeArt() {
  return (
    <svg width="390" height="844" viewBox="0 0 390 844" className="absolute inset-0 bg-map-2" aria-hidden>
      <g fill={road}>
        {[120, 210, 330, 470, 590, 700].map((y) => <rect key={y} x="0" y={y} width="390" height="10" />)}
        <rect x="60" y="0" width="6" height="844" /><rect x="150" y="0" width="12" height="844" />
        <rect x="230" y="0" width="6" height="844" /><rect x="330" y="0" width="6" height="844" />
      </g>
      <rect x="-90.7" y="355.3" width="700" height="44" fill="var(--color-park)" transform="rotate(-35 259.3 377.3)" />
      <text x="40" y="534" fontSize="11" fontWeight="500" fill="#6e8a4e" transform="rotate(-35 66 530)">경의선숲길</text>
      <rect x="-88.1" y="600.6" width="700" height="14" fill={road} transform="rotate(22 261.9 607.6)" />
    </svg>
  )
}

/** F · 장소 주변 */
export function PlaceArt() {
  return (
    <svg width="390" height="360" viewBox="0 0 390 360" className="absolute inset-0 bg-map-2" aria-hidden>
      <g fill={road}>
        {[110, 200, 300].map((y) => <rect key={y} x="0" y={y} width="390" height="8" />)}
        {[70, 180, 300].map((x) => <rect key={x} x={x} y="0" width="8" height="360" />)}
      </g>
    </svg>
  )
}

/** 지도 위 카테고리 네모 핀 (카·식·술·영·만) */

export function CategoryPin({ cat, x, y }: { cat: string; x: number; y: number }) {
  return (
    <span className="absolute flex size-[32px] items-center justify-center rounded-[10px] bg-white text-[13px] font-black leading-none shadow-float"
      style={{ left: x, top: y, color: CAT_COLOR[cat] }} aria-label={cat}>{CAT_SHORT[cat]}</span>
  )
}

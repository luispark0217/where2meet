import type { RefObject } from 'react'
import type { TugBoard, TugStep } from '../../api/tug'
import { Avatar } from '../Avatar'
import { useCoverScale } from './useCoverScale'

const W = 390
const H = 560

/**
 * M·R 줄다리기 지도판 (카카오맵 다크 자리)
 * ─ 피그마 지도판 390×560 좌표 그대로 그리고, 폰 크기에 맞춰 통째로 늘이거나 줄여요 (아래쪽 기준).
 * ─ 화면이 낮아(SE 등) 그렇게 채우면 사람·중간 지점·말풍선이 위 제목이나 아래 판에 가려질 때는,
 *   그것들이 다 보이도록 지도판을 줄여 제목(avoidTop) 아래 ~ 판(insetBottom) 위 사이 가운데에 둬요.
 * ─ 카카오맵이 붙으면 TugArt 만 지도로 바꾸고 위의 사람·선·중간 지점은 그대로 써요.
 */
export function TugMap({ board, step, className = '', style, avoidTop, insetBottom = 0 }: {
  board: TugBoard; step: TugStep; className?: string; style?: React.CSSProperties
  /** 지도 위에 떠 있는 머리(뒤로·제목·타이머) — 이 아래부터 보이는 자리 */
  avoidTop?: RefObject<HTMLElement | null>
  /** 지도 아래쪽을 덮는 판의 높이(px) */
  insetBottom?: number
}) {
  const { ref, scale: cover, box } = useCoverScale(W, H, avoidTop)
  const me = board.players[0]?.member.id
  const { point } = step
  const place = placeBoard(board, step, box, cover, box.top, insetBottom)
  return (
    <div ref={ref} className={`overflow-hidden bg-[#141c18] ${className}`} style={style}
      role="img" aria-label={`줄다리기 지도: 중간 지점이 ${step.bubble.replace(/!$/, '')}. ${board.players.map((p) => `${p.member.name} ${fmtDelta(step.deltas[p.member.id] ?? 0)}`).join(', ')}`}>
      <div className="absolute origin-top-left" aria-hidden
        style={{ width: W, height: H, left: place.left, top: place.top, transform: `scale(${place.scale})` }}>
        <TugArt />

        {/* 친구들 → 중간 지점 줄 */}
        <svg width={W} height={H} className="absolute inset-0">
          {board.players.map((p) => (
            <line key={p.member.id} x1={p.x} y1={p.y} x2={point.x} y2={point.y} strokeLinecap="round"
              stroke={p.member.id === me ? 'var(--color-lime)' : 'rgba(255,255,255,.4)'} strokeWidth={p.member.id === me ? 7 : 2.5} />
          ))}
        </svg>

        {/* 원래 지점 */}
        <span className="absolute size-[26px] rounded-full border-[1.5px] border-dashed border-white/55" style={{ left: board.origin.x - 13, top: board.origin.y - 13 }} />
        <span className="absolute whitespace-nowrap text-[11px] font-medium leading-[1.35] text-white/55" style={{ left: board.origin.x - 24, top: board.origin.y + 18 }}>{board.origin.label}</span>

        {/* 지금 중간 지점 (빛 번짐 + 점) */}
        <span className="absolute size-[180px] rounded-full" style={{ left: point.x - 90, top: point.y - 90,
          background: 'radial-gradient(circle closest-side, rgba(198,244,50,.66) 0%, rgba(198,244,50,.6) 27%, rgba(198,244,50,.26) 66%, rgba(198,244,50,.09) 80%, rgba(198,244,50,0) 96%)' }} />
        <span className="absolute size-[36px] rounded-full border-[3px] border-white bg-lime" style={{ left: point.x - 18, top: point.y - 18 }} />
        <span className="absolute whitespace-nowrap rounded-full bg-white px-[12px] py-[6px] text-[12px] font-bold leading-[1.35] text-ink" style={{ left: step.bubbleAt.x, top: step.bubbleAt.y }}>{step.bubble}</span>

        {/* 사람들 */}
        {board.players.map((p) => {
          const d = step.deltas[p.member.id] ?? 0
          return (
            <span key={p.member.id}>
              <Avatar member={p.member} size={46} ring={3.286} fontSize={18} className="absolute"
                ringColor={p.member.id === me ? 'var(--color-lime)' : 'var(--color-night)'} style={{ left: p.x - 23, top: p.y - 23 }} />
              <span className={`absolute -translate-x-1/2 whitespace-nowrap rounded-full border border-white/25 bg-night/70 px-[8px] py-[3px] text-[11px] font-medium leading-[1.35] ${d < 0 ? 'text-lime' : 'text-white'}`}
                style={{ left: p.x, top: p.y + 28 }}>{fmtDelta(d)}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** 꼭 보여야 하는 것들(사람·이름표·중간 지점·말풍선·원래 지점)을 감싸는 상자 (지도판 좌표) */
function contentBox(board: TugBoard, step: TugStep) {
  const xs: number[] = []
  const ys: number[] = []
  const add = (x0: number, y0: number, x1: number, y1: number) => { xs.push(x0, x1); ys.push(y0, y1) }
  for (const p of board.players) add(p.x - 28, p.y - 23, p.x + 28, p.y + 48)
  add(step.point.x - 18, step.point.y - 18, step.point.x + 18, step.point.y + 18)
  add(step.bubbleAt.x, step.bubbleAt.y, step.bubbleAt.x + textW(step.bubble, 12) + 24, step.bubbleAt.y + 29)
  add(board.origin.x - 24, board.origin.y - 13, board.origin.x - 24 + textW(board.origin.label, 11), board.origin.y + 33)
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }
}
/** 글자 폭 어림 (한글 ≈ 1em, 그 밖 ≈ 0.55em) */
const textW = (t: string, size: number) => [...t].reduce((w, ch) => w + (/[\u3131-\uD79D]/.test(ch) ? size : size * 0.55), 0)

function placeBoard(board: TugBoard, step: TugStep, box: { w: number; h: number }, cover: number, top: number, insetBottom: number) {
  // 기본: 꽉 채우고 아래쪽 맞춤 (피그마 390×844 에서는 배율 1 · 그대로)
  const base = { scale: cover, left: (box.w - W * cover) / 2, top: box.h - H * cover }
  const c = contentBox(board, step)
  const minY = top + 8
  const maxY = box.h - insetBottom - 6
  const fits = base.top + c.y0 * cover >= minY && base.top + c.y1 * cover <= maxY
    && base.left + c.x0 * cover >= 0 && base.left + c.x1 * cover <= box.w
  if (fits || maxY - minY < 40) return base
  const scale = Math.min(cover, (maxY - minY) / (c.y1 - c.y0), (box.w - 16) / (c.x1 - c.x0))
  return {
    scale,
    left: box.w / 2 - ((c.x0 + c.x1) / 2) * scale,
    top: minY + (maxY - minY - (c.y1 - c.y0) * scale) / 2 - c.y0 * scale,
  }
}

const fmtDelta = (d: number) => `${d > 0 ? '+' : d < 0 ? '-' : '±'}${Math.abs(d)}분`

/** 다크 지도 그림 (피그마 'Map · 카카오맵 (다크)') */
function TugArt() {
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 overflow-visible">
      {/* 길은 판 밖으로도 이어 그려요 (작은 화면에서 판을 줄였을 때 빈 곳이 안 보이게) */}
      <g fill="#243029">
        {[110, 260, 390, 500].map((y) => <rect key={y} x={-W} y={y} width={W * 3} height="8" />)}
        {[70, 200, 320].map((x) => <rect key={x} x={x} y={-H} width="8" height={H * 2} />)}
      </g>
      {/* 한강 */}
      <rect x="-110.4" y="489" width="800" height="50" fill="#10262a" transform="rotate(10 289.6 514)" />
      <defs>
        <linearGradient id="tug-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0e100f" stopOpacity="0" />
          <stop offset="1" stopColor="#0e100f" />
        </linearGradient>
      </defs>
      <rect x={-W} y="360" width={W * 3} height="200" fill="url(#tug-fade)" />
      <rect x={-W} y={H} width={W * 3} height={H} fill="#0e100f" />
    </svg>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { tugApi, type PullError, type TugBoard } from '../../api/tug'
import { useApi } from '../../api/useApi'
import { IconButton } from '../../components/IconButton'
import { Screen } from '../../components/Screen'
import { StateView } from '../../components/StateView'
import { toast } from '../../components/toast'
import { TugMap } from '../../components/tug/TugMap'
import { useBack } from '../../components/useBack'
import { mmss, useCountdown } from '../../components/useCountdown'
import { ro } from '../../lib/josa'
import { at } from '../../components/figma'

/**
 * 아래 판 높이: 피그마 344px (= 310 + 홈바 34).
 * 낮은 화면(높이 640px 이하: SE·가로 화면)에서는 지도가 보이게 판을 줄여요 — 당기기 72px, 안내 문구는 읽어주기만.
 */
const PANEL = { normal: 310, compact: 262 }
const panelH = (compact: boolean) => `calc(${compact ? PANEL.compact : PANEL.normal}px + var(--tabpad))`

const PULL_ERROR: Record<PullError, string> = {
  DEADLINE_PASSED: '줄다리기가 끝났어요',
  NO_PULLS_LEFT: '당기기를 모두 썼어요',
  GAP_LIMIT: '더 당기면 최대 차이가 한도를 넘어요',
}
const AV: Record<string, string> = { lime: 'var(--color-lime)', yellow: 'var(--color-av-yellow)', blue: 'var(--color-av-blue)', pink: 'var(--color-av-pink)', purple: 'var(--color-av-purple)' }

/**
 * M · 장소 줄다리기 (피그마 31:96) / R · 당긴 후 (피그마 35:205)
 * ─ 당긴 횟수·지금 칸·마감은 서버(목: store) 값을 그대로 써요. '당기기'를 누르면 서버가 돌려준 판으로 바꿔 그려요.
 * ─ ?pulled=1 은 디자인 비교용 R 미리보기예요 (실제로 당기지는 않아요).
 */
/** 원 버튼 대비 빛 번짐 지름 (피그마 184 / 96) */
const GLOW = 184 / 96

function useMediaQuery(q: string) {
  const [on, setOn] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const f = () => setOn(mq.matches)
    f()
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [q])
  return on
}

export default function Tug() {
  const { id } = useParams() as { id: string }
  const [params] = useSearchParams()
  const back = useBack(`/meet/${id}`)
  const preview = params.get('pulled') === '1' ? 'R' as const : undefined
  const { data: loaded, status } = useApi(() => tugApi.board(id, { preview }), [id, preview])
  const [pulledBoard, setPulledBoard] = useState<TugBoard>()
  const board = pulledBoard?.meetingId === id ? pulledBoard : loaded

  const step = board?.steps[board.stepIdx]
  const left = useCountdown(board?.endsAt)
  const over = !!board && left <= 0
  const pullsLeft = board ? Math.max(0, board.pullsTotal - board.pullsUsed) : 0
  const compact = useMediaQuery('(max-height: 640px)')
  const PANEL_H = panelH(compact)
  const btn = compact ? 72 : 96
  /** 옆 버튼: 피그마 100×48, 좁으면 당기기 둘레 8px 띄우고 줄여요 */
  const side = { top: (btn - 48) / 2, width: `min(100px, calc(50% - ${btn / 2 + 8}px))` }
  const headerRef = useRef<HTMLElement>(null)
  const newsColor = AV[board?.players.find((p) => p.member.id === step?.news.authorId)?.member.color ?? 'lime']

  // 꾹 누르기: 0.45초 누르고 있으면 한 칸 (손을 떼면서 생기는 click 은 한 번 무시)
  const hold = useRef<{ t?: number; fired?: boolean }>({})
  const pressStart = () => { hold.current.fired = false; hold.current.t = window.setTimeout(() => { hold.current.fired = true; void pull() }, 450) }
  const pressEnd = () => window.clearTimeout(hold.current.t)
  const onClick = () => { if (hold.current.fired) { hold.current.fired = false; return } void pull() }

  const busy = useRef(false)
  const pull = async () => {
    if (!board || busy.current) return
    busy.current = true
    try {
      setPulledBoard(await tugApi.pull(id))
    } catch (e) {
      toast(PULL_ERROR[(e as Error).message as PullError] ?? '당기지 못했어요. 다시 시도해주세요')
    } finally {
      busy.current = false
    }
  }

  return (
    <Screen padTop={false} className="h-dvh overflow-hidden" title="장소 줄다리기">
      {board && step && (
        <TugMap board={board} step={step} className="absolute inset-x-0 top-0" style={{ bottom: `calc(${PANEL_H} - 60px)` }} avoidTop={headerRef} insetBottom={60} />
      )}

      <header ref={headerRef} className="absolute left-[24px] right-[24px] z-10 flex h-[40px] items-center justify-between" style={{ top: at(52) }}>
        <IconButton label="뒤로" onClick={back}>←</IconButton>
        <h1 className="absolute left-1/2 top-[10px] -translate-x-1/2 whitespace-nowrap text-[17px] font-bold leading-[1.35]">장소 줄다리기</h1>
        {board && (
          <span role="timer" aria-label={over ? '줄다리기 끝' : `남은 시간 ${mmss(left)}`}
            className={`mt-[4px] rounded-full px-[12px] py-[7px] text-[13px] font-bold leading-[1.35] ${over ? 'border border-white/25 text-white' : 'bg-lime text-ink'}`}>
            {over ? '마감' : mmss(left)}
          </span>
        )}
      </header>

      {status !== 'ok' && <div className="pt-[100px]"><StateView status={status} what="줄다리기" notFound="이 약속은 지금 줄다리기 중이 아니에요." back={{ to: `/meet/${id}`, label: '약속으로 돌아가기' }} /></div>}

      {board && step && (
        <section aria-label="내 줄다리기" className="absolute inset-x-0 bottom-0 z-10 rounded-t-[32px] bg-night-1" style={{ height: PANEL_H }}>
          <p className="absolute left-[24px] top-[24px] text-[12px] font-medium leading-[1.35] text-night-muted">내 이동시간</p>
          <p className="absolute left-[24px] top-[42px] whitespace-nowrap text-[26px] font-black leading-[1.35]" aria-live="polite">
            {board.myBaseMin}분 → {step.myMin}분
          </p>

          <div className="absolute top-[24px]" style={{ left: 'calc(100% - 122px)' }}>
            <p className="text-[12px] font-medium leading-[1.35] text-night-muted">남은 당기기</p>
            <p className="mt-[11.8px] flex gap-[8px]">
              {Array.from({ length: board.pullsTotal }, (_, i) => (
                <span key={i} aria-hidden className={`block size-[18px] rounded-full ${i < pullsLeft ? 'bg-lime' : 'border-[1.5px] border-white/30'}`} />
              ))}
              <span className="sr-only" aria-live="polite">{pullsLeft}번 남음</span>
            </p>
          </div>

          <p className="absolute left-[24px] top-[96px] text-[12px] font-medium leading-[1.35] text-night-muted">공정성 게이지 · 최대 차이</p>
          <p className="absolute right-[24px] top-[96px] text-[12px] font-bold leading-[1.35] text-lime">{step.gapMin}분 / {board.gapLimitMin}분</p>
          <div className="absolute left-[24px] right-[24px] top-[120px] h-[10px] rounded-[5px] bg-white/12" role="meter"
            aria-label="공정성 게이지" aria-valuemin={0} aria-valuemax={board.gapLimitMin} aria-valuenow={step.gapMin} aria-valuetext={`최대 차이 ${step.gapMin}분`}>
            <div className="h-full rounded-[5px] transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${(step.gapMin / board.gapLimitMin) * 100}%`, background: 'linear-gradient(90deg, #c6f432 0%, #e8f04a 75%, #ffb23c 100%)' }} />
            <span className="absolute right-0 top-[-5px] h-[20px] w-[3px] rounded-[1.5px] bg-live" aria-hidden />
          </div>

          <p className="absolute left-[24px] right-[24px] top-[146px] flex items-center gap-[6px] text-[12px] font-medium leading-[1.35] text-white/70" aria-live="polite">
            <span className="block size-[8px] shrink-0 rounded-full" style={{ background: newsColor }} />
            <span className="truncate">{step.news.text}</span>
          </p>

          {/* 확정 투표 · 당기기 · 채팅 — 보이는 순서 그대로 (좁은 폰에서는 옆 버튼을 줄여 당기기와 안 겹치게) */}
          <div className="absolute left-[24px] right-[24px]" style={{ top: compact ? 166 : 170, height: btn }}>
            <Link to={`/meet/${id}/vote`} className="absolute left-0 flex h-[48px] items-center justify-center rounded-full border border-white/30 text-[13px] font-bold leading-[1.35]" style={side}>확정 투표</Link>
            <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden
              style={{ width: btn * GLOW, height: btn * GLOW, background: 'radial-gradient(circle closest-side, rgba(198,244,50,.5) 52%, rgba(198,244,50,.36) 60%, rgba(198,244,50,.15) 80%, rgba(198,244,50,0) 100%)' }} />
            <button type="button" onClick={onClick} onPointerDown={pressStart} onPointerUp={pressEnd} onPointerLeave={pressEnd} onPointerCancel={pressEnd} onContextMenu={(e) => e.preventDefault()} aria-disabled={over || pullsLeft <= 0}
              aria-describedby="tug-hint"
              className={`absolute left-1/2 top-0 flex -translate-x-1/2 items-center justify-center rounded-full bg-lime font-black leading-[1.35] text-ink transition-transform active:scale-95 aria-disabled:opacity-60 focus-visible:outline-white motion-reduce:transition-none motion-reduce:active:scale-100 ${compact ? 'pb-[4px] text-[15px]' : 'pb-[5px] text-[17px]'}`}
              style={{ width: btn, height: btn }}>
              당기기
            </button>
            <Link to={`/meet/${id}/chat`} className="absolute right-0 flex h-[48px] items-center justify-center rounded-full border border-white/30 text-[13px] font-bold leading-[1.35]" style={side}>채팅</Link>
          </div>
          {over
            ? <p id="tug-hint" className={`absolute inset-x-[24px] text-center text-[12px] font-bold leading-[1.35] text-white ${compact ? 'top-[242px]' : 'top-[276px]'}`} role="status">
                줄다리기 끝 · {step.stationName}{ro(step.stationName)} 결정! <Link to={`/meet/${id}/vote`} className="text-lime underline underline-offset-4">확정 투표하기</Link>
              </p>
            : <p id="tug-hint" className={`absolute inset-x-[24px] top-[280px] text-center text-[11px] font-medium leading-[1.35] text-night-muted ${compact ? 'sr-only' : ''}`}>
                {/* 보이는 문구는 피그마 그대로, 읽어주는 문구는 실제 동작(누를 때마다 한 칸)대로 */}
                <span aria-hidden>꾹 누르고 있으면 내 쪽으로 한 칸씩</span>
                <span className="sr-only">누를 때마다 내 쪽으로 한 칸 당겨요. 남은 당기기 {pullsLeft}번</span>
              </p>}
        </section>
      )}
    </Screen>
  )
}

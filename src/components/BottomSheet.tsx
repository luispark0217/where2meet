import { useEffect, useId, useRef, type ReactNode } from 'react'
import { BackgroundContext } from './backgroundContext'

/*
 * 시트를 연 버튼 기억하기: 시트는 주소가 바뀌며 열려서 연 버튼이 있던 화면이 한 번 사라져요.
 * 그래서 마지막으로 포커스된 요소를 '다시 찾을 수 있는 모양'(aria-label / href)으로 기억해 두고,
 * 시트가 닫히면 돌아온 화면에서 같은 요소를 찾아 포커스를 돌려줘요.
 */
let lastFocus: string | null = null
const describe = (el: Element | null): string | null => {
  if (!(el instanceof HTMLElement) || el.closest('[role="dialog"]')) return null
  const label = el.getAttribute('aria-label')
  if (label) return `${el.tagName.toLowerCase()}[aria-label="${CSS.escape(label)}"]`
  const href = el.getAttribute('href')
  if (href) return `a[href="${CSS.escape(href)}"]`
  return null
}
if (typeof document !== 'undefined') {
  document.addEventListener('focusin', (e) => { const d = describe(e.target as Element); if (d) lastFocus = d }, true)
}

/**
 * 아래에서 올라오는 시트 (K 만들기 · S 공유하기)
 * - 뒤 화면(background)은 62% 어둡게 덮고, 누르면 닫혀요.
 * - role="dialog" aria-modal, 열리면 시트에 포커스, Esc 로 닫기, Tab 은 시트 안에서만 돌아요.
 * - 화면보다 길면(가로 화면·작은 창) 시트 안에서 스크롤돼요. 제목·닫기는 맨 위에 있어요.
 * - 피그마: 시트 윗모서리 32px, 손잡이 40×5 (y 10), 제목 20px (y 32), 닫기 40px (오른쪽 24)
 */
export function BottomSheet({ title, onClose, background, children, closeTop = 24, padBottom }: {
  title: string
  onClose: () => void
  /** 시트 뒤에 흐리게 보일 화면 (조작 불가) */
  background?: ReactNode
  children: ReactNode
  /** 닫기 버튼 y (시트 기준) — 피그마 K 24, S 26 */
  closeTop?: number
  /** 시트 아래 여백 (CSS 값). 기본: 홈바 + 6px, 최소 24px */
  padBottom?: string
}) {
  const sheetRef = useRef<HTMLElement>(null)
  const titleId = useId()
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose })

  // 문서 제목은 시트 제목 (뒤 화면은 제목을 안 바꿔요)
  useEffect(() => { document.title = `${title} · where2meet` }, [title])

  useEffect(() => {
    const sheet = sheetRef.current
    const opener = lastFocus
    sheet?.focus()
    // 뒤 화면 스크롤 막기
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current() }
      if (e.key !== 'Tab' || !sheet) return
      // 포커스를 시트 안에 가두기
      const items = [...sheet.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === sheet)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      // 돌아온 화면이 그려진 뒤 연 버튼에 포커스 (못 찾으면 그대로)
      if (opener) window.setTimeout(() => document.querySelector<HTMLElement>(opener)?.focus(), 60)
    }
  }, [])

  return (
    <>
      {background && <div inert aria-hidden="true"><BackgroundContext value={true}>{background}</BackgroundContext></div>}
      {/* 어두운 막 — 누르면 닫혀요 (키보드는 닫기 버튼/Esc 사용) */}
      <div className="fixed inset-0 z-40 bg-[rgba(0,0,0,0.62)]" onClick={onClose} aria-hidden="true" />
      <section
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fixed bottom-0 left-1/2 z-50 max-h-[calc(100dvh-var(--sat)-12px)] w-full max-w-[430px] -translate-x-1/2 overflow-y-auto overscroll-contain rounded-t-[32px] bg-night-1 px-6 text-white outline-none focus-visible:outline-none"
        style={{ paddingBottom: padBottom ?? 'max(24px, calc(6px + var(--sab)))' }}
      >
        <span aria-hidden className="absolute left-1/2 top-[10px] h-[5px] w-[40px] -translate-x-1/2 rounded-[3px] bg-night-line" />
        <h2 id={titleId} className="pr-[52px] pt-[32px] text-[20px] font-black leading-[1.35]">{title}</h2>
        <button type="button" aria-label="닫기" onClick={onClose}
          className="absolute right-6 flex size-[40px] items-center justify-center rounded-full border border-white/20 bg-white/8 text-white"
          style={{ top: closeTop }}>
          {/* × 아이콘 */}
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
        {children}
      </section>
    </>
  )
}

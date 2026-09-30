import type { AriaRole, FocusEvent, ReactNode } from 'react'

type Size = 'md' | 'sm' | 'smTall' | 'xs'
const PAD: Record<Size, string> = {
  md: 'px-[14px] py-[8px] text-[13px]',
  sm: 'px-[12px] py-[6px] text-[12px]',
  /** K 모임 칩 · O 빠른 답장 (피그마 30px) */
  smTall: 'px-[12px] py-[7px] text-[12px]',
  xs: 'px-[10px] py-[4px] text-[11px]',
}

/** 가로 칩 줄 안에서 포커스된 칩이 화면 밖이면 보이게 넘겨요 */
const reveal = (e: FocusEvent<HTMLElement>) => e.currentTarget.scrollIntoView({ inline: 'nearest', block: 'nearest' })

/**
 * 칩 버튼
 * - theme="dark": 켜짐 = 라임 바탕, 꺼짐 = 흰 테두리 (어두운 화면)
 * - theme="light": 켜짐 = 검은 바탕 + 라임 글자, 꺼짐 = 흰 바탕 + 그림자 (지도 화면)
 * - pressable=false: 켜고 끄는 칩이 아니라 그냥 누르는 버튼 (빠른 답장 등) → aria-pressed 없음
 * - 포커스 테두리는 칩 안쪽에 그려요 (가로 스크롤 줄이 바깥 테두리를 잘라서)
 */
export function Chip({ children, on = false, theme = 'dark', size = 'md', onClick, className = '', pressable = true }: {
  children: ReactNode; on?: boolean; theme?: 'dark' | 'light'; size?: Size; onClick?: () => void; className?: string; pressable?: boolean
}) {
  const look = theme === 'dark'
    ? on ? 'bg-lime text-ink font-bold border-0' : 'border border-white/25 text-white font-medium'
    : on ? 'bg-ink text-lime font-bold' : 'bg-white text-ink font-medium shadow-float'
  const ring = (theme === 'dark') === on ? 'focus-visible:outline-ink' : 'focus-visible:outline-lime'
  return (
    <button type="button" onClick={onClick} onFocus={reveal} aria-pressed={pressable ? on : undefined}
      className={`shrink-0 whitespace-nowrap rounded-full leading-[1.35] focus-visible:outline-offset-[-3px] ${ring} ${PAD[size]} ${look} ${className}`}>
      {children}
    </button>
  )
}

/** 가로로 넘기는 칩 줄 */
export function ChipRow({ children, gap = 8, className = '', style, role, 'aria-label': label }: {
  children: ReactNode; gap?: number; className?: string; style?: React.CSSProperties; role?: AriaRole; 'aria-label'?: string
}) {
  return <div role={role} aria-label={label} className={`no-scrollbar flex scroll-px-6 items-center overflow-x-auto ${className}`} style={{ gap, ...style }}>{children}</div>
}

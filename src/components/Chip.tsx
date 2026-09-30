import type { ReactNode } from 'react'

type Size = 'md' | 'sm' | 'xs'
const PAD: Record<Size, string> = {
  md: 'px-[14px] py-[8px] text-[13px]',
  sm: 'px-[12px] py-[6px] text-[12px]',
  xs: 'px-[10px] py-[4px] text-[11px]',
}

/**
 * 칩 버튼
 * - theme="dark": 켜짐 = 라임 바탕, 꺼짐 = 흰 테두리 (어두운 화면)
 * - theme="light": 켜짐 = 검은 바탕 + 라임 글자, 꺼짐 = 흰 바탕 + 그림자 (지도 화면)
 */
export function Chip({ children, on = false, theme = 'dark', size = 'md', onClick, className = '' }: {
  children: ReactNode; on?: boolean; theme?: 'dark' | 'light'; size?: Size; onClick?: () => void; className?: string
}) {
  const look = theme === 'dark'
    ? on ? 'bg-lime text-ink font-bold border-0' : 'border border-white/25 text-white font-medium'
    : on ? 'bg-ink text-lime font-bold' : 'bg-white text-ink font-medium shadow-float'
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={`shrink-0 whitespace-nowrap rounded-full leading-[1.35] ${PAD[size]} ${look} ${className}`}>
      {children}
    </button>
  )
}

/** 가로로 넘기는 칩 줄 */
export function ChipRow({ children, gap = 8, className = '', style }: { children: ReactNode; gap?: number; className?: string; style?: React.CSSProperties }) {
  return <div className={`no-scrollbar flex items-center overflow-x-auto ${className}`} style={{ gap, ...style }}>{children}</div>
}

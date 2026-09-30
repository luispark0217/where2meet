import type { ReactNode } from 'react'
import { IconButton } from './IconButton'
import { useBack } from './useBack'

/**
 * 상단바: 왼쪽 뒤로(40px) · 가운데 제목(17px bold) · 오른쪽 자리(선택)
 * 피그마 C·M·O 등에서 y=52(프레임) → 화면 기준 mt 8px.
 */
export function TopBar({ title, right, theme = 'dark', fallback = '/', className = '' }: {
  title?: ReactNode; right?: ReactNode; theme?: 'dark' | 'light'; fallback?: string; className?: string
}) {
  const back = useBack(fallback)
  return (
    <header className={`mt-[8px] flex h-[40px] items-center justify-between ${className}`}>
      <IconButton label="뒤로" variant={theme === 'dark' ? 'glass' : 'white'} onClick={back}>←</IconButton>
      <h1 className={`min-w-0 flex-1 truncate px-3 pt-[3px] text-center text-[17px] font-bold leading-[1.35] ${theme === 'dark' ? 'text-white' : 'text-ink'}`}>{title}</h1>
      <span className="flex min-w-[40px] justify-end">{right}</span>
    </header>
  )
}

import { useContext, useEffect, type ReactNode } from 'react'
import { BackgroundContext } from './backgroundContext'

const BG = {
  night: 'bg-night text-white',
  paper: 'bg-paper text-ink',
  map: 'bg-map text-ink',
  map2: 'bg-map-2 text-ink',
  white: 'bg-white text-ink',
} as const

/**
 * 화면 틀. 폰 폭(최대 430px)으로 가운데 정렬하고, 위쪽 안전 영역(노치)만큼 띄워요.
 * 피그마 좌표 y 에서 44(상태바)를 뺀 값이 이 틀 안에서의 위치예요.
 */
export function Screen({ children, bg = 'night', className = '', padTop = true, title }: {
  children: ReactNode; bg?: keyof typeof BG; className?: string; padTop?: boolean; title?: string
}) {
  const inBackground = useContext(BackgroundContext)
  useEffect(() => { if (!inBackground) document.title = title ? `${title} · where2meet` : 'where2meet' }, [title, inBackground])
  return (
    <div className={`relative flow-root mx-auto min-h-dvh w-full max-w-[430px] overflow-x-clip ${BG[bg]} ${className}`}
      style={padTop ? { paddingTop: 'var(--sat)' } : undefined}>
      {children}
    </div>
  )
}

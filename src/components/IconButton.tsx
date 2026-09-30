import type { ReactNode } from 'react'

/**
 * 동그란 아이콘 버튼
 * - glass: 어두운 화면용 (반투명 흰 바탕 + 테두리)
 * - white: 사진·지도 위 (흰 바탕 + 그림자)
 * - ink: 검은 바탕
 */
export function IconButton({ children, label, variant = 'glass', size = 40, onClick, className = '' }: {
  children: ReactNode; label: string; variant?: 'glass' | 'white' | 'ink'; size?: number; onClick?: () => void; className?: string
}) {
  const look = variant === 'glass' ? 'bg-white/8 border border-white/20 text-white'
    : variant === 'white' ? 'bg-white text-ink shadow-float'
    : 'bg-ink text-white'
  return (
    <button type="button" aria-label={label} onClick={onClick} className={`flex shrink-0 items-center justify-center rounded-full text-[17px] font-bold leading-none ${look} ${className}`} style={{ width: size, height: size }}>
      {children}
    </button>
  )
}

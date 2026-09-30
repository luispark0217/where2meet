import { Crown } from './Crown'

/**
 * "👑 왕: 대학 동기 모임" 작은 알약
 * - N: 검은 바탕 11px · P: 진한 회색 바탕 10px · O 장소 카드: 검은 바탕 10px · I: "왕 3" (label)
 * - 이름이 길면 알약 폭 안에서 말줄임(…) — 부모가 폭을 정해주면 그 안에 맞춰요
 */
export function KingTag({ name, label, tone = 'ink', size = 11, className = '' }: {
  name?: string; label?: string; tone?: 'ink' | 'line'; size?: 10 | 11; className?: string
}) {
  const text = label ?? `왕: ${name}`
  return (
    <span className={`flex min-w-0 max-w-full items-center gap-[4px] whitespace-nowrap rounded-full py-[3px] pl-[6px] pr-[8px] font-bold leading-[1.35] text-lime ${tone === 'ink' ? 'bg-ink' : 'bg-night-line'} ${className}`}
      style={{ fontSize: size }}>
      <Crown width={12} />
      <span className="min-w-0 truncate">{text}</span>
    </span>
  )
}

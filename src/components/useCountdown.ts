import { useEffect, useState } from 'react'

/**
 * 마감까지 남은 초 (올림). endsAt 이 없으면 0.
 * 남은 초는 그릴 때 계산하고, 타이머는 1초마다 '지금 시각'만 갱신해요 (처음 한 번 '마감'이 깜빡이지 않아요).
 * 마감이 지나면 타이머를 멈춰요. C 약속 상세 · M/R 줄다리기 · O 채팅이 모두 이 훅 하나를 써요.
 */
export function useCountdown(endsAt?: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!endsAt) return
    const t = setInterval(() => { const n = Date.now(); setNow(n); if (n >= endsAt) clearInterval(t) }, 250)
    return () => clearInterval(t)
  }, [endsAt])
  return endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0
}

/** 초 → "0:42" */
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

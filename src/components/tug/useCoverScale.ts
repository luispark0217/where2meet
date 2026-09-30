import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * 피그마 좌표판(w×h)을 상자에 꽉 채우는 배율 (CSS background-size: cover 처럼).
 * 390×560 지도판을 폰 크기에 맞춰 늘이거나 줄일 때 써요.
 * avoidTop 을 주면 그 요소의 아래 끝 y(상자 기준)도 box.top 으로 재요.
 */
export function useCoverScale(w: number, h: number, avoidTop?: RefObject<HTMLElement | null>) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w, h, top: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const hdr = avoidTop?.current
      const top = hdr ? Math.round(hdr.getBoundingClientRect().bottom - el.getBoundingClientRect().top) : 0
      const next = { w: el.clientWidth || w, h: el.clientHeight || h, top }
      setBox((b) => (b.w === next.w && b.h === next.h && b.top === next.top ? b : next))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [w, h, avoidTop])
  const scale = Math.max(box.w / w, box.h / h)
  return { ref, scale, box }
}

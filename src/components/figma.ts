/** 피그마 390×844 프레임의 y 좌표 → 화면 top 값 (상태바 44px 대신 실제 안전 영역만큼 띄워요) */
export const at = (y: number) => `calc(var(--sat) + ${y - 44}px)`

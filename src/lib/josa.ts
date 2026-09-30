/** 한국어 조사 고르기 (마지막 글자 받침 기준) */
const jong = (w: string) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 ? c % 28 : 0 }
/** 받침 있으면 '을', 없으면 '를' */
export const eul = (w: string) => (jong(w) > 0 ? '을' : '를')
/** 받침 있으면 '으로', 없거나 ㄹ받침이면 '로' */
export const ro = (w: string) => { const j = jong(w); return j === 0 || j === 8 ? '로' : '으로' }

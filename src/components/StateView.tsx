import { Link } from 'react-router-dom'
import type { ApiStatus } from '../api/useApi'

/** 받침 있으면 '을', 없으면 '를' */
const eul = (w: string) => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 > 0 ? '을' : '를' }

/** 불러오는 중 / 없음 / 오류 화면 */
export function StateView({ status, what = '내용', dark = true }: { status: ApiStatus; what?: string; dark?: boolean }) {
  if (status === 'ok') return null
  const box = dark ? 'bg-night-1 text-night-muted' : 'bg-paper-chip text-ink/70'
  if (status === 'loading') return <div className={`mx-6 mt-6 h-[120px] animate-pulse rounded-[22px] ${dark ? 'bg-night-1' : 'bg-paper-chip'}`} aria-label="불러오는 중" />
  return (
    <div className={`mx-6 mt-6 rounded-[22px] px-5 py-6 text-[14px] leading-[1.6] ${box}`}>
      {status === 'notfound' ? `${what}${eul(what)} 찾을 수 없어요. 링크가 바뀌었거나 삭제됐을 수 있어요.` : '불러오지 못했어요. 잠시 뒤 다시 시도해주세요.'}
      <Link to="/" className="mt-3 block font-bold text-lime underline underline-offset-4" style={dark ? undefined : { color: 'var(--color-ink)' }}>홈으로</Link>
    </div>
  )
}

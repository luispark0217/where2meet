import { Link } from 'react-router-dom'
import type { ApiStatus } from '../api/useApi'
import { eul } from '../lib/josa'

/**
 * 불러오는 중 / 없음 / 오류 화면
 * - notFound: '없음'일 때 기본 문구 대신 보여줄 말 (예: 이 약속은 아직 줄다리기 전이에요)
 * - back: '없음'일 때 아래 링크 (기본: 홈으로)
 */
export function StateView({ status, what = '내용', dark = true, notFound, back }: {
  status: ApiStatus; what?: string; dark?: boolean; notFound?: string; back?: { to: string; label: string }
}) {
  if (status === 'ok') return null
  const box = dark ? 'bg-night-1 text-night-muted' : 'bg-paper-chip text-ink/70'
  if (status === 'loading') return <div className={`mx-6 mt-6 h-[120px] animate-pulse rounded-[22px] ${dark ? 'bg-night-1' : 'bg-paper-chip'}`} aria-label="불러오는 중" />
  const link = (status === 'notfound' && back) || { to: '/', label: '홈으로' }
  return (
    <div className={`mx-6 mt-6 rounded-[22px] px-5 py-6 text-[14px] leading-[1.6] ${box}`}>
      {status === 'notfound' ? (notFound ?? `${what}${eul(what)} 찾을 수 없어요. 링크가 바뀌었거나 삭제됐을 수 있어요.`) : '불러오지 못했어요. 잠시 뒤 다시 시도해주세요.'}
      <Link to={link.to} className="mt-3 block font-bold text-lime underline underline-offset-4" style={dark ? undefined : { color: 'var(--color-ink)' }}>{link.label}</Link>
    </div>
  )
}

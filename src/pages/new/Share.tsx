import { useParams } from 'react-router-dom'
import { useApi } from '../../api/useApi'
import { socialApi } from '../../api/social'
import { Photo } from '../../components/Photo'
import { BottomSheet } from '../../components/BottomSheet'
import { copyLink } from '../../components/copyLink'
import { StateView } from '../../components/StateView'
import { soon } from '../../components/toast'
import { useBack } from '../../components/useBack'
import MeetingDetail from '../MeetingDetail'

/** 공유 대상 (피그마 색 그대로: 카카오 노랑 #fee500, 스토리 분홍 #e1306c) */
const TARGETS = [
  { key: 'kakao', label: '카카오톡', mark: 'K', bg: '#fee500', fg: 'var(--color-ink)' },
  { key: 'link', label: '링크 복사', mark: '∞', bg: 'var(--color-night-2)', fg: '#fff' },
  { key: 'story', label: '스토리', mark: '◎', bg: '#e1306c', fg: 'var(--color-ink)' },
  { key: 'more', label: '더보기', mark: '⋯', bg: 'var(--color-night-2)', fg: '#fff' },
] as const

/** S · 공유하기 시트 (피그마 35:170). 뒤에는 약속 상세 화면을 어둡게 깔아요. */
export default function Share() {
  const { id } = useParams() as { id: string }
  const close = useBack(`/meet/${id}`)
  const { data: s, status } = useApi(() => socialApi.share(id), [id])

  const onTarget = (key: (typeof TARGETS)[number]['key']) => {
    if (!s) return
    if (key === 'link') return copyLink(s.url)
    if (key === 'more' && navigator.share) {
      navigator.share({ title: s.title, text: `${s.title} · ${s.groupName}`, url: s.url }).catch(() => {})
      return
    }
    soon()
  }

  return (
    <BottomSheet title="공유하기" onClose={close} closeTop={26} background={<MeetingDetail />}
      padBottom="max(28px, calc(26px + var(--sab)))">
      {status !== 'ok' && <div className="-mx-6"><StateView status={status} what="약속" /></div>}
      {s && <>
        {/* 공유 미리보기 카드 */}
        <div className="mt-[23px] flex h-[96px] items-center rounded-[22px] bg-lime pl-[16px] pr-[14px] text-ink">
          <Photo src={s.photoUrl} className="size-[64px] shrink-0" radius={16} tone="mid" plain />
          <div className="ml-[14px] mt-[18px] min-w-0 self-start">
            <p className="truncate text-[15px] font-bold leading-[1.35]">{s.title} · {s.groupName}</p>
            <p className="mt-[3.75px] truncate text-[12px] font-medium leading-[1.35] text-ink/70">{s.whenWhere}</p>
            <p className="mt-[3.8px] truncate text-[11px] font-bold leading-[1.35] text-ink/50">{s.url.replace(/^https?:\/\//, '')}</p>
          </div>
        </div>

        {/* 공유 대상 */}
        <ul className="mr-[8px] mt-[26px] flex justify-between" aria-label="공유할 곳">
          {TARGETS.map((t) => (
            <li key={t.key} className="w-[76px]">
              <button type="button" onClick={() => onTarget(t.key)} className="flex w-full flex-col items-center rounded-[16px]">
                <span aria-hidden className="flex size-[60px] items-center justify-center rounded-full text-[20px] font-black leading-none" style={{ background: t.bg, color: t.fg }}>{t.mark}</span>
                <span className="mt-[8px] text-[12px] font-medium leading-[1.35] text-white">{t.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <button type="button" onClick={soon}
          className="mt-[29.8px] flex h-[52px] w-full items-center justify-center rounded-full border border-white/30 text-[15px] font-bold leading-[1.35]">
          모임 멤버 초대하기
        </button>
      </>}
    </BottomSheet>
  )
}

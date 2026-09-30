import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApi } from '../../api/useApi'
import { socialApi } from '../../api/social'
import { Crown } from '../../components/Crown'
import { RoundPhoto } from '../../components/Photo'
import { Screen } from '../../components/Screen'
import { StateView } from '../../components/StateView'
import { toast } from '../../components/toast'
import { TopBar } from '../../components/TopBar'

/** L · 왕좌 도전하기 (피그마 31:54) */
export default function Challenge() {
  const { id } = useParams() as { id: string }
  const { data: c, status } = useApi(() => socialApi.challenge(id), [id])
  const [notifyHere, setNotify] = useState<boolean>()
  const notify = notifyHere ?? c?.watching ?? false
  // 내 모임이 왕이면 '지키기': 오른쪽은 뒤쫓는 2위 모임
  const defending = !!c && c.toOvertake === 0 && c.king.groupId === c.mine.groupId
  const other = defending ? c.rival : c?.mine
  const total = c ? c.king.visits + (other?.visits ?? 0) : 0
  const kingShare = c && total > 0 ? (c.king.visits / total) * 100 : 50

  const toggleNotify = () => {
    const next = !notify
    setNotify(next)
    toast(next ? '왕좌가 바뀌면 알려드릴게요' : '알림을 껐어요')
    socialApi.watchThrone(id, next).catch(() => { setNotify(!next); toast('알림을 바꾸지 못했어요') })
  }

  return (
    <Screen title={c ? `${c.place.name} ${defending ? '왕좌 지키기' : '왕좌 도전'}` : '왕좌 도전'}>
      <div className="flex flex-col px-6" style={{ minHeight: 'calc(100dvh - var(--sat))' }}>
        <TopBar title={defending ? '왕좌 지키기' : '왕좌 도전'} fallback={`/place/${id}`} />

        {status !== 'ok' && <div className="-mx-6"><StateView status={status} what="장소" /></div>}
        {c && <>
          {/* 장소 사진 카드 */}
          <div className="relative mt-[16px] h-[150px] overflow-hidden rounded-[26px] bg-gradient-to-b from-[#6e6e6e] to-[#1e1e1e]"
            style={c.place.photoUrl ? { background: `center/cover url("${c.place.photoUrl}")` } : undefined}>
            {!c.place.photoUrl && <span aria-hidden className="absolute left-[200px] top-[-60px] size-[180px] rounded-full bg-white/10" />}
            <span className="absolute left-[16px] top-[16px] rounded-full border border-white/25 px-[10px] py-[4px] text-[11px] font-medium leading-[1.35] text-white">{c.place.category} · {c.place.district}</span>
            <h2 className="absolute left-[16px] right-[16px] top-[92px] truncate text-[26px] font-black leading-[1.35] text-white">{c.place.name}</h2>
          </div>

          {/* 현재 왕 VS 내 모임 */}
          <section aria-label="방문 횟수 비교" className="relative mt-[16px] h-[176px] rounded-[26px] bg-night-1">
            <div className="absolute left-0 top-0 flex w-[124px] flex-col items-center">
              <Crown width={26} className="mt-[12px]" />
              <span className="mt-[4px]"><RoundPhoto src={c.king.photoUrl} size={64} ring={3} tone="dark" /></span>
              <p className="mt-[8px] w-full truncate px-[4px] text-center text-[13px] font-bold leading-[1.35]"><span className="sr-only">현재 왕 </span>{c.king.name}</p>
              <p className="mt-[2.45px] text-[18px] font-black leading-[1.35] text-lime">{c.king.visits}회</p>
            </div>
            <p aria-hidden className="absolute left-1/2 top-[52px] -translate-x-1/2 text-[28px] font-black leading-[1.35] text-lime">VS</p>
            {other && <div className="absolute right-0 top-0 flex w-[124px] flex-col items-center">
              <span className="relative mt-[32px]">
                <RoundPhoto src={other.photoUrl} size={64} ring={3} ringColor="#fff" tone="mid" />
                <span className="absolute left-[8px] top-[-10px] whitespace-nowrap rounded-full bg-lime px-[7px] py-[2px] text-[10px] font-bold leading-[1.35] text-ink">{defending ? '추격 중' : '내 모임'}</span>
              </span>
              <p className="mt-[8px] w-full truncate px-[2px] text-center text-[13px] font-bold leading-[1.35]">{other.name}</p>
              <p className="mt-[2.45px] text-[18px] font-black leading-[1.35] text-white">{other.visits}회</p>
            </div>}
            <div className="absolute left-[20px] right-[20px] top-[160px] h-[8px] overflow-hidden rounded-[4px] bg-white/25"
              role="img" aria-label={`${c.king.name} ${c.king.visits}회, ${other?.name ?? ''} ${other?.visits ?? 0}회`}>
              <span className="block h-full rounded-[4px] bg-lime" style={{ width: `${kingShare}%` }} />
            </div>
          </section>

          {c.toOvertake > 0 ? <>
            <p className="mt-[24px] text-[14px] font-medium leading-[1.35] text-night-muted">역전까지</p>
            <p className="mt-[1.1px] text-[42px] font-black leading-[1.15] text-lime">{c.toOvertake}회 방문</p>
          </> : <>
            <p className="mt-[24px] text-[14px] font-medium leading-[1.35] text-night-muted">지금은 우리가 왕{c.rival ? ` · ${c.rival.name}보다` : ''}</p>
            <p className="mt-[1.1px] text-[42px] font-black leading-[1.15] text-lime">{c.rival ? `${c.king.visits - c.rival.visits}회 앞서요` : '우리가 왕'}</p>
          </>}

          <ul className="mt-[27.7px] flex flex-col gap-[12px]">
            {c.rules.map((r) => (
              <li key={r.text} className="flex items-start gap-[10px]">
                <span aria-hidden className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-night-line text-[11px] font-black leading-none text-lime">{r.badge}</span>
                <span className="mt-[4px] text-[13px] font-medium leading-[1.35]">{r.text}</span>
              </li>
            ))}
          </ul>

          {/* 아래 버튼 */}
          <div className="sticky bottom-0 -mx-6 mt-auto flex gap-[12px] bg-gradient-to-t from-night from-70% to-transparent px-6 pt-[24px]"
            style={{ paddingBottom: 'max(18px, calc(var(--sab) - 8px))' }}>
            {/* 글자가 상태를 말해줘요 (알림 받기 ↔ 알림 켜짐) → aria-pressed 는 두지 않아요 */}
            <button type="button" onClick={toggleNotify}
              className={`h-[54px] w-[120px] shrink-0 rounded-full border text-[14px] font-bold leading-[1.35] ${notify ? 'border-lime text-lime' : 'border-white/30 text-white'}`}>
              {notify ? '알림 켜짐' : '알림 받기'}
            </button>
            <Link to={`/new?place=${c.place.id}`} className="flex h-[54px] min-w-0 flex-1 items-center justify-center rounded-full bg-lime text-[15px] font-bold leading-[1.35] text-ink">여기서 약속 잡기</Link>
          </div>
        </>}
      </div>
    </Screen>
  )
}

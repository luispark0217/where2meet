import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { tugApi, type VoteOption } from '../../api/tug'
import { useApi } from '../../api/useApi'
import { Avatar } from '../../components/Avatar'
import { IconButton } from '../../components/IconButton'
import { Screen } from '../../components/Screen'
import { StateView } from '../../components/StateView'
import { soon, toast } from '../../components/toast'
import { KingTag } from '../../components/KingTag'
import { Thumb } from '../../components/Photo'
import { useBack } from '../../components/useBack'
import { ro } from '../../lib/josa'


/** P · 장소 투표 (피그마 35:61) */
export default function PlaceVote() {
  const { id } = useParams() as { id: string }
  const back = useBack(`/meet/${id}`)
  const nav = useNavigate()
  const { data: info, status } = useApi(() => tugApi.vote(id), [id])
  const [picked, setPicked] = useState<string | undefined>()
  const choice = picked ?? info?.myChoice

  /** 내 표를 고른 곳으로 옮긴 투표 현황 */
  const options: VoteOption[] = useMemo(() => {
    if (!info) return []
    return info.options.map((o) => {
      const others = o.voters.filter((v) => v.id !== info.me.id)
      return { ...o, voters: o.place.id === choice ? [info.me, ...others] : others }
    })
  }, [info, choice])
  const voted = new Set(options.flatMap((o) => o.voters.map((v) => v.id))).size
  const maxVotes = Math.max(voted, 1)
  const top = options.reduce<VoteOption | undefined>((a, o) => (!a || o.voters.length > a.voters.length ? o : a), undefined)

  const confirmed = info?.confirmedPlaceId
  const vote = (placeId: string) => {
    if (confirmed) return toast('이미 장소가 확정됐어요')
    const prev = choice
    setPicked(placeId)
    tugApi.castVote(id, placeId).catch(() => { setPicked(prev); toast('투표하지 못했어요. 다시 시도해주세요') })
  }
  // 라디오 묶음: Tab 으로는 한 번만 들어오고(고른 카드, 없으면 첫 카드), 화살표로 옮기며 고르기
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])
  const onRadioKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
    if (!d || options.length === 0) return
    e.preventDefault()
    const n = (i + d + options.length) % options.length
    cardRefs.current[n]?.focus()
    vote(options[n].place.id)
  }
  const tabStop = Math.max(0, options.findIndex((o) => o.place.id === choice))
  const [busy, setBusy] = useState(false)
  const confirm = async () => {
    // 이미 확정된 약속이면 공유로
    if (confirmed) return nav(`/meet/${id}/share`, { replace: true })
    if (!top || top.voters.length === 0) return toast('아직 표를 받은 장소가 없어요')
    if (busy) return
    setBusy(true)
    try {
      await tugApi.confirm(id, top.place.id)
      toast(`${top.place.name}${ro(top.place.name)} 확정했어요`)
      // 투표 화면은 기록에서 빼요 → 공유 시트를 닫으면 약속 상세로 돌아가요
      nav(`/meet/${id}/share`, { replace: true })
    } catch {
      toast('확정하지 못했어요. 다시 시도해주세요')
      setBusy(false)
    }
  }

  return (
    <Screen title="장소 투표">
      <div className="px-[24px]" style={{ paddingBottom: 'calc(110px + var(--sab))' }}>
        <header className="relative mt-[8px] flex h-[40px] items-start">
          <IconButton label="뒤로" onClick={back}>←</IconButton>
          <div className="absolute left-1/2 top-[2px] -translate-x-1/2 text-center">
            <h1 className="whitespace-nowrap text-[17px] font-bold leading-[1.35]">장소 투표</h1>
            {info && <p className="mt-[1px] whitespace-nowrap text-[11px] font-medium leading-[1.35] text-night-muted">{info.memberCount}명 중 {voted}명 투표 · {info.deadlineLabel}</p>}
          </div>
        </header>

        {status !== 'ok' && <div className="-mx-6"><StateView status={status} what="투표" notFound="이 약속은 지금 장소 투표 중이 아니에요." back={{ to: `/meet/${id}`, label: '약속으로 돌아가기' }} /></div>}
        {info && (
          <>
            <h2 id="vote-h" className="mt-[20px] text-[28px] font-black leading-[1.35]">어디로 갈까?</h2>
            <p className="mt-[2.2px] text-[13px] font-medium leading-[1.35] text-night-muted">가장 많이 받은 곳으로 확정돼요</p>

            <div role="radiogroup" aria-labelledby="vote-h" className="mt-[26.45px] flex flex-col gap-[12px]">
              {options.map((o, i) => {
                const on = o.place.id === choice
                const n = o.voters.length
                return (
                  <button key={o.place.id} ref={(el) => { cardRefs.current[i] = el }} type="button" role="radio" aria-checked={on} onClick={() => vote(o.place.id)}
                    tabIndex={i === tabStop ? 0 : -1} onKeyDown={(e) => onRadioKey(e, i)}
                    aria-label={`${o.place.name}, ${o.place.category} 도보 ${o.place.walkMin}분 취향 ${o.place.match}%, ${n}표`}
                    className={`relative block h-[138px] w-full rounded-[24px] border-2 text-left transition-colors ${on ? 'border-lime bg-night-2' : 'border-transparent bg-night-1'}`}>
                    <span className="absolute left-[14px] top-[14px]"><Thumb src={o.place.photoUrl} size={76} radius={18} tone={o.place.tone} circle /></span>
                    <span className="absolute left-[104px] right-[52px] top-[16px] block truncate text-[16px] font-bold leading-[1.35] text-white">{o.place.name}</span>
                    <span className="absolute left-[104px] right-[52px] top-[40px] block truncate text-[11px] font-medium leading-[1.35] text-night-muted">
                      {o.place.category} · 도보 {o.place.walkMin}분 · 취향 {o.place.match}%
                    </span>
                    {o.place.kingGroupName && <span className="absolute left-[104px] right-[52px] top-[62px] flex"><KingTag name={o.place.kingGroupName} tone="line" size={10} /></span>}

                    {/* 라디오 동그라미 */}
                    <span className={`absolute right-[14px] top-[14px] flex size-[26px] items-center justify-center rounded-full ${on ? 'bg-lime' : 'border-[1.5px] border-white/30'}`} aria-hidden>
                      {on && <span className="block size-[9px] rounded-full bg-ink" />}
                    </span>

                    {/* 투표한 사람 (오른쪽부터 겹쳐 쌓기) */}
                    {/* 좁은 폰(카드가 좁아 왕 알약과 겹칠 때)에서는 7px 아래로 */}
                    <span className="absolute right-[68px] top-[76px] flex flex-row-reverse max-[379px]:top-[83px]" aria-hidden>
                      {o.voters.map((v, i) => (
                        <Avatar key={v.id} member={v} size={22} ring={2} fontSize={9} ringColor={on ? 'var(--color-night-2)' : 'var(--color-night-1)'}
                          style={{ marginRight: i === 0 ? 0 : -8 }} />
                      ))}
                    </span>

                    <span className="absolute left-[14px] right-[74px] top-[106px] h-[8px] overflow-hidden rounded-[4px] bg-night-line" aria-hidden>
                      <span className="block h-full rounded-[4px] bg-lime transition-[width] duration-300" style={{ width: `${(n / maxVotes) * 100}%` }} />
                    </span>
                    <span className={`absolute right-[14px] top-[100px] text-[13px] font-bold leading-[1.35] ${n > 0 ? 'text-lime' : 'text-night-muted'}`} aria-hidden>{n}표</span>
                  </button>
                )
              })}
            </div>

            <Link to={`/meet/${id}/places`} className="mx-auto mt-[8.8px] flex h-[40px] w-fit items-center px-[12px] text-[13px] font-bold leading-[1.35] text-night-muted">
              + 다른 장소 추가하기
            </Link>
          </>
        )}
      </div>

      {info && (
        <div className="fixed inset-x-0 z-20 mx-auto grid max-w-[430px] grid-cols-[130fr_200fr] gap-[12px] px-[24px]" style={{ bottom: 'max(calc(var(--sab) - 10px), 16px)' }}>
          <button type="button" onClick={soon} className="flex h-[56px] items-center justify-center whitespace-nowrap rounded-full border border-white/30 bg-night text-[14px] font-bold leading-[1.35] text-white">투표 현황 공유</button>
          <button type="button" onClick={() => void confirm()} disabled={busy} aria-busy={busy} className="flex h-[56px] items-center justify-center whitespace-nowrap rounded-full bg-lime text-[15px] font-bold leading-[1.35] text-ink">{confirmed ? '확정됨 · 공유하기' : '이 장소로 확정'}</button>
        </div>
      )}
    </Screen>
  )
}

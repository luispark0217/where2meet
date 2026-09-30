import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../api/useApi'
import { AvatarStack } from '../components/Avatar'
import { Chip, ChipRow } from '../components/Chip'
import { Crown } from '../components/Crown'
import { IconButton } from '../components/IconButton'
import { Photo } from '../components/Photo'
import { Screen } from '../components/Screen'
import { StateView } from '../components/StateView'
import { soon } from '../components/toast'
import { useBack } from '../components/useBack'
import type { Meeting } from '../data/types'
import { at } from '../components/figma'

/** 피그마 y좌표(상태바 포함) → 화면 위치 */

const BUCKETS = [
  { key: 'active', label: '진행 중' },
  { key: 'upcoming', label: '예정' },
  { key: 'past', label: '지난' },
] as const

/** B · 모임 상세 — 약속 갤러리 (피그마 1:118) */
export default function GroupDetail() {
  const { id } = useParams() as { id: string }
  const back = useBack()
  const { data: g, status } = useApi(() => api.group(id), [id])
  const { data: meetings } = useApi(() => api.groupMeetings(id), [id])
  const [bucket, setBucket] = useState<Meeting['bucket']>('active')
  const list = (meetings ?? []).filter((m) => m.bucket === bucket)

  return (
    <Screen padTop={false} title={g?.name}>
      {/* 상단 사진 영역 (상태바 뒤까지 꽉 차게) */}
      <div className="relative" style={{ height: at(372) }}>
        <div className="absolute inset-x-0 top-0" style={{ height: at(320) }}>
          <Photo src={g?.photoUrl} tone="light" radius={0} className="size-full" alt={g?.name} />
        </div>
        <div className="absolute inset-x-0 h-[180px] bg-gradient-to-b from-night/0 to-night" style={{ top: at(140) }} />

        <div className="absolute left-6 right-6 flex justify-between" style={{ top: at(52) }}>
          <IconButton label="뒤로" variant="white" onClick={back} className="shadow-soft">←</IconButton>
          <IconButton label="더보기" variant="white" onClick={soon} className="shadow-soft">⋯</IconButton>
        </div>

        {g && (
          <>
            <span className="absolute left-6 rounded-full bg-lime px-[10px] py-[4px] text-[11px] font-bold leading-[1.35] text-ink" style={{ top: at(184) }}>{g.category}</span>
            <h1 className="absolute left-6 right-6 truncate text-[30px] font-black leading-[1.35]" style={{ top: at(210) }}>{g.name}</h1>
            <div className="absolute left-6 flex items-center gap-[6px]" style={{ top: at(258) }}>
              <AvatarStack members={g.members} size={26} step={18} ringColor="var(--color-night)" />
              <span className="text-[12px] font-medium leading-[1.35] text-night-muted">{g.memberCount}명 · {g.since}년부터</span>
            </div>
            {/* 통계 박스 */}
            <dl className="absolute left-6 right-6 grid h-[68px] grid-cols-3 rounded-[20px] bg-night-1" style={{ top: at(304) }}>
              {[
                { v: `${g.meetingCount}회`, l: '약속', lime: false },
                { v: `${g.kingCount}곳`, l: '왕 자리', lime: true },
                { v: `${g.avgLateMin}분`, l: '평균 지각', lime: false },
              ].map((s, i) => (
                <div key={s.l} className="relative flex flex-col items-center pt-[10px]">
                  {i > 0 && <span className="absolute left-0 top-[16px] h-[36px] w-px bg-night-line" />}
                  <dd className={`text-[17px] font-bold leading-[1.35] ${s.lime ? 'text-lime' : 'text-white'}`}>{s.v}</dd>
                  <dt className="mt-[3px] text-[11px] font-medium leading-[1.35] text-night-muted">{s.l}</dt>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>

      {status !== 'ok' && status !== 'loading' && <StateView status={status} what="모임" />}
      {g && <div className="px-6 pb-10">
        <div className="mt-[18px] flex h-[36px] items-center justify-between">
          <h2 className="text-[20px] font-black leading-[1.35]">약속</h2>
          <Link to={`/new?group=${id}`} className="flex h-[36px] w-[104px] items-center justify-center rounded-full bg-lime text-[13px] font-bold leading-[1.35] text-ink">+ 새 약속</Link>
        </div>
        <ChipRow className="mt-[10px] h-[30px]">
          {BUCKETS.map((b) => <Chip key={b.key} size="sm" on={bucket === b.key} onClick={() => setBucket(b.key)}>{b.label}</Chip>)}
        </ChipRow>
        <div className="mt-[10px] grid grid-cols-2 gap-x-[12px] gap-y-[10px]">
          {list.map((m) => <MeetingCard key={m.id} m={m} />)}
        </div>
        {meetings && list.length === 0 && (
          <p className="mt-2 rounded-[22px] bg-night-1 px-5 py-6 text-[14px] leading-[1.5] text-night-muted">아직 {BUCKETS.find((b) => b.key === bucket)?.label} 약속이 없어요</p>
        )}
      </div>}
    </Screen>
  )
}

const STAGE_LOOK: Record<Meeting['stage'], { label: string; bg: string; dark: boolean }> = {
  tug: { label: '장소 줄다리기 중', bg: 'var(--color-lime)', dark: false },
  place: { label: '장소 정하는 중', bg: 'var(--color-lime)', dark: false },
  time: { label: '시간 정하는 중', bg: 'var(--color-cream)', dark: false },
  confirmed: { label: '장소 확정', bg: 'var(--color-night-2)', dark: true },
  done: { label: '완료', bg: 'var(--color-night-2)', dark: true },
}

/** 약속 카드 165×134 */
function MeetingCard({ m }: { m: Meeting }) {
  const look = STAGE_LOOK[m.stage]
  return (
    <Link to={`/meet/${m.id}`} className={`relative block h-[134px] overflow-hidden rounded-[22px] ${look.dark ? 'text-white' : 'text-ink'}`} style={{ background: look.bg }}>
      <span className={`absolute left-[12px] top-[12px] rounded-full px-[9px] py-[4px] text-[10px] font-bold leading-[1.35] ${look.dark ? 'bg-lime text-ink' : 'bg-ink text-lime'}`}>{look.label}</span>
      <div className="absolute left-[12px] right-[12px] top-[44px] h-[44px]">
        {(m.stage === 'tug' || m.stage === 'place') && <MiniMap />}
        {m.stage === 'time' && <MiniHeat />}
        {m.stage === 'confirmed' && <Photo src={m.placePhotoUrl} className="size-full" radius={12} />}
        {m.stage === 'done' && (
          <div className="flex h-full items-center">
            <AvatarStack members={m.participants} ringColor="var(--color-night-2)" />
            <Crown width={20} className="ml-[4px]" />
            <span className="ml-[6px] text-[11px] font-bold leading-[1.35] text-lime">1등 {m.winnerName}</span>
          </div>
        )}
      </div>
      <p className="absolute left-[12px] right-[12px] top-[94px] truncate text-[15px] font-bold leading-[1.35]">{m.title}</p>
      <p className={`absolute left-[12px] right-[12px] top-[114px] truncate text-[11px] font-medium leading-[1.35] ${look.dark ? 'text-white/60' : 'text-ink/60'}`}>{m.subText}</p>
    </Link>
  )
}

/** 카드 속 작은 지도 (줄다리기 중) */
function MiniMap() {
  return (
    <svg viewBox="0 0 141 44" preserveAspectRatio="xMidYMid slice" className="size-full overflow-hidden rounded-[12px]" aria-hidden>
      <rect width="141" height="44" fill="#fff" />
      <g fill="#eef1ea">
        <rect x="0" y="0" width="38" height="12" /><rect x="44" y="0" width="52" height="12" /><rect x="102" y="0" width="39" height="12" />
        <rect x="0" y="18" width="38" height="10" /><rect x="102" y="18" width="39" height="10" />
        <rect x="0" y="34" width="38" height="10" /><rect x="44" y="34" width="52" height="10" /><rect x="102" y="34" width="39" height="10" />
      </g>
      <circle cx="70" cy="22" r="13" fill="var(--color-lime)" opacity=".55" />
      <circle cx="70" cy="22" r="5" fill="var(--color-ink)" />
      <circle cx="21" cy="13" r="5" fill="var(--color-av-yellow)" stroke="var(--color-ink)" strokeWidth="1" />
      <circle cx="25" cy="35" r="5" fill="var(--color-av-pink)" stroke="var(--color-ink)" strokeWidth="1" />
      <circle cx="129" cy="15" r="5" fill="var(--color-av-blue)" stroke="var(--color-ink)" strokeWidth="1" />
      <circle cx="123" cy="33" r="5" fill="var(--color-lime)" stroke="var(--color-ink)" strokeWidth="1" />
    </svg>
  )
}

/** 카드 속 작은 시간표 (시간 정하는 중) — 진할수록 가능한 사람이 많음 */
const HEAT = [[0.08, 0.69, 0.28], [0.49, 0.08, 0.69], [0.9, 0.49, 0.08], [0.28, 0.9, 0.49], [0.69, 0.28, 0.9], [0.08, 0.69, 0.28], [0.49, 0.08, 0.69]]
function MiniHeat() {
  return (
    <div className="grid max-w-[137px] grid-cols-7 gap-[3px]" aria-hidden>
      {HEAT.map((col, c) => (
        <div key={c} className="flex flex-col gap-[4px]">
          {col.map((a, r) => <span key={r} className="block h-[12px] rounded-[3px]" style={{ background: `rgba(17,20,18,${a})` }} />)}
        </div>
      ))}
    </div>
  )
}

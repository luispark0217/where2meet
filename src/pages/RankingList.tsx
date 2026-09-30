import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../api/useApi'
import { Chip, ChipRow } from '../components/Chip'
import { Crown } from '../components/Crown'
import { LiveDot } from '../components/LiveDot'
import { RoundPhoto } from '../components/Photo'
import { Screen } from '../components/Screen'
import { TabBar, TabBarSpacer } from '../components/TabBar'
import type { RankingEntry } from '../data/types'

const TABS = [
  { key: 'group', label: '모임 랭킹' },
  { key: 'category', label: '카테고리별' },
  { key: 'local', label: '우리 동네' },
] as const

/** G · 랭킹 대시보드 (리스트) (피그마 3:79) */
export default function RankingList() {
  const [type, setType] = useState<(typeof TABS)[number]['key']>('group')
  const { data: list } = useApi(() => api.ranking(type), [type])
  const { data: my } = useApi(api.myRank)
  const podium = list?.slice(0, 3) ?? []
  const rest = list?.slice(3) ?? []

  return (
    <Screen title="서울 왕좌 랭킹">
      <div className="px-6">
        <div className="relative mt-[20px]">
          <h1 className="text-[34px] font-black leading-[1.15] tracking-[-0.01em]">서울 왕좌<span className="mt-[2.9px] block text-lime">랭킹</span></h1>
          <span className="absolute right-0 top-[8px] flex items-center gap-[6px] rounded-full bg-night-2 px-[12px] py-[6px] text-[12px] font-bold leading-[1.35]"><LiveDot />실시간</span>
          <Link to="/ranking" className="absolute right-0 top-[50px] flex h-[38px] w-[110px] items-center justify-center rounded-full border border-white/30 text-[13px] font-bold leading-[1.35]">지도로 보기</Link>
        </div>

        <ChipRow className="mt-[4.9px] h-[36px]">
          {TABS.map((t) => <Chip key={t.key} on={type === t.key} onClick={() => setType(t.key)}>{t.label}</Chip>)}
        </ChipRow>

        {/* 시상대: 2위 · 1위 · 3위 */}
        <div className="mt-[10px] grid h-[254px] grid-cols-3 items-end gap-[12px]">
          {[podium[1], podium[0], podium[2]].map((e, i) => e && <Podium key={e.group.id} e={e} first={i === 1} height={[120, 150, 100][i]} />)}
        </div>

        <ol className="mt-[16px] space-y-[6px]">
          {rest.map((e) => <Row key={e.group.id} e={e} />)}
        </ol>
      </div>

      {my && (
        <Link to={`/group/${my.groupId}`} className="sticky z-20 mx-6 mt-[14px] flex h-[56px] items-center rounded-[20px] bg-lime pl-[16px] pr-[12px] text-ink" style={{ bottom: 'calc(64px + var(--sab))' }}>
          <Crown width={24} fill="var(--color-ink)" />
          <span className="ml-[12px] min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold leading-[1.35]">내 모임 · {my.groupName}</span>
            <span className="mt-[2.45px] block truncate text-[12px] font-medium leading-[1.35] text-ink/70">{my.rank}위 · 1위까지 왕 자리 {my.kingsToFirst}곳 남았어요</span>
          </span>
          <span className="text-[16px] font-bold leading-[1.35]" aria-hidden>→</span>
        </Link>
      )}
      <div className="h-[14px]" />
      <TabBarSpacer />
      <TabBar active="ranking" />
    </Screen>
  )
}

function Podium({ e, first, height }: { e: RankingEntry; first: boolean; height: number }) {
  return (
    <div className="flex min-w-0 flex-col items-center">
      {first && <Crown width={30} className="mb-[1.5px]" />}
      <RoundPhoto size={first ? 64 : 56} ring={first ? 3 : 2} ringColor={first ? 'var(--color-lime)' : '#fff'} tone={first ? 'dark' : e.rank === 2 ? 'mid' : 'light'} />
      <p className={`w-full truncate text-center text-[12px] font-bold leading-[1.35] ${first ? 'mt-[4px]' : 'mt-[10px]'}`}>{e.group.name}</p>
      <div className={`flex w-full flex-col items-center rounded-t-[20px] pt-[10px] ${first ? 'bg-lime text-ink' : 'bg-night-2 text-white'}`} style={{ height, marginTop: first ? 0 : 13.8 }}>
        <span className="text-[32px] font-black leading-[1.1]">{e.rank}</span>
        <span className={`mt-[10.8px] text-[12px] font-bold leading-[1.35] ${first ? 'text-ink' : 'text-lime'}`}>왕 {e.kingCount}곳</span>
      </div>
    </div>
  )
}

function Row({ e }: { e: RankingEntry }) {
  const d = e.delta
  return (
    <li className="flex h-[48px] items-center rounded-[16px] bg-night-1 pl-[16px] pr-[16px]">
      <span className="w-[14px] text-[15px] font-black leading-[1.35] text-night-muted">{e.rank}</span>
      <span className="ml-[10px]"><RoundPhoto size={32} ring={1.5} ringColor="#fff" tone={e.rank % 2 ? 'mid' : 'light'} /></span>
      <span className="ml-[12px] min-w-0 flex-1 self-start pt-[5px]">
        <span className="block truncate text-[14px] font-bold leading-[1.35]">{e.group.name}</span>
        <span className="mt-[1.1px] block truncate text-[11px] font-medium leading-[1.35] text-night-muted">왕 {e.kingCount}곳 · 방문 {e.visits}회</span>
      </span>
      <span className={`w-[40px] shrink-0 text-right text-[13px] font-bold leading-[1.35] ${d > 0 ? 'text-lime' : d < 0 ? 'text-live' : 'text-night-muted'}`}
        aria-label={d > 0 ? `${d}계단 상승` : d < 0 ? `${-d}계단 하락` : '변동 없음'}>
        {d > 0 ? `▲${d}` : d < 0 ? `▼${-d}` : '—'}
      </span>
    </li>
  )
}

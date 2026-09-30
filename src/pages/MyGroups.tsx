import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../api/useApi'
import { Avatar, AvatarStack } from '../components/Avatar'
import { Chip, ChipRow } from '../components/Chip'
import { Crown } from '../components/Crown'
import { IconButton } from '../components/IconButton'
import { Photo } from '../components/Photo'
import { Screen } from '../components/Screen'
import { soon } from '../components/toast'
import { TabBar, TabBarSpacer } from '../components/TabBar'
import type { Group, GroupCategory } from '../data/types'

const FILTERS: ('전체' | GroupCategory)[] = ['전체', '친구', '동아리', '회사', '가족']

/** A · 메인 — 내 모임 (피그마 1:13) */
export default function MyGroups() {
  const { data: me } = useApi(api.me)
  const { data: groups } = useApi(api.myGroups)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('전체')
  const list = (groups ?? []).filter((g) => filter === '전체' || g.category === filter)

  return (
    <Screen title="내 모임">
      <div className="px-6">
        {/* 상단: 내 아바타 / 메뉴 */}
        <div className="flex items-start justify-between pr-[4px] pt-[12px]">
          {me && <Avatar member={me} size={42} ring={3} ringColor="var(--color-lime)" fontSize={17} />}
          <IconButton label="메뉴" variant="glass" onClick={soon}>●</IconButton>
        </div>

        <p className="mt-[14px] text-[15px] font-medium leading-[1.35] text-night-muted">안녕 {me?.name ?? ''},</p>
        <h1 className="mt-[3.75px] text-[36px] font-black leading-[1.15] tracking-[-0.01em]">
          내 모임
          <span className="mt-[0.6px] block text-lime">{groups ? `${groups.length}개가 기다려요` : ' '}</span>
        </h1>

        <ChipRow className="-mx-6 mt-[20.6px] h-[36px] px-6">
          {FILTERS.map((f) => <Chip key={f} on={filter === f} onClick={() => setFilter(f)}>{f}</Chip>)}
        </ChipRow>

        <div className="mt-[16px] grid grid-cols-2 gap-[12px]">
          {list.map((g, i) => <GroupCard key={g.id} group={g} meId={me?.id} lime={(Math.floor(i / 2) + i) % 2 === 0} />)}
        </div>
        {groups && list.length === 0 && (
          <p className="mt-6 rounded-[20px] bg-night-1 px-5 py-6 text-[14px] leading-[1.5] text-night-muted">{filter} 모임이 아직 없어요.</p>
        )}
      </div>
      <div className="h-[16px]" />
      <TabBarSpacer />
      <TabBar active="home" />
    </Screen>
  )
}

/** 모임 카드 165×220 (폭은 화면에 맞게 늘어남) */
function GroupCard({ group: g, lime, meId }: { group: Group; lime: boolean; meId?: string }) {
  const bg = lime ? 'var(--color-lime)' : 'var(--color-cream)'
  // 카드에는 나를 뺀 친구 3명까지 보여주고 나머지는 +N
  const friends = g.members.filter((m) => m.id !== meId).slice(0, 3)
  const extra = g.memberCount - friends.length
  return (
    <Link to={`/group/${g.id}`} className="relative block h-[220px] overflow-hidden rounded-[26px] text-ink" style={{ background: bg }}>
      <Photo src={g.photoUrl} className="absolute left-[6px] right-[6px] top-[6px] h-[110px]" radius={20} />
      {g.kingCount > 0 && (
        <span className="absolute left-[14px] top-[14px] flex items-center gap-[4px] rounded-full bg-ink py-[4px] pl-[7px] pr-[9px]">
          <Crown width={14} />
          <span className="text-[11px] font-bold leading-[1.35] text-lime">왕 {g.kingCount}곳</span>
        </span>
      )}
      <p className="absolute left-[14px] right-[14px] top-[126px] truncate text-[15px] font-bold leading-[1.35]">{g.name}</p>
      <p className="absolute left-[14px] right-[14px] top-[148px] truncate text-[11px] font-medium leading-[1.35] text-ink/60">{g.statusText}</p>
      <span className="absolute left-[14px] top-[182px] flex items-center">
        <AvatarStack members={friends} ringColor={bg} />
        {extra > 0 && <span className="relative z-10 ml-[2px] text-[11px] font-bold leading-[1.35]">+{extra}</span>}
      </span>
      <span className="absolute right-[12px] top-[176px] flex size-[36px] items-center justify-center rounded-full bg-ink text-[15px] font-bold leading-none text-white" aria-hidden>↗</span>
    </Link>
  )
}

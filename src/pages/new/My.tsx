import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { meApi } from '../../api/me'
import { useApi } from '../../api/useApi'
import { Avatar } from '../../components/Avatar'
import { Chip, ChipRow } from '../../components/Chip'
import { KingTag } from '../../components/KingTag'
import { RoundPhoto } from '../../components/Photo'
import { Screen } from '../../components/Screen'
import { StateView } from '../../components/StateView'
import { TabBar, TabBarSpacer } from '../../components/TabBar'
import { toast } from '../../components/toast'
import type { Group } from '../../data/types'
import { ro } from '../../lib/josa'

/** I · 마이 (피그마 30:80) */
export default function My() {
  const { data: p, status } = useApi(meApi.profile)
  const { data: groups } = useApi(api.myGroups)
  // 대표 칭호 (서버 값 위에 이 화면에서 고른 값)
  const [picked, setPicked] = useState<string | null>(null)
  const main = picked ?? p?.mainTitle
  const pickTitle = (t: string) => {
    if (t === main) return
    const prev = picked
    setPicked(t)
    toast(`대표 칭호를 '${t}'${ro(t)} 바꿨어요`)
    meApi.setMainTitle(t).catch(() => { setPicked(prev); toast('칭호를 바꾸지 못했어요') })
  }

  return (
    <Screen title="마이">
      <div className="px-6">
        {/* 상단: 제목 / 설정 */}
        <div className="flex h-[52px] items-start justify-between pt-[12px]">
          <h1 className="mt-[6px] text-[20px] font-black leading-[1.35]">마이</h1>
          <Link to="/settings" aria-label="설정" className="flex size-[40px] shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/8 text-[17px] font-bold leading-none text-white">≡</Link>
        </div>

        <StateView status={status} what="내 정보" />
        {p && (
          <>
            {/* 프로필 */}
            <div className="mt-[8px] flex items-start">
              <Avatar member={p.member} size={72} ring={5.143} ringColor="var(--color-lime)" fontSize={29} />
              <div className="ml-[14px] min-w-0 pt-[6px]">
                <p className="truncate text-[24px] font-black leading-[1.35]">{p.member.name}</p>
                <p className="mt-[3.6px] truncate text-[12px] font-medium leading-[1.35] text-night-muted">@{p.handle} · 모임 {p.groupCount}개 · {p.joinedYear}년 가입</p>
              </div>
            </div>

            {/* 기록 3칸 */}
            <dl className="mt-[20px] grid h-[72px] grid-cols-3 rounded-[20px] bg-night-1">
              <Stat value={`${p.stats.meetings}회`} label="약속 참여" />
              <Stat value={`${p.stats.avgLateMin}분`} label="평균 지각" line />
              <Stat value={`${p.stats.raceWins}회`} label="레이스 1등" line lime />
            </dl>

            {/* 내 칭호: 누르면 대표 칭호로 */}
            <h2 className="mt-[22px] text-[15px] font-bold leading-[1.35]">내 칭호</h2>
            <ChipRow gap={6} className="-mx-6 mt-[7.75px] px-6">
              {p.titles.map((t) => (
                <Chip key={t} size="sm" on={main === t} onClick={() => pickTitle(t)}>{t}</Chip>
              ))}
            </ChipRow>
          </>
        )}

        {groups && (
          <>
            <h2 className="mt-[23.8px] text-[15px] font-bold leading-[1.35]">내 모임</h2>
            <ul className="mt-[9.75px] space-y-[8px]">
              {groups.map((g, i) => <GroupRow key={g.id} g={g} tone={(['light', 'dark', 'light', 'mid'] as const)[i % 4]} />)}
            </ul>
          </>
        )}

        {p && (
          <Link to={`/ranking/area/${p.topPlace.areaId}`} className="mt-[14px] flex h-[62px] w-full items-center rounded-[20px] bg-lime pl-[18px] pr-[34px] text-left text-ink">
            <span className="min-w-0 flex-1 self-start">
              <span className="mt-[11px] block text-[11px] font-bold leading-[1.35] text-ink/60">가장 많이 간 곳</span>
              <span className="mt-[2.15px] block truncate text-[17px] font-black leading-[1.35]">{p.topPlace.name} · {p.topPlace.visits}회</span>
            </span>
            <span className="ml-3 shrink-0 text-[12px] font-bold leading-[1.35]">기록 보기 →</span>
          </Link>
        )}
      </div>
      <div className="h-[16px]" />
      <TabBarSpacer />
      <TabBar active="my" />
    </Screen>
  )
}

function Stat({ value, label, line = false, lime = false }: { value: string; label: string; line?: boolean; lime?: boolean }) {
  return (
    <div className="relative flex flex-col items-center">
      {line && <span aria-hidden className="absolute left-0 top-[18px] h-[36px] w-px bg-night-line" />}
      <dt className="order-last mt-[3.7px] text-[11px] font-medium leading-[1.35] text-night-muted">{label}</dt>
      <dd className={`mt-[12px] text-[18px] font-black leading-[1.35] ${lime ? 'text-lime' : 'text-white'}`}>{value}</dd>
    </div>
  )
}

/** 내 모임 한 줄 50px → 모임 상세로 */
function GroupRow({ g, tone }: { g: Group; tone: 'light' | 'mid' | 'dark' }) {
  return (
    <li>
      <Link to={`/group/${g.id}`} className="flex h-[50px] items-center rounded-[16px] bg-night-1 pl-[10px] pr-[10px]">
        <RoundPhoto size={34} ring={2} ringColor="#fff" tone={tone} />
        <span className="ml-[12px] min-w-0 flex-1 self-start pt-[6px]">
          <span className="block truncate text-[14px] font-bold leading-[1.35] text-white">{g.name}</span>
          <span className="mt-[1.1px] block truncate text-[11px] font-medium leading-[1.35] text-night-muted">{g.myRole ?? '멤버'} · {g.memberCount}명</span>
        </span>
        {g.kingCount > 0 && (
          <KingTag label={`왕 ${g.kingCount}`} tone="line" className="ml-2 shrink-0" />
        )}
        <span aria-hidden className="-mt-[3px] ml-[18px] w-[14px] shrink-0 text-[14px] font-bold leading-[1.35] text-night-muted">→</span>
      </Link>
    </li>
  )
}

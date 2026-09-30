import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../api/useApi'
import { Chip, ChipRow } from '../components/Chip'
import { Crown } from '../components/Crown'
import { LiveDot } from '../components/LiveDot'
import { MapBoard, SeoulArt } from '../components/MapArt'
import { RoundPhoto } from '../components/Photo'
import { Screen } from '../components/Screen'
import { TabBar } from '../components/TabBar'
import { soon } from '../components/toast'
import { PLACE_FILTERS } from '../data/categories'
import type { DistrictCluster } from '../data/types'

const at = (y: number) => `calc(var(--sat) + ${y - 44}px)`
/** 피그마에서 아래 요소의 바닥 y → 화면 아래에서의 거리 (탭바·홈바 포함) */
const fromBottom = (bottomY: number) => `calc(var(--tabpad) + ${844 - 34 - bottomY}px)`

/** D · 서울 왕좌 지도 (전체) (피그마 2:2) */
export default function RankingMap() {
  const { data: clusters } = useApi(api.districtClusters)
  const { data: mine } = useApi(api.myThrones)
  const [cat, setCat] = useState<(typeof PLACE_FILTERS)[number]>('전체')

  return (
    <Screen bg="map" padTop={false} className="h-dvh overflow-hidden" title="서울 왕좌 지도">

      {/* 검색 + 순위 */}
      <div className="absolute left-[20px] right-[20px] z-10 flex gap-[12px]" style={{ top: at(52) }}>
        <label className="flex h-[48px] min-w-0 flex-1 items-center gap-[10px] rounded-full bg-white px-[16px] shadow-float">
          <span className="block size-[12px] shrink-0 rounded-full border-2 border-ink" aria-hidden />
          <input className="min-w-0 flex-1 bg-transparent text-[14px] leading-[1.35] text-ink outline-none placeholder:text-paper-muted" placeholder="장소 · 모임 검색" aria-label="장소나 모임 검색" />
        </label>
        <Link to="/ranking/list" className="flex size-[48px] shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-bold leading-[1.35] text-lime shadow-float">순위</Link>
      </div>

      <ChipRow gap={6} className="absolute left-0 right-0 z-10 px-[20px] pb-[16px]" style={{ top: at(112) }}>
        {PLACE_FILTERS.map((f) => <Chip key={f} theme="light" on={cat === f} onClick={() => setCat(f)}>{f}</Chip>)}
      </ChipRow>

      <span className="absolute left-[20px] z-10 flex items-center gap-[6px] rounded-full bg-ink px-[12px] py-[7px] text-[12px] font-bold leading-[1.35] text-white" style={{ top: at(162) }}>
        <LiveDot /> 실시간 · 방금 3곳 왕 교체
      </span>

      <div className="absolute right-[20px] z-10 flex w-[44px] flex-col items-center gap-[4px] rounded-[16px] bg-white py-[3.5px] shadow-float" style={{ bottom: fromBottom(641) }}>
        <button type="button" aria-label="확대" onClick={soon} className="flex h-[34px] w-[44px] items-center justify-center text-[22px] font-bold leading-[1.35]">+</button>
        <span className="h-px w-[24px] bg-paper-line" />
        <button type="button" aria-label="축소" onClick={soon} className="flex h-[34px] w-[44px] items-center justify-center text-[22px] font-bold leading-[1.35]">–</button>
      </div>

      {mine && (
        <Link to={`/group/${mine.groupId}`} className="absolute left-6 right-6 z-10 flex h-[76px] items-center rounded-[24px] bg-ink px-[14px] shadow-float" style={{ bottom: fromBottom(744) }}>
          <RoundPhoto size={48} ring={3} />
          <span className="ml-[12px] mt-[16px] min-w-0 flex-1 self-start">
            <span className="block truncate text-[15px] font-bold leading-[1.35] text-white">우리 모임 왕 자리 {mine.total}곳</span>
            <span className="mt-[3.75px] block truncate text-[12px] font-medium leading-[1.35] text-night-muted">{mine.groupName} · {mine.breakdown}</span>
          </span>
          <span className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-lime text-[15px] font-bold leading-none text-ink" aria-hidden>→</span>
        </Link>
      )}

      {/* 지도는 키보드 순서상 검색·필터 다음에 오도록 뒤에 둬요 (화면에서는 맨 아래 층) */}
      <MapBoard art={<SeoulArt />}>
        {clusters?.map((c) => <Cluster key={c.id} c={c} />)}
        {/* 우리 모임이 왕인 곳 */}
        {[[84, 330], [318, 580]].map(([x, y]) => (
          <Link key={x} to="/place/p-roast" aria-label="우리 모임이 왕인 곳" className="absolute flex flex-col items-center" style={{ left: x - 20, top: y - 34 }}>
            <Crown width={22} stroke="var(--color-ink)" />
            <span className="mt-[0.5px] rounded-full shadow-float"><RoundPhoto size={40} ring={3} /></span>
          </Link>
        ))}
      </MapBoard>
      <TabBar active="ranking" theme="light" />
    </Screen>
  )
}

/** 구별 왕좌 수 (검은 원). 많을수록 커지고, 뜨거운 곳은 라임 후광 */
function Cluster({ c }: { c: DistrictCluster }) {
  const d = 34 + 0.6 * c.count
  const cx = c.x * 390, cy = c.y * 844
  return (
    <Link to={`/ranking/area/${c.id}`} aria-label={`${c.name} 왕좌 ${c.count}곳`} className="absolute" style={{ left: cx - d / 2 - 10, top: cy - d / 2 - 10, width: d + 20, height: d + 20 }}>
      {c.hot && <span className="absolute inset-0 rounded-full bg-lime/45" />}
      <span className={`absolute left-[10px] top-[10px] flex items-center justify-center rounded-full border-[2.5px] border-white bg-ink font-black leading-none text-white shadow-[0_3px_8px_rgba(0,0,0,.28)] ${c.count >= 10 ? 'text-[14px]' : 'text-[13px]'}`}
        style={{ width: d, height: d }}>{c.count}</span>
    </Link>
  )
}

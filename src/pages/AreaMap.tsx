import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useBack } from '../components/useBack'
import { api } from '../api'
import { useApi } from '../api/useApi'
import { Chip, ChipRow } from '../components/Chip'
import { Crown } from '../components/Crown'
import { IconButton } from '../components/IconButton'
import { CategoryPin, HongdaeArt, MapBoard } from '../components/MapArt'
import { CAT_COLOR, CAT_SHORT, PLACE_FILTERS } from '../data/categories'
import { RoundPhoto } from '../components/Photo'
import { Screen } from '../components/Screen'
import { TabBar } from '../components/TabBar'
import type { KingPin } from '../data/types'
import { at } from '../components/figma'

const fromBottom = (bottomY: number) => `calc(var(--tabpad) + ${844 - 34 - bottomY}px)`

/** 일반 가게 (왕 없는 곳) 핀 — 피그마 위치 그대로 */
const PLAIN: [string, number, number][] = [['카페', 284, 184], ['식당', 44, 284], ['술집', 314, 384], ['영화관', 234, 604], ['식당', 104, 624], ['카페', 328, 544], ['만화카페', 24, 424]]

/** E · 확대 — 홍대 · 연남 일대 (피그마 2:113) */
export default function AreaMap() {
  const { area = 'hongdae' } = useParams()
  const nav = useNavigate()
  const back = useBack('/ranking')
  const { data: info } = useApi(() => api.area(area), [area])
  const { data: pins } = useApi(() => api.areaKings(area), [area])
  const ready = !!pins && pins.length > 0
  const [cat, setCat] = useState<(typeof PLACE_FILTERS)[number]>('전체')
  const shown = (pins ?? []).filter((p) => cat === '전체' || p.category === cat)

  return (
    <Screen bg="map2" padTop={false} className="h-dvh overflow-hidden" title={info?.name}>

      <div className="absolute left-[20px] right-[24px] z-10 flex items-start" style={{ top: at(52) }}>
        <IconButton label="뒤로" variant="white" size={44} onClick={back}>←</IconButton>
        <div className="ml-[10px] flex h-[48px] min-w-0 flex-1 items-center gap-[10px] rounded-full bg-white px-[16px] shadow-float">
          <span className="truncate text-[14px] font-bold leading-[1.35]">{info?.name ?? ''}</span>
          {ready && <span className="shrink-0 text-[12px] font-medium leading-[1.35] text-paper-muted">왕좌 {pins.length}곳</span>}
        </div>
        <IconButton label="목록 보기" variant="white" size={44} className="ml-[12px] mt-[2px]" onClick={() => nav('/ranking/list')}>≡</IconButton>
      </div>

      <ChipRow gap={6} className="absolute left-0 right-0 z-10 px-[20px] pb-[16px]" style={{ top: at(112) }}>
        {PLACE_FILTERS.map((f) => <Chip key={f} theme="light" on={cat === f} onClick={() => setCat(f)}>{f}</Chip>)}
      </ChipRow>

      {/* 아래 왕 카드 (옆으로 넘기기) */}
      <div className="no-scrollbar absolute left-0 right-0 z-10 flex snap-x snap-mandatory scroll-px-6 gap-[12px] overflow-x-auto px-6 pb-[14px] pt-[10px]" style={{ bottom: `calc(${fromBottom(750)} - 14px)` }}>
        {shown.map((p) => (
          <Link key={p.placeId} to={`/place/${p.placeId}`} className="relative flex h-[86px] w-[280px] shrink-0 snap-start items-center rounded-[22px] bg-white pl-[14px] pr-[14px] shadow-float">
            <span className="relative">
              <Crown width={22} stroke="var(--color-ink)" className="absolute -top-[11px] left-[12px]" />
              <RoundPhoto size={48} ring={3} tone={p.mine ? 'light' : 'dark'} />
            </span>
            <span className="ml-[12px] mt-[20px] min-w-0 flex-1 self-start">
              <span className="block truncate text-[15px] font-bold leading-[1.35]">{p.kingGroupName}</span>
              <span className="mt-[3.75px] block truncate text-[12px] font-medium leading-[1.35] text-paper-muted">{p.placeName}의 왕 · {p.visits}회</span>
            </span>
            <span className="text-[16px] font-bold leading-[1.35]" aria-hidden>→</span>
          </Link>
        ))}
      </div>

      {pins && !ready && (
        <div className="absolute left-6 right-6 z-10 rounded-[22px] bg-white px-5 py-5 text-[14px] leading-[1.6] text-ink shadow-float" style={{ bottom: fromBottom(750) }}>
          <b>{info?.name ?? '이 지역'}</b> 확대 지도는 준비 중이에요. 지금은 홍대 · 연남 일대만 볼 수 있어요.
          <Link to="/ranking/area/hongdae" className="mt-2 block font-bold underline underline-offset-4">홍대 · 연남 보기</Link>
        </div>
      )}
      {/* 지도는 키보드 순서상 버튼·필터 다음 (화면에서는 맨 아래 층) */}
      <MapBoard art={<HongdaeArt />}>
        {ready && PLAIN.filter(([c]) => cat === '전체' || c === cat).map(([c, x, y], i) => <CategoryPin key={i} cat={c} x={x} y={y} />)}
        {/* 지하철역 */}
        {ready && <span className="absolute left-[190px] top-[382px] size-[18px] rounded-full border-[3px] border-station bg-white" aria-hidden />}
        {ready && <span className="absolute left-[212px] top-[382px] rounded-full bg-station px-[8px] py-[3px] text-[11px] font-bold leading-[1.35] text-white">홍대입구역</span>}
        {shown.map((p) => <KingMarker key={p.placeId} p={p} />)}
      </MapBoard>
      <TabBar active="ranking" theme="light" />
    </Screen>
  )
}

/** 왕 핀: 왕관 + 왕 모임 사진 + 카테고리 뱃지 + 방문 횟수 */
function KingMarker({ p }: { p: KingPin }) {
  return (
    <Link to={`/place/${p.placeId}`} aria-label={`${p.placeName}, 왕 ${p.kingGroupName}, ${p.visits}회`} className="absolute h-[86px] w-[64px]" style={{ left: p.x - 32, top: p.y }}>
      {p.mine && <span className="absolute left-[-10px] top-[6px] size-[84px] rounded-full bg-lime/80 blur-[16px]" />}
      <Crown width={26} stroke="var(--color-ink)" className="absolute left-[19px] top-0" />
      <span className="absolute left-[4px] top-[16px] rounded-full shadow-[0_4px_10px_rgba(0,0,0,.25)]"><RoundPhoto size={56} ring={3} ringColor={p.mine ? 'var(--color-lime)' : '#fff'} tone={p.mine ? 'light' : 'dark'} /></span>
      <span className="absolute left-[44px] top-[50px] flex size-[22px] items-center justify-center rounded-full border-2 border-white text-[10px] font-bold leading-none text-white" style={{ background: CAT_COLOR[p.category] }}>{CAT_SHORT[p.category]}</span>
      <span className={`absolute left-1/2 top-[70px] -translate-x-1/2 whitespace-nowrap rounded-full px-[8px] py-[3px] text-[11px] font-black leading-[1.35] ${p.mine ? 'bg-lime text-ink' : 'bg-ink text-white'}`}>{p.visits}회</span>
      {p.mine && <span className="absolute left-[54px] top-[-23px] whitespace-nowrap rounded-full bg-ink px-[8px] py-[3px] text-[10px] font-bold leading-[1.35] text-lime">내 모임</span>}
    </Link>
  )
}

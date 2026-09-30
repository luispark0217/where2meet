import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { tugApi, type CandidatePlace } from '../../api/tug'
import { useApi } from '../../api/useApi'
import { Crown } from '../../components/Crown'
import { IconButton } from '../../components/IconButton'
import { Screen } from '../../components/Screen'
import { StateView } from '../../components/StateView'
import { toast } from '../../components/toast'
import { KingTag } from '../../components/KingTag'
import { Thumb } from '../../components/Photo'
import { useBack } from '../../components/useBack'
import { CAT_COLOR, CAT_SHORT } from '../../data/categories'
import type { PlaceCategory } from '../../data/types'
import { at } from '../../components/figma'


/** 필터 칩 순서 (개수가 0 인 카테고리는 숨겨요) */
const CATS: PlaceCategory[] = ['식당', '카페', '술집', '만화카페', '영화관']
const SORTS = [
  { key: 'match', label: '취향순', by: (a: CandidatePlace, b: CandidatePlace) => b.match - a.match },
  { key: 'walk', label: '가까운 순', by: (a: CandidatePlace, b: CandidatePlace) => a.walkMin - b.walkMin },
  { key: 'likes', label: '찜 많은 순', by: (a: CandidatePlace, b: CandidatePlace) => b.likes - a.likes },
] as const

/** N · 장소 리스트 (피그마 31:165) */
export default function PlaceList() {
  const { id } = useParams() as { id: string }
  const back = useBack(`/meet/${id}`)
  const { data: info, status } = useApi(() => tugApi.places(id), [id])

  // 정렬·거르기는 주소(?sort=walk&cat=식당)에 둬서 장소를 보고 돌아와도 그대로예요
  const [params, setParams] = useSearchParams()
  const cat = (params.get('cat') as PlaceCategory | null) ?? '전체'
  const sort = Math.max(0, SORTS.findIndex((x) => x.key === params.get('sort')))
  const setQuery = (key: 'cat' | 'sort', v: string | null) => setParams((p) => { const n = new URLSearchParams(p); if (v) n.set(key, v); else n.delete(key); return n }, { replace: true })
  const setCat = (c: PlaceCategory | '전체') => setQuery('cat', c === '전체' ? null : c)
  /** 내가 누른 찜 (장소 id → 켜짐/꺼짐). 서버 값 위에 덮어써요 */
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const items = useMemo(() => (info?.places ?? []).map((p) => {
    const on = liked[p.id]
    return on === undefined || on === !!p.liked ? p : { ...p, liked: on, likes: p.likes + (on ? 1 : -1) }
  }), [info, liked])

  const counts = useMemo(() => Object.fromEntries(CATS.map((c) => [c, items.filter((p) => p.category === c).length])), [items])
  const shown = useMemo(() => items.filter((p) => cat === '전체' || p.category === cat).sort(SORTS[sort].by), [items, cat, sort])

  const nextSort = () => {
    const n = (sort + 1) % SORTS.length
    setQuery('sort', n === 0 ? null : SORTS[n].key)
    toast(`${SORTS[n].label}으로 정렬했어요`)
  }
  const toggleLike = (p: CandidatePlace) => {
    const on = !p.liked
    setLiked((m) => ({ ...m, [p.id]: on }))
    tugApi.like(id, p.id, on).catch(() => {
      setLiked((m) => ({ ...m, [p.id]: !on }))
      toast('찜하지 못했어요. 다시 시도해주세요')
    })
  }

  return (
    <Screen bg="paper" padTop={false} title={info ? `${info.title} · 장소 리스트` : '장소 리스트'}>
      {/* 지도 (카카오맵 자리) — 피그마 지도판 390×400, 폰 가운데 */}
      <div className="absolute inset-x-0 z-0 h-[400px] overflow-hidden bg-map-2" style={{ top: 'calc(var(--sat) - 44px)' }} aria-hidden>
        <div className="absolute left-1/2 top-0 h-[400px] w-[390px] -translate-x-1/2">
          <svg width="390" height="400" className="absolute inset-0 overflow-visible">
            <g fill="#fff">
              {[120, 210, 300].map((y) => <rect key={y} x="-100" y={y} width="590" height="8" />)}
              {[70, 180, 300].map((x) => <rect key={x} x={x} y="0" width="8" height="400" />)}
            </g>
            <circle cx="195" cy="250" r="100" fill="var(--color-lime)" fillOpacity=".3" />
          </svg>
          {info && items.filter((p) => p.pin && (cat === '전체' || p.category === cat)).map((p) => (
            <span key={p.id} className="absolute" style={{ left: p.pin!.x, top: p.pin!.y }}>
              {p.kingIsUs && <Crown width={22} stroke="var(--color-ink)" className="absolute left-0 top-[-11px]" />}
              <span className="flex size-[34px] items-center justify-center rounded-[11px] border-[2.5px] border-white text-[13px] font-black leading-none text-white shadow-float"
                style={{ background: CAT_COLOR[p.category] }}>{CAT_SHORT[p.category]}</span>
            </span>
          ))}
          {info && <span className="absolute left-[187px] top-[242px] size-[16px] rounded-full border-[3px] border-lime bg-ink" />}
        </div>
      </div>

      <header className="absolute left-[20px] right-[20px] z-10 flex h-[44px] items-center justify-between" style={{ top: at(52) }}>
        <IconButton label="뒤로" variant="white" size={44} onClick={back}>←</IconButton>
        <p className="absolute left-1/2 max-w-[calc(100%-112px)] -translate-x-1/2 truncate whitespace-nowrap rounded-full bg-white px-[18px] py-[11px] text-[14px] font-bold leading-[1.35] shadow-float">
          {info?.title ?? ''} · 장소 리스트
        </p>
        <IconButton label={`정렬 바꾸기 (지금 ${SORTS[sort].label})`} variant="white" size={44} onClick={nextSort}>≡</IconButton>
      </header>

      <section className="relative z-[1] flex flex-col rounded-t-[32px] bg-white shadow-sheet"
        style={{ marginTop: at(350), minHeight: 'calc(100dvh - var(--sat) - 306px)', paddingBottom: 'calc(96px + var(--sab))' }}
        aria-labelledby="pl-title">
        <span className="mx-auto mt-[10px] block h-[5px] w-[40px] rounded-[3px] bg-paper-line" aria-hidden />

        {status !== 'ok' && <StateView status={status} what="장소 리스트" dark={false} notFound="이 약속은 아직 장소를 추천할 단계가 아니에요." back={{ to: `/meet/${id}`, label: '약속으로 돌아가기' }} />}
        {info && (
          <>
            <div className="mt-[13px] flex px-[24px]">
              <span className="flex size-[44px] shrink-0 items-center justify-center rounded-[14px] bg-lime text-[18px] font-bold leading-none" aria-hidden>★</span>
              <div className="ml-[12px] min-w-0">
                <h1 id="pl-title" className="truncate text-[17px] font-bold leading-[1.35]">{info.title} 추천 리스트</h1>
                <p className="mt-[3px] truncate text-[12px] font-medium leading-[1.35] text-paper-muted">{info.confirmed ? `확정: ${info.confirmed.name} · ` : ''}장소 {items.length} · {info.areaLabel} · {info.mood}</p>
              </div>
            </div>

            <div className="no-scrollbar mt-[18px] flex h-[34px] scroll-px-6 items-center gap-[6px] overflow-x-auto px-[24px]" role="group" aria-label="카테고리">
              {(['전체', ...CATS.filter((c) => counts[c] > 0)] as const).map((c) => {
                const on = cat === c
                return (
                  <button key={c} type="button" aria-pressed={on} onClick={() => setCat(c)}
                    onFocus={(e) => e.currentTarget.scrollIntoView({ inline: 'nearest', block: 'nearest' })}
                    className={`shrink-0 whitespace-nowrap rounded-full px-[13px] py-[7px] text-[13px] leading-[1.35] focus-visible:outline-offset-[-3px] ${on ? 'bg-ink font-bold text-lime focus-visible:outline-lime' : 'border border-paper-line bg-white font-medium text-ink focus-visible:outline-ink'}`}>
                    {c} {c === '전체' ? items.length : counts[c]}
                  </button>
                )
              })}
            </div>

            <ul className="mt-[18px] px-[24px]" aria-label={`${SORTS[sort].label} 장소`}>
              {shown.map((p) => (
                <li key={p.id} className="relative mb-[20px] h-[72px]">
                  <Link to={`/place/${p.id}`} className="flex h-full items-start rounded-[16px]">
                    <Thumb src={p.photoUrl} size={72} tone={p.tone} />
                    <span className="ml-[14px] min-w-0 flex-1 pt-[2px]">
                      <span className="block truncate pr-[48px] text-[16px] font-bold leading-[1.35]">{p.name}</span>
                      <span className="mt-[2.4px] block truncate pr-[48px] text-[12px] font-medium leading-[1.35] text-paper-muted">{p.category} · 도보 {p.walkMin}분 · {p.note}</span>
                      <span className="mt-[5.8px] flex gap-[6px] overflow-hidden">
                        <span className="shrink-0 rounded-full bg-lime px-[8px] py-[3px] text-[11px] font-bold leading-[1.35]">취향 {p.match}%</span>
                        {p.kingGroupName && <KingTag name={p.kingGroupName} />}
                      </span>
                    </span>
                  </Link>
                  <button type="button" onClick={() => toggleLike(p)} aria-pressed={!!p.liked} aria-label={`${p.name} 찜 ${p.likes}`}
                    className={`absolute right-0 top-[-9px] flex h-[40px] w-[48px] items-center pl-[12px] text-[13px] font-bold leading-[1.35] ${p.likes > 0 ? 'text-live' : 'text-paper-muted'}`}>
                    ♥ {p.likes}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {info && (
        <div className="pointer-events-none fixed inset-x-0 z-20 mx-auto max-w-[430px]" style={{ bottom: 'max(calc(var(--sab) - 14px), 16px)' }}>
          <Link to={info.confirmed ? `/place/${info.confirmed.placeId}` : `/meet/${id}/vote`} className="pointer-events-auto ml-auto mr-[24px] flex h-[48px] w-[150px] items-center justify-center rounded-full bg-ink text-[14px] font-bold leading-[1.35] text-lime shadow-float">
            {info.confirmed ? '확정 장소 보기' : '투표로 정하기'}
          </Link>
        </div>
      )}
    </Screen>
  )
}

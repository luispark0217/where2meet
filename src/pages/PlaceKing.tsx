import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../api/useApi'
import { Crown } from '../components/Crown'
import { IconButton } from '../components/IconButton'
import { LiveDot } from '../components/LiveDot'
import { CategoryPin, MapBoard, PlaceArt } from '../components/MapArt'
import { RoundPhoto } from '../components/Photo'
import { Screen } from '../components/Screen'
import { StateView } from '../components/StateView'
import { soon } from '../components/toast'
import { useBack } from '../components/useBack'
import { at } from '../components/figma'


/** F · 왕 아이콘 클릭 — 장소 · 모임 랭킹 (피그마 3:2) */
export default function PlaceKing() {
  const { id } = useParams() as { id: string }
  const back = useBack('/ranking')
  const { data: k, status } = useApi(() => api.placeKing(id), [id])
  const top = k?.ranking[0]?.visits ?? 1

  return (
    <Screen bg="white" padTop={false} title={k?.place.name}>
      <MapBoard height={360} art={<PlaceArt />}>
        {k && <>
        <CategoryPin cat="카페" x={304} y={114} />
        <CategoryPin cat="식당" x={44} y={234} />
        <span className="absolute left-[130px] top-[110px] size-[130px] rounded-full bg-lime/75 blur-[22px]" />
        <Crown width={34} stroke="var(--color-ink)" className="absolute left-[178px] top-[104px]" />
        <span className="absolute left-[159px] top-[124px] rounded-full shadow-[0_4px_12px_rgba(0,0,0,.25)]"><RoundPhoto size={72} ring={3} tone="dark" /></span>
        </>}
      </MapBoard>

      <div className="absolute left-[20px] right-[20px] z-20 flex justify-between" style={{ top: at(52) }}>
        <IconButton label="뒤로" variant="white" size={44} onClick={back}>←</IconButton>
        <IconButton label="공유" variant="white" size={44} onClick={soon}>↗</IconButton>
      </div>

      {status !== 'ok' && <div className="relative z-10" style={{ paddingTop: 'calc(var(--sat) + 60px)' }}><StateView status={status} what="장소" dark={false} /></div>}
      {k && (
        <section className="relative z-10 rounded-t-[32px] bg-white px-[20px] pt-[12px] shadow-sheet" style={{ marginTop: at(290), paddingBottom: 'calc(28px + var(--sab))' }}>
          {/* 장소 사진 카드 */}
          <div className="relative -mx-[8px] h-[150px] overflow-hidden rounded-[24px] bg-gradient-to-b from-[#6e6e6e] to-[#1e1e1e]">
            <span className="absolute -right-[34px] -top-[60px] size-[180px] rounded-full bg-white/10" />
            <span className="absolute left-[16px] top-[16px] flex items-center gap-[5px] rounded-full bg-lime py-[5px] pl-[8px] pr-[10px] text-[11px] font-bold leading-[1.35] text-ink">
              <Crown width={14} fill="var(--color-ink)" /> 현재 왕
            </span>
            <p className="absolute left-[16px] right-[16px] top-[80px] truncate text-[24px] font-black leading-[1.35] text-white">{k.place.name}</p>
            <p className="absolute left-[16px] right-[16px] top-[114px] truncate text-[12px] font-medium leading-[1.35] text-white/70">{k.place.category} · {k.place.district} · 방문한 모임 {k.place.visitedGroupCount}곳</p>
          </div>

          {/* 현재 왕 */}
          <div className="relative mt-[16px] flex items-start">
            <span className="relative shrink-0">
              <Crown width={26} stroke="var(--color-ink)" className="absolute -top-[14px] left-[13px]" />
              <RoundPhoto size={52} ring={3} tone="dark" />
            </span>
            <span className="ml-[12px] min-w-0 flex-1">
              <span className="block truncate text-[18px] font-bold leading-[1.35]">{k.king.group.name}</span>
              <span className="mt-[1.7px] block truncate text-[12px] font-medium leading-[1.35] text-paper-muted">방문 {k.king.visits}회 · {k.king.daysAsKing}일째 왕 자리</span>
            </span>
            <Link to={`/place/${k.place.id}/challenge`} className="ml-[8px] mt-[6px] flex h-[40px] w-[96px] shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-bold leading-[1.35] text-lime">{k.king.group.id === k.myGroupId ? '왕좌 지키기' : '도전하기'}</Link>
          </div>

          <hr className="mt-[16px] border-0 border-t border-paper-line" />

          <div className="mt-[15px] flex items-center gap-[16px]">
            <h2 className="text-[15px] font-bold leading-[1.35]">이 장소 랭킹</h2>
            <span className="flex items-center gap-[5px] rounded-full bg-paper-chip px-[8px] py-[3px] text-[10px] font-bold leading-[1.35] text-live"><LiveDot size={6} />실시간</span>
          </div>

          <ol className="mt-[5.75px]">
            {k.ranking.map((r, i) => {
              const mine = r.group.id === k.myGroupId
              const gap = i > 0 ? k.ranking[i - 1].visits - r.visits : 0
              return (
                <li key={r.group.id} className={`flex h-[36px] items-center rounded-[12px] pl-[10px] pr-0 ${mine ? 'bg-cream' : ''} ${i > 0 ? 'mt-[4px]' : ''}`}>
                  <span className={`w-[10px] text-[15px] font-black leading-[1.35] ${r.rank === 1 ? 'text-lime-deep' : 'text-ink'}`}>{r.rank}</span>
                  <span className="ml-[10px]"><RoundPhoto size={28} tone={i === 0 ? 'dark' : i === 1 ? 'light' : 'mid'} /></span>
                  <span className="ml-[10px] min-w-0 truncate text-[14px] font-bold leading-[1.35]">{r.group.name}</span>
                  {mine && gap > 0 && <span className="ml-[24px] shrink-0 rounded-full bg-ink px-[7px] py-[2px] text-[10px] font-bold leading-[1.35] text-lime">{gap}회 차이!</span>}
                  <span className="ml-auto h-[6px] w-[70px] shrink-0 overflow-hidden rounded-[3px] bg-paper-chip">
                    <span className={`block h-full rounded-[3px] ${r.rank === 1 ? 'bg-lime' : 'bg-ink/50'}`} style={{ width: `${(r.visits / top) * 100}%` }} />
                  </span>
                  <span className="w-[38px] shrink-0 text-right text-[12px] font-bold leading-[1.35] text-paper-muted">{r.visits}회</span>
                </li>
              )
            })}
          </ol>

          <h2 className="mt-[20px] text-[15px] font-bold leading-[1.35]">{k.king.group.name}의 다른 왕좌</h2>
          <div className="mt-[8px] grid grid-cols-3 gap-[10px]">
            {k.otherThrones.map((t) => (
              <Link key={t.placeId} to={`/place/${t.placeId}`} className="relative block h-[80px] rounded-[18px] bg-paper-chip px-[12px] pt-[12px]">
                <Crown width={18} fill={t.rank === 1 ? 'var(--color-lime)' : 'var(--color-paper-muted)'} stroke="var(--color-ink)" />
                <p className="mt-[10.9px] truncate text-[12px] font-bold leading-[1.35]">{t.placeName}</p>
                <p className="mt-[3.8px] truncate text-[11px] font-medium leading-[1.35] text-paper-muted">{t.rank}위 · {t.visits}회</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Screen>
  )
}

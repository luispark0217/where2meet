import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useApi } from '../api/useApi'
import { IconButton } from '../components/IconButton'
import { Screen } from '../components/Screen'
import { StateView } from '../components/StateView'
import { soon } from '../components/toast'
import { useBack } from '../components/useBack'
import { mmss, useCountdown } from '../components/useCountdown'
import type { AvatarColor, Meeting, Member } from '../data/types'

/** 약속 진행 단계 → 상단 단계 칩 상태 (done = 지난 단계, now = 지금 단계) */
const STEP_STATE: Record<Meeting['stage'], ['done' | 'now' | 'todo', 'done' | 'now' | 'todo', 'done' | 'now' | 'todo']> = {
  time: ['now', 'todo', 'todo'],
  place: ['done', 'now', 'todo'],
  tug: ['done', 'now', 'todo'],
  confirmed: ['done', 'done', 'now'],
  done: ['done', 'done', 'done'],
}

/** C · 약속 상세 — 시간 · 장소 추천 (피그마 1:228) */
export default function MeetingDetail() {
  const { id } = useParams() as { id: string }
  const nav = useNavigate()
  const { data: m, status } = useApi(() => api.meeting(id), [id])
  const back = useBack(m ? `/group/${m.groupId}` : '/')
  const steps = m ? STEP_STATE[m.stage] : undefined
  const label = (s: 'done' | 'now' | 'todo' | undefined, done: string, now: string, todo: string) => (s === 'done' ? done : s === 'now' ? now : todo)
  const stepLabels = [
    label(steps?.[0], '① 시간 확정', '① 시간 정하는 중', '① 시간 정하기'),
    label(steps?.[1], '② 장소 확정', '② 장소 정하는 중', '② 장소 정하기'),
    label(steps?.[2], '③ 레이스 끝', '③ 레이스', '③ 레이스'),
  ]

  return (
    <Screen title={m?.title}>
      <div className="px-6" style={{ paddingBottom: 'calc(48px + var(--sab))' }}>
        <header className="mt-[8px] flex h-[40px] items-center justify-between">
          <IconButton label="뒤로" onClick={back}>←</IconButton>
          <h1 className="min-w-0 flex-1 truncate px-3 pt-[3px] text-center text-[17px] font-bold leading-[1.35]">{m?.title ?? ''}</h1>
          <IconButton label="공유" onClick={() => nav(`/meet/${id}/share`)}>↗</IconButton>
        </header>

        {steps && (
          <ol className="no-scrollbar mt-[20px] flex h-[30px] items-center gap-[6px] overflow-x-auto" aria-label="약속 진행 단계">
            {steps.map((s, i) => (
              <li key={i} aria-current={s === 'now' ? 'step' : undefined}
                className={`shrink-0 whitespace-nowrap rounded-full px-[12px] py-[6px] text-[12px] leading-[1.35] ${
                  s === 'done' ? 'bg-lime font-bold text-ink' : s === 'now' ? 'border border-white/25 bg-white font-bold text-ink' : 'border border-white/25 font-medium text-white'}`}>
                {stepLabels[i]}
              </li>
            ))}
          </ol>
        )}

        {status !== 'ok' && <div className="-mx-6"><StateView status={status} what="약속" /></div>}
        {m?.availability && <TimeCard m={m} />}
        {m?.midpoint && <PlaceCard m={m} />}
        {m && !m.midpoint && m.placeName && <PickedPlaceCard m={m} />}

        {/* 장소를 정하는 중(줄다리기·투표)이면 확정은 투표(P)에서 — 확정하면 공유(S)로 이어져요 */}
        {m && m.stage !== 'done' && (
          <button type="button" onClick={() => (m.stage === 'tug' || m.stage === 'place' ? nav(`/meet/${m.id}/vote`) : soon())} className="mt-[28px] flex h-[56px] w-full items-center justify-center rounded-full bg-lime text-[16px] font-bold leading-[1.35] text-ink">
            {m.stage === 'time' ? '가능한 시간 입력하기' : m.stage === 'confirmed' ? '레이스 준비하기' : '약속 확정하고 공유하기'}
          </button>
        )}
      </div>
    </Screen>
  )
}

/** 언제 모일까? — when2meet 식 시간표 (진할수록 가능한 사람이 많음, 흰 테두리 = 확정된 시간) */
function TimeCard({ m }: { m: Meeting }) {
  const av = m.availability!
  const picked = av.picked
  const chip = m.timeConfirmedLabel ?? m.responded ?? '투표 중'
  return (
    <section className="relative mt-[18px] h-[236px] rounded-[26px] bg-night-1" aria-labelledby="time-h">
      <h2 id="time-h" className="absolute left-[20px] top-[18px] text-[16px] font-bold leading-[1.35]">언제 모일까?</h2>
      <p className="absolute left-[20px] top-[42px] text-[11px] font-medium leading-[1.35] text-night-muted">진할수록 가능한 사람이 많아요</p>
      <span className={`absolute right-[20px] top-[18px] rounded-full px-[10px] py-[4px] text-[11px] font-bold leading-[1.35] ${m.timeConfirmedLabel ? 'bg-lime text-ink' : 'border border-white/25 font-medium text-white'}`}>{chip}</span>

      <div role="table" aria-label="요일·시간별 가능한 사람 비율" className="absolute left-[24px] right-[12px] top-[70px] grid grid-cols-[42px_1fr_1fr_1fr] gap-x-[4px]">
        <div role="row" className="contents">
          <span role="columnheader" aria-label="시간" />
          {av.days.map((d) => <span key={d} role="columnheader" className="text-center text-[11px] font-bold leading-[1.35] text-white/80">{d}</span>)}
        </div>
        {av.hours.map((h, r) => (
          <div key={h} role="row" className="contents">
            <span role="rowheader" className="text-[10px] font-medium leading-[1.35] text-night-muted" style={{ marginTop: r === 0 ? 9 : 6 }}>{h}시</span>
            {av.days.map((d, c) => {
              const on = picked?.[0] === r && picked?.[1] === c
              const a = av.ratio[r][c]
              return (
                <span key={d} role="cell" aria-label={`가능 ${Math.round(a * 100)}%${on ? ', 확정된 시간' : ''}`} className="block h-[18px] rounded-[4px]"
                  style={{ marginTop: r === 0 ? 7 : 4, background: a >= 1 ? 'var(--color-lime)' : `rgba(198,244,50,${a})`, boxShadow: on ? 'inset 0 0 0 2px #fff' : undefined }} />
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}

/** 어디서 만날까? — 중간 지점 + 줄다리기 (확정 뒤: 여기서 만나요) */
function PlaceCard({ m }: { m: Meeting }) {
  const mp = m.midpoint!
  const tugging = m.stage === 'tug'
  const deciding = tugging || m.stage === 'place'
  const left = useCountdown(tugging ? mp.tugEndsAt : undefined)
  const over = tugging && !!mp.tugEndsAt && left <= 0
  const chip = !deciding ? '장소 확정' : !tugging ? '장소 투표 중' : over ? '줄다리기 끝' : `줄다리기 중 ${mmss(left)}`
  const btn = 'flex h-[40px] items-center justify-center rounded-full text-[13px] font-bold leading-[1.35]'
  return (
    <section className="relative mt-[16px] h-[300px] rounded-[26px] bg-night-1" aria-labelledby="place-h">
      <h2 id="place-h" className="absolute left-[20px] top-[18px] text-[16px] font-bold leading-[1.35]">{deciding ? '어디서 만날까?' : '여기서 만나요'}</h2>
      <span role="timer" className={`absolute right-[20px] top-[18px] rounded-full px-[10px] py-[4px] text-[11px] leading-[1.35] ${deciding ? 'border border-white/25 font-medium' : 'bg-lime font-bold text-ink'}`}>{chip}</span>
      <div className="absolute left-[20px] right-[20px] top-[52px] h-[130px] overflow-hidden rounded-[18px] bg-map-2">
        <MidpointMap people={m.participants} />
      </div>
      <p className="absolute left-[20px] right-[20px] top-[196px] truncate text-[22px] font-black leading-[1.35]">{m.placeName && !deciding ? m.placeName : mp.stationName}</p>
      <p className="absolute left-[20px] right-[20px] top-[228px] truncate text-[12px] font-medium leading-[1.35] text-night-muted">
        {m.placeName && !deciding ? `${mp.stationName} · ` : ''}평균 {mp.avgMin}분 · 최대 차이 {mp.maxGapMin}분
      </p>
      {deciding ? (
        <div className={`absolute left-[20px] right-[20px] top-[250px] grid gap-[12px] ${tugging ? 'grid-cols-[140fr_150fr]' : 'grid-cols-1'}`}>
          {tugging && (over
            ? <Link to={`/meet/${m.id}/vote`} className={`${btn} border border-white/30`}>확정 투표하기</Link>
            : <Link to={`/meet/${m.id}/tug`} className={`${btn} border border-white/30`}>↔ 줄다리기</Link>)}
          <Link to={`/meet/${m.id}/places`} className={`${btn} bg-lime text-ink`}>장소 리스트 보기</Link>
        </div>
      ) : m.placeId && (
        <div className="absolute left-[20px] right-[20px] top-[250px]">
          <Link to={`/place/${m.placeId}`} className={`${btn} bg-lime text-ink`}>장소 보기</Link>
        </div>
      )}
    </section>
  )
}

/** 중간 지점 없이 가게부터 정한 약속 (L '여기서 약속 잡기') */
function PickedPlaceCard({ m }: { m: Meeting }) {
  return (
    <section className="relative mt-[16px] rounded-[26px] bg-night-1 px-[20px] pb-[18px] pt-[18px]" aria-labelledby="picked-h">
      <h2 id="picked-h" className="text-[16px] font-bold leading-[1.35]">여기서 만나요</h2>
      <p className="mt-[8px] truncate text-[22px] font-black leading-[1.35]">{m.placeName}</p>
      <p className="mt-[2px] text-[12px] font-medium leading-[1.35] text-night-muted">시간이 정해지면 모두에게 알려드려요</p>
      {m.placeId && <Link to={`/place/${m.placeId}`} className="mt-[14px] flex h-[40px] items-center justify-center rounded-full bg-lime text-[13px] font-bold leading-[1.35] text-ink">장소 보기</Link>}
    </section>
  )
}

const FILL: Record<AvatarColor, string> = { lime: '#c6f432', yellow: '#ffd66b', blue: '#9fd6ff', pink: '#ffb3c7', purple: '#c9b8ff' }
/** 친구들 위치 → 중간 지점 (카카오맵 연결 전 그림) */
function MidpointMap({ people }: { people: Member[] }) {
  const spots = [[30, 24], [272, 26], [268, 108], [36, 106]]
  return (
    <svg viewBox="0 0 302 130" preserveAspectRatio="xMidYMid slice" className="size-full" role="img" aria-label="친구들 출발지와 중간 지점">
      <g fill="#fff">
        <rect x="0" y="30" width="302" height="6" /><rect x="0" y="70" width="302" height="6" /><rect x="0" y="104" width="302" height="6" />
        <rect x="60" y="0" width="6" height="130" /><rect x="150" y="0" width="6" height="130" /><rect x="240" y="0" width="6" height="130" />
      </g>
      <rect x="200" y="10" width="80" height="40" rx="10" fill="#ddefcf" />
      {people.slice(0, 4).map((p, i) => (
        <line key={p.id} x1={spots[i][0]} y1={spots[i][1]} x2="151" y2="65" stroke="#111412" strokeOpacity=".55" strokeWidth="1.5" strokeDasharray="1.5 4" strokeLinecap="round" />
      ))}
      <circle cx="151" cy="65" r="28" fill="#c6f432" fillOpacity=".4" />
      <circle cx="151" cy="65" r="6" fill="#c6f432" stroke="#111412" strokeWidth="4" />
      {people.slice(0, 4).map((p, i) => (
        <g key={p.id}>
          <circle cx={spots[i][0]} cy={spots[i][1]} r="12" fill={FILL[p.color]} stroke="#fff" strokeWidth="2" />
          <text x={spots[i][0]} y={spots[i][1] + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#111412">{p.name.slice(0, 1)}</text>
        </g>
      ))}
    </svg>
  )
}

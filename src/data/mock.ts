import type {
  Area, ChatMessage, DistrictCluster, Group, KingPin, Meeting, Member, MyRankSummary, MyThrones, PlaceCategory, PlaceKing,
  RankingEntry, AlertItem, MyProfile, Settings, TugBoard,
} from './types'

/*
 * 가짜 데이터의 '처음 상태' — 피그마 시안의 내용을 옮겼어요. 백엔드가 붙으면 사용하지 않아요.
 * 화면을 오가며 바뀌는 값(투표·찜·확정·새 모임…)은 src/api/store.ts 가 이 값을 복사해서 들고 있어요.
 * 날짜는 2026년 달력 기준이에요 (2026-09-25 = 금요일).
 */

/* ── 사람 ── */
export const me: Member = { id: 'u-eunsu', name: '은수', color: 'lime' }
const ji: Member = { id: 'u-jimin', name: '지민', color: 'yellow' }
const do_: Member = { id: 'u-doyun', name: '도윤', color: 'blue' }
const seo: Member = { id: 'u-seoa', name: '서아', color: 'pink' }
const ha: Member = { id: 'u-hajun', name: '하준', color: 'purple' }
export const people = { me, ji, do_, seo, ha }
const crew = [me, ji, do_, seo]

/* ── 모임 ── */
export const groups: Group[] = [
  { id: 'g-uni', name: '대학 동기 모임', category: '친구', members: [me, ji, do_, seo, ha], memberCount: 6, since: 2021, kingCount: 3, meetingCount: 24, avgLateMin: 4, statusText: '다음 약속 · 금 19:00', myRole: '방장' },
  { id: 'g-film', name: '필름 동아리', category: '동아리', members: crew, memberCount: 8, since: 2022, kingCount: 5, meetingCount: 31, avgLateMin: 6, statusText: '시간 정하는 중 · 4/6', myRole: '멤버' },
  { id: 'g-lunch', name: '회사 점심팟', category: '회사', members: crew, memberCount: 5, since: 2024, kingCount: 1, meetingCount: 18, avgLateMin: 2, statusText: '장소 투표 중', myRole: '멤버' },
  { id: 'g-high', name: '고등학교 친구들', category: '친구', members: crew, memberCount: 4, since: 2019, kingCount: 0, meetingCount: 9, avgLateMin: 11, statusText: '약속 없음 · 12일 전', myRole: '방장' },
]

/** 내 모임이 아닌 모임 (랭킹·왕좌에만 나와요) */
const OTHER_GROUPS: Record<string, string> = { 'g-hike': '등산 크루', 'g-board': '보드게임 모임', 'g-movie': '영화 동호회', 'g-run': '러닝 크루' }
export const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? OTHER_GROUPS[id] ?? '알 수 없는 모임'

/* ── 날짜 도우미 (2026 달력) ── */
const WD = ['일', '월', '화', '수', '목', '금', '토']
const ymd = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)) }
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000)
/** "2026-09-25" → "금" */
const weekday = (iso: string) => WD[ymd(iso).getUTCDay()]
/** "2026-09-25T19:00+09:00" → "9/25 (금) 19:00" */
export const whenLabel = (iso: string) => { const d = ymd(iso); return `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${weekday(iso)}) ${iso.slice(11, 16)}` }
/** "2026-09-25…" → "9/25" */
export const mdLabel = (iso: string) => { const d = ymd(iso); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}` }

/** 시간 조율 표: firstDay 부터 3일 × hours. scheduledAt 이 있으면 그 칸에 흰 테두리 */
export function grid(firstDay: string, hours: number[], ratio: number[][], scheduledAt?: string) {
  const start = ymd(firstDay)
  const days = [0, 1, 2].map((i) => { const d = addDays(start, i); return `${WD[d.getUTCDay()]} ${d.getUTCDate()}` })
  let picked: [number, number] | undefined
  if (scheduledAt) {
    const c = Math.round((ymd(scheduledAt).getTime() - start.getTime()) / 86400000)
    const r = hours.indexOf(Number(scheduledAt.slice(11, 13)))
    if (c >= 0 && c < 3 && r >= 0) picked = [r, c]
  }
  return { days, hours, ratio, picked }
}
const EVENING = [17, 18, 19, 20, 21, 22]
const FRI = [[0.26, 0.45, 0.63], [0.54, 0.63, 0.45], [1, 0.63, 0.26], [1, 0.82, 0.26], [0.63, 0.45, 0.17], [0.26, 0.26, 0.17]]
const MT = [[0.17, 0.5, 0.67], [0.33, 0.67, 0.83], [0.5, 1, 0.67], [0.33, 0.83, 0.5], [0.17, 0.5, 0.33], [0, 0.17, 0.17]]
const SAT = [[0.2, 0.45, 0.3], [0.4, 0.63, 0.45], [0.45, 1, 0.5], [0.3, 0.8, 0.4], [0.2, 0.5, 0.2], [0.1, 0.3, 0.1]]
const MON = [[0.3, 0.2, 0.45], [0.45, 0.4, 0.63], [0.63, 0.5, 0.82], [0.8, 0.6, 1], [0.5, 0.4, 0.63], [0.2, 0.2, 0.3]]
const LUNCH = [[0.2, 0.4, 0.6], [0.6, 0.8, 1], [0.4, 0.6, 0.8], [0.1, 0.2, 0.3]]
const confirmedLabel = (iso: string) => `${weekday(iso)} ${iso.slice(11, 16)} 확정`
const on = (iso: string) => ({ scheduledAt: iso, timeConfirmedLabel: confirmedLabel(iso) })

/* ── 약속 ── */
const FRI_AT = '2026-09-25T19:00+09:00'
const BDAY_AT = '2026-10-12T20:00+09:00'
const STUDY_AT = '2026-09-12T19:00+09:00'
const PAST_AT = '2026-08-03T20:00+09:00'
const LUNCH_AT = '2026-09-25T12:00+09:00'

export const meetings: Meeting[] = [
  {
    id: 'm-fri', groupId: 'g-uni', title: '금요일 저녁', stage: 'tug', bucket: 'active', subText: '홍대입구 부근 · 9/25',
    participants: crew, availability: grid('2026-09-25', EVENING, FRI, FRI_AT), ...on(FRI_AT),
    // 줄다리기 중에는 store 가 지금 판 상태(역·평균·최대 차이·마감)로 덮어써요
    midpoint: { stationName: '홍대입구역', avgMin: 24, maxGapMin: 11 },
  },
  { id: 'm-mt', groupId: 'g-uni', title: '10월 MT', stage: 'time', bucket: 'active', subText: '4/6 응답 · 마감 D-2', participants: crew, responded: '4/6 응답 · 마감 D-2', availability: grid('2026-10-16', EVENING, MT) },
  {
    id: 'm-bday', groupId: 'g-uni', title: '생일 파티', stage: 'confirmed', bucket: 'active', subText: '연남 로스터리 · 10/12', participants: crew,
    availability: grid('2026-10-10', EVENING, MON, BDAY_AT), ...on(BDAY_AT), midpoint: { stationName: '홍대입구역', avgMin: 22, maxGapMin: 9 }, placeName: '연남 로스터리', placeId: 'p-roast',
  },
  {
    id: 'm-study', groupId: 'g-uni', title: '스터디 뒤풀이', stage: 'done', bucket: 'active', subText: '합정역 · 9/12', winnerName: '도윤', participants: [do_, me, ji],
    availability: grid('2026-09-11', EVENING, SAT, STUDY_AT), ...on(STUDY_AT), midpoint: { stationName: '합정역', avgMin: 19, maxGapMin: 6 }, placeName: '합정 이자카야', placeId: 'p-hap',
  },
  {
    id: 'm-past', groupId: 'g-uni', title: '여름 방학 번개', stage: 'done', bucket: 'past', subText: '성수역 · 8/3', winnerName: '서아', participants: [seo, me, ji],
    availability: grid('2026-08-01', EVENING, MON, PAST_AT), ...on(PAST_AT), midpoint: { stationName: '성수역', avgMin: 27, maxGapMin: 8 }, placeName: '성수 달빛포차', placeId: 'p-seong',
  },
  // 알림 '필름 동아리 · 10월 MT' 가 여는 약속
  { id: 'm-film', groupId: 'g-film', title: '10월 MT', stage: 'time', bucket: 'active', subText: '4/6 응답 · 마감 D-3', participants: crew, responded: '4/6 응답 · 마감 D-3', availability: grid('2026-10-16', EVENING, MT) },
  {
    id: 'm-lunch', groupId: 'g-lunch', title: '금요일 점심', stage: 'place', bucket: 'active', subText: '장소 투표 중 · 9/25', participants: crew,
    availability: grid('2026-09-23', [11, 12, 13, 14], LUNCH, LUNCH_AT), ...on(LUNCH_AT), midpoint: { stationName: '시청역', avgMin: 12, maxGapMin: 4 },
  },
]

/* ── 장소 (전부 F 화면이 열려요) ── */
interface PlaceSeed {
  id: string; name: string; category: PlaceCategory; district: string; visited: number; daysAsKing: number
  /** 이 장소에서의 모임 방문 수 (많은 순). 1등이 왕 */
  ranking: [groupId: string, visits: number][]
}
const P = (id: string, name: string, category: PlaceCategory, district: string, visited: number, daysAsKing: number, ranking: PlaceSeed['ranking']): PlaceSeed =>
  ({ id, name, category, district, visited, daysAsKing, ranking })

export const places: PlaceSeed[] = [
  // 홍대 · 연남 지도(E)의 왕 5곳
  P('p-wine', '동교동 와인바', '술집', '마포구 동교동', 48, 42, [['g-film', 31], ['g-uni', 29], ['g-lunch', 18]]),
  P('p-roast', '연남 로스터리', '카페', '마포구 연남동', 36, 17, [['g-uni', 23], ['g-film', 19], ['g-board', 11]]),
  P('p-pasta', '서교동 파스타집', '식당', '마포구 서교동', 22, 9, [['g-lunch', 17], ['g-uni', 12], ['g-run', 6]]),
  P('p-comic', '홍대 만화방', '만화카페', '마포구 서교동', 15, 30, [['g-board', 12], ['g-film', 7], ['g-uni', 5]]),
  P('p-cinema', '홍대 시네마', '영화관', '마포구 서교동', 19, 55, [['g-film', 9], ['g-movie', 8], ['g-uni', 3]]),
  // 다른 왕좌들
  P('p-mangwon', '망원 필름카페', '카페', '마포구 망원동', 27, 64, [['g-film', 23], ['g-movie', 15], ['g-uni', 6]]),
  P('p-lp', '상수 LP바', '술집', '마포구 상수동', 12, 21, [['g-movie', 16], ['g-film', 14], ['g-uni', 4]]),
  P('p-hap', '합정 이자카야', '술집', '마포구 합정동', 20, 12, [['g-uni', 14], ['g-board', 9], ['g-run', 5]]),
  P('p-seong', '성수 달빛포차', '술집', '성동구 성수동', 11, 38, [['g-uni', 8], ['g-hike', 7]]),
  P('p-board', '레드버튼 홍대점', '카페', '마포구 서교동', 17, 44, [['g-board', 18], ['g-uni', 3]]),
  // 금요일 저녁 후보 (N)
  P('p-dumpling', '홍대 만두집', '식당', '마포구 서교동', 14, 6, [['g-run', 10], ['g-uni', 4]]),
  P('p-lounge', '와우산 라운지 카페', '카페', '마포구 서교동', 13, 15, [['g-board', 8], ['g-film', 6]]),
  P('p-ramen', '서교 라멘', '식당', '마포구 서교동', 9, 4, [['g-hike', 7], ['g-lunch', 5]]),
  P('p-bakery', '연남 베이커리', '카페', '마포구 연남동', 16, 23, [['g-movie', 9], ['g-uni', 7]]),
  P('p-korean', '동교동 한식당', '식당', '마포구 동교동', 18, 11, [['g-hike', 11], ['g-uni', 6]]),
  P('p-tea', '연희 찻집', '카페', '서대문구 연희동', 8, 19, [['g-movie', 6], ['g-film', 4]]),
  P('p-bbq', '홍대 고깃집', '식당', '마포구 서교동', 21, 8, [['g-run', 13], ['g-uni', 9]]),
  // 금요일 점심 후보 (시청역 주변)
  P('p-cityhall', '시청 국밥집', '식당', '중구 태평로', 25, 27, [['g-run', 22], ['g-lunch', 21]]),
  P('p-mugyo', '무교동 낙지집', '식당', '중구 무교동', 12, 13, [['g-run', 9], ['g-lunch', 7]]),
  P('p-deoksu', '덕수궁 돌담카페', '카페', '중구 정동', 10, 20, [['g-hike', 6], ['g-lunch', 4]]),
]

/** 우리 모임 (왕좌 하이라이트 기준) */
export const MY_GROUP_ID = 'g-uni'

/** 장소 id → 왕 상세. 다른 왕좌 = 같은 왕 모임이 1위인 곳(방문 많은 순) → 2위인 곳(1위와 차이 적은 순) 으로 3개 */
export function placeKing(id: string): PlaceKing | undefined {
  const p = places.find((x) => x.id === id)
  if (!p) return undefined
  const [kingId, kingVisits] = p.ranking[0]
  const rankOf = (q: PlaceSeed) => q.ranking.findIndex(([g]) => g === kingId) + 1
  const others = places.filter((q) => q.id !== id && rankOf(q) > 0 && rankOf(q) <= 2)
    .map((q) => ({ placeId: q.id, placeName: q.name, rank: rankOf(q), visits: q.ranking[rankOf(q) - 1][1], gap: q.ranking[0][1] - q.ranking[rankOf(q) - 1][1] }))
    .sort((a, b) => a.rank - b.rank || a.gap - b.gap || b.visits - a.visits)
    .slice(0, 3)
    .map(({ gap: _gap, ...t }) => t)
  return {
    place: { id: p.id, name: p.name, category: p.category, district: p.district, visitedGroupCount: p.visited, lat: 37.557, lng: 126.924 },
    king: { group: { id: kingId, name: groupName(kingId) }, visits: kingVisits, daysAsKing: p.daysAsKing },
    ranking: p.ranking.map(([gid, v], i) => ({ rank: i + 1, group: { id: gid, name: groupName(gid) }, visits: v })),
    myGroupId: MY_GROUP_ID,
    otherThrones: others,
  }
}

/** E 홍대 · 연남 지도의 왕 핀 (좌표는 피그마 그대로, 왕·방문 수는 장소 데이터에서) */
const PIN_AT: [string, number, number][] = [['p-wine', 110, 193], ['p-roast', 262, 257], ['p-pasta', 160, 407], ['p-comic', 296, 457], ['p-cinema', 86, 537]]
export const hongdaePins: KingPin[] = PIN_AT.map(([id, x, y]) => {
  const k = placeKing(id)!
  return { placeId: id, placeName: k.place.name, category: k.place.category, kingGroupName: k.king.group.name, visits: k.king.visits, mine: k.king.group.id === MY_GROUP_ID || undefined, x, y }
})

/* ── 지도 · 랭킹 ── */
export const districtClusters: DistrictCluster[] = [
  { id: 'd-mapo', name: '마포구', count: 23, hot: true, x: 0.305, y: 0.451 },
  { id: 'd-gangnam', name: '강남구', count: 31, hot: true, x: 0.688, y: 0.617 },
  { id: 'd-jongno', name: '종로구', count: 12, x: 0.502, y: 0.332 },
  { id: 'd-seongdong', name: '성동구', count: 9, x: 0.693, y: 0.451 },
  { id: 'd-songpa', name: '송파구', count: 14, x: 0.856, y: 0.569 },
  { id: 'd-yongsan', name: '용산구', count: 11, x: 0.359, y: 0.576 },
  { id: 'd-nowon', name: '노원구', count: 6, x: 0.769, y: 0.262 },
  { id: 'd-gangseo', name: '강서구', count: 4, x: 0.164, y: 0.533 },
  { id: 'd-gwanak', name: '관악구', count: 5, x: 0.487, y: 0.687 },
  { id: 'd-eunpyeong', name: '은평구', count: 7, x: 0.282, y: 0.311 },
]

export const ranking: RankingEntry[] = [
  { rank: 1, group: { id: 'g-film', name: '필름 동아리' }, kingCount: 14, visits: 212, delta: 0 },
  { rank: 2, group: { id: 'g-uni', name: '대학 동기 모임' }, kingCount: 11, visits: 187, delta: 0 },
  { rank: 3, group: { id: 'g-hike', name: '등산 크루' }, kingCount: 9, visits: 150, delta: 0 },
  { rank: 4, group: { id: 'g-board', name: '보드게임 모임' }, kingCount: 7, visits: 128, delta: 2 },
  { rank: 5, group: { id: 'g-lunch', name: '회사 점심팟' }, kingCount: 6, visits: 97, delta: -1 },
  { rank: 6, group: { id: 'g-movie', name: '영화 동호회' }, kingCount: 5, visits: 88, delta: 1 },
  { rank: 7, group: { id: 'g-run', name: '러닝 크루' }, kingCount: 4, visits: 71, delta: 0 },
]

export const myRank: MyRankSummary = { groupId: 'g-uni', groupName: '대학 동기 모임', rank: 2, kingsToFirst: 3 }
/** 대학 동기 모임의 왕좌: 연남 로스터리 · 합정 이자카야(마포) + 성수 달빛포차(성동) */
export const myThrones: MyThrones = { groupId: 'g-uni', total: 3, groupName: '대학 동기 모임', breakdown: '마포 2 · 성동 1' }

/** 확대 지도가 준비된 지역 (지금은 마포 · 홍대 일대만) */
export const areas: Record<string, Area> = { 'd-mapo': { id: 'd-mapo', name: '홍대 · 연남' }, hongdae: { id: 'hongdae', name: '홍대 · 연남' } }

/* ── M·R 줄다리기 (금요일 저녁) ── */
export const TUG_SECONDS = 42
export const tugBoards: Record<string, Omit<TugBoard, 'stepIdx' | 'pullsUsed' | 'endsAt'> & { startPullsUsed: number }> = {
  'm-fri': {
    meetingId: 'm-fri', origin: { x: 205, y: 300, label: '원래 지점 · 홍대입구' }, myBaseMin: 28, gapLimitMin: 15, pullsTotal: 3,
    startPullsUsed: 1, // 피그마 M: 이미 한 번 당긴 상태 (-4분, 2번 남음)
    players: [
      { member: me, x: 62, y: 146 },
      { member: ji, x: 334, y: 156 },
      { member: do_, x: 326, y: 430 },
      { member: seo, x: 70, y: 420 },
    ],
    steps: [
      {
        stationName: '홍대입구역', avgMin: 24, gapMin: 11, myMin: 24,
        point: { x: 165, y: 258 }, bubble: '합정역 쪽으로 이동 중', bubbleAt: { x: 99, y: 200 },
        deltas: { [me.id]: -4, [ji.id]: 2, [do_.id]: 1, [seo.id]: 1 },
        news: { text: '내가 합정역 쪽으로 한 칸 당겼어요', authorId: me.id },
      },
      {
        stationName: '합정역', avgMin: 23, gapMin: 14, myMin: 21,
        point: { x: 112, y: 208 }, bubble: '합정역 도착!', bubbleAt: { x: 98.5, y: 150 },
        deltas: { [me.id]: -7, [ji.id]: 3, [do_.id]: 2, [seo.id]: 2 },
        news: { text: '내가 한 칸 더 당겼어요! 이제 합정역', authorId: me.id },
      },
    ],
  },
}

/* ── N 후보 장소 (약속별) — 왕 정보는 장소 데이터에서 붙여요 ── */
export interface CandidateSeed { id: string; walkMin: number; note: string; match: number; likes: number; tone: 'light' | 'mid' | 'dark'; pin?: { x: number; y: number } }
export const candidates: Record<string, { mood: string; list: CandidateSeed[] }> = {
  'm-fri': {
    mood: '조용한 분위기',
    list: [
      { id: 'p-pasta', walkMin: 4, note: '리뷰 1.2k', match: 92, likes: 3, tone: 'light', pin: { x: 103, y: 163 } },
      { id: 'p-roast', walkMin: 7, note: '넓은 좌석', match: 88, likes: 2, tone: 'mid', pin: { x: 233, y: 153 } },
      { id: 'p-wine', walkMin: 6, note: '2차 추천', match: 85, likes: 1, tone: 'dark', pin: { x: 283, y: 263 } },
      { id: 'p-dumpling', walkMin: 3, note: '웨이팅 짧음', match: 81, likes: 1, tone: 'mid', pin: { x: 73, y: 243 } },
      { id: 'p-lounge', walkMin: 5, note: '콘센트 많음', match: 79, likes: 0, tone: 'light', pin: { x: 133, y: 283 } },
      { id: 'p-hap', walkMin: 9, note: '룸 있음', match: 77, likes: 0, tone: 'dark' },
      { id: 'p-ramen', walkMin: 5, note: '혼밥 좌석', match: 74, likes: 0, tone: 'mid' },
      { id: 'p-bakery', walkMin: 8, note: '테라스', match: 72, likes: 0, tone: 'light' },
      { id: 'p-lp', walkMin: 10, note: '조용한 음악', match: 70, likes: 0, tone: 'dark' },
      { id: 'p-korean', walkMin: 6, note: '단체석', match: 68, likes: 0, tone: 'mid' },
      { id: 'p-tea', walkMin: 11, note: '좌식', match: 65, likes: 0, tone: 'light' },
      { id: 'p-bbq', walkMin: 4, note: '늦게까지', match: 63, likes: 0, tone: 'dark' },
    ],
  },
  'm-lunch': {
    mood: '빠른 점심',
    list: [
      { id: 'p-cityhall', walkMin: 3, note: '회전 빠름', match: 90, likes: 2, tone: 'mid', pin: { x: 103, y: 163 } },
      { id: 'p-mugyo', walkMin: 5, note: '매운맛 조절', match: 84, likes: 1, tone: 'dark', pin: { x: 233, y: 153 } },
      { id: 'p-deoksu', walkMin: 6, note: '디저트', match: 78, likes: 0, tone: 'light', pin: { x: 283, y: 263 } },
    ],
  },
}

/* ── P 투표 (다른 사람 표 · 내 표) ── */
export const voteSeeds: Record<string, { deadlineLabel: string; myChoice?: string; others: [placeId: string, voters: Member[]][] }> = {
  'm-fri': { deadlineLabel: '오늘 19:00 마감', myChoice: 'p-roast', others: [['p-roast', [do_, seo]], ['p-pasta', [ha]], ['p-wine', []]] },
  'm-lunch': { deadlineLabel: '오늘 11:30 마감', others: [['p-cityhall', [ji]], ['p-mugyo', [do_]], ['p-deoksu', [seo]]] },
}

/* ── O 채팅 ── */
export const chatSeeds: Record<string, ChatMessage[]> = {
  'm-fri': [
    { id: 'c1', kind: 'system', text: '은수님이 한 칸 당겼어요 (-4분)' },
    { id: 'c2', kind: 'text', author: ji, text: '아 나 멀어지잖아ㅠㅠ', sentAt: 0 },
    { id: 'c3', kind: 'text', author: me, text: '공정성 게이지 아직 여유 있음ㅋㅋ', sentAt: 0 },
    { id: 'c4', kind: 'place', author: do_, sentAt: 0, place: { placeId: 'p-roast', name: '연남 로스터리', category: '카페', walkMin: 7, kingGroupName: '대학 동기 모임' } },
    { id: 'c5', kind: 'text', author: do_, text: '여기 우리 왕좌 지켜야 함', sentAt: 0 },
    { id: 'c6', kind: 'text', author: me, text: 'ㅇㅈ 여기로 가자', sentAt: 0 },
  ],
}

/* ── H 알림 · I 마이 · J 설정 ── */
export const alerts: AlertItem[] = [
  { id: 'a-1', kind: 'throneLost', category: '랭킹', title: '왕좌를 빼앗겼어요!', body: '동교동 와인바 · 필름 동아리가 2회 차이로 역전', timeLabel: '10분 전', section: '오늘', read: false, to: '/place/p-wine' },
  { id: 'a-2', kind: 'tug', category: '약속', title: '줄다리기가 시작됐어요', body: '금요일 저녁 · 마감 전에 당겨주세요', timeLabel: '32분 전', section: '오늘', read: false, to: '/meet/m-fri/tug' },
  { id: 'a-3', kind: 'depart', category: '약속', title: '출발 알림', body: '18:12에 출발해야 늦지 않아요', timeLabel: '1시간 전', section: '오늘', read: false, to: '/meet/m-fri' },
  { id: 'a-4', kind: 'invite', category: '약속', title: '약속 초대', body: '필름 동아리 · 10월 MT 가능한 시간을 입력해주세요', timeLabel: '어제', section: '이번 주', read: true, to: '/meet/m-film' },
  { id: 'a-5', kind: 'throneWon', category: '모임', title: '왕좌 획득', body: '대학 동기 모임이 합정 이자카야의 왕이 됐어요', timeLabel: '2일 전', section: '이번 주', read: true, to: '/place/p-hap' },
  { id: 'a-6', kind: 'rankUp', category: '랭킹', title: '랭킹 상승', body: '대학 동기 모임 3위 → 2위', timeLabel: '3일 전', section: '이번 주', read: true, to: '/ranking/list' },
]

export const profile: Omit<MyProfile, 'groupCount' | 'mainTitle'> = {
  member: me,
  handle: 'eunsu',
  joinedYear: 2024,
  stats: { meetings: 38, avgLateMin: 3, raceWins: 12 },
  titles: ['지각 0회 5연속', '줄다리기 장인', '왕좌 수집가'],
  topPlace: { name: '홍대입구', visits: 14, areaId: 'hongdae' },
}

export const settings: Settings = { depart: true, coaching: true, throne: true, tug: false, publicRanking: true, locationShare: '출발 1시간 전부터', map: '카카오맵' }

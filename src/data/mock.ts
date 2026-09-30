import type { Area, DistrictCluster, Group, KingPin, Meeting, Member, MyRankSummary, MyThrones, PlaceKing, RankingEntry } from './types'

/* 가짜 데이터 — 피그마 시안의 내용을 그대로 옮겼어요. 백엔드가 붙으면 사용하지 않아요. */

export const me: Member = { id: 'u-eunsu', name: '은수', color: 'lime' }
const ji: Member = { id: 'u-jimin', name: '지민', color: 'yellow' }
const do_: Member = { id: 'u-doyun', name: '도윤', color: 'blue' }
const seo: Member = { id: 'u-seoa', name: '서아', color: 'pink' }
const ha: Member = { id: 'u-hajun', name: '하준', color: 'purple' }
const trio = [ji, do_, seo]

export const groups: Group[] = [
  { id: 'g-uni', name: '대학 동기 모임', category: '친구', members: [me, ji, do_, seo, ha], memberCount: 6, since: 2021, kingCount: 3, meetingCount: 24, avgLateMin: 4, statusText: '다음 약속 · 금 19:00' },
  { id: 'g-film', name: '필름 동아리', category: '동아리', members: trio, memberCount: 8, since: 2022, kingCount: 5, meetingCount: 31, avgLateMin: 6, statusText: '시간 정하는 중 · 4/6' },
  { id: 'g-lunch', name: '회사 점심팟', category: '회사', members: trio, memberCount: 5, since: 2024, kingCount: 1, meetingCount: 18, avgLateMin: 2, statusText: '장소 투표 중' },
  { id: 'g-high', name: '고등학교 친구들', category: '친구', members: trio, memberCount: 4, since: 2019, kingCount: 0, meetingCount: 9, avgLateMin: 11, statusText: '약속 없음 · 12일 전' },
]

const grid = (ratio: number[][], picked?: [number, number]) => ({ days: ['금 25', '토 26', '일 27'], hours: [17, 18, 19, 20, 21, 22], ratio, picked })
const FRI = [[0.26, 0.45, 0.63], [0.54, 0.63, 0.45], [1, 0.63, 0.26], [1, 0.82, 0.26], [0.63, 0.45, 0.17], [0.26, 0.26, 0.17]]
const MT = [[0.17, 0.5, 0.67], [0.33, 0.67, 0.83], [0.5, 1, 0.67], [0.33, 0.83, 0.5], [0.17, 0.5, 0.33], [0, 0.17, 0.17]]

export const meetings: Meeting[] = [
  {
    id: 'm-fri', groupId: 'g-uni', title: '금요일 저녁', stage: 'tug', bucket: 'active', subText: '홍대입구 부근 · 9/25',
    participants: [me, ji, do_, seo],
    availability: grid(FRI, [2, 0]),
    timeConfirmedLabel: '금 19:00 확정',
    midpoint: { stationName: '홍대입구역', avgMin: 24, maxGapMin: 7 },
  },
  { id: 'm-mt', groupId: 'g-uni', title: '10월 MT', stage: 'time', bucket: 'active', subText: '4/6 응답 · 마감 D-2', participants: [me, ji, do_, seo], responded: '4/6 응답 · 마감 D-2', availability: grid(MT) },
  { id: 'm-bday', groupId: 'g-uni', title: '생일 파티', stage: 'confirmed', bucket: 'active', subText: '연남 로스터리 · 10/12', participants: [me, ji, do_, seo], availability: grid(FRI, [3, 1]), timeConfirmedLabel: '토 20:00 확정', midpoint: { stationName: '홍대입구역', avgMin: 22, maxGapMin: 9 }, placeName: '연남 로스터리' },
  { id: 'm-study', groupId: 'g-uni', title: '스터디 뒤풀이', stage: 'done', bucket: 'active', subText: '합정역 · 9/12', winnerName: '도윤', participants: [do_, me, ji], availability: grid(FRI, [2, 0]), timeConfirmedLabel: '금 19:00 확정', midpoint: { stationName: '합정역', avgMin: 19, maxGapMin: 6 }, placeName: '합정 이자카야' },
  { id: 'm-past', groupId: 'g-uni', title: '여름 방학 번개', stage: 'done', bucket: 'past', subText: '성수역 · 8/3', winnerName: '서아', participants: [seo, me, ji], availability: grid(FRI, [3, 0]), timeConfirmedLabel: '금 20:00 확정', midpoint: { stationName: '성수역', avgMin: 27, maxGapMin: 8 }, placeName: '성수 달빛포차' },
  { id: 'm-film', groupId: 'g-film', title: '10월 정기 상영회', stage: 'time', bucket: 'active', subText: '4/6 응답 · 마감 D-3', participants: trio, responded: '4/6 응답 · 마감 D-3', availability: grid(MT) },
  { id: 'm-lunch', groupId: 'g-lunch', title: '금요일 점심', stage: 'place', bucket: 'active', subText: '장소 투표 중 · 9/26', participants: trio, availability: grid(FRI, [0, 0]), timeConfirmedLabel: '금 12:00 확정', midpoint: { stationName: '시청역', avgMin: 12, maxGapMin: 4 } },
]

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

export const hongdaePins: KingPin[] = [
  { placeId: 'p-wine', placeName: '동교동 와인바', category: '술집', kingGroupName: '필름 동아리', visits: 31, x: 110, y: 193 },
  { placeId: 'p-roast', placeName: '연남 로스터리', category: '카페', kingGroupName: '대학 동기 모임', visits: 23, mine: true, x: 262, y: 257 },
  { placeId: 'p-pasta', placeName: '서교동 파스타집', category: '식당', kingGroupName: '회사 점심팟', visits: 17, x: 160, y: 407 },
  { placeId: 'p-comic', placeName: '홍대 만화방', category: '만화카페', kingGroupName: '보드게임 모임', visits: 12, x: 296, y: 457 },
  { placeId: 'p-cinema', placeName: '홍대 시네마', category: '영화관', kingGroupName: '필름 동아리', visits: 9, x: 86, y: 537 },
]

const kingOf = (
  id: string, name: string, category: PlaceKing['place']['category'], district: string, visited: number,
  king: [string, string], visits: number, days: number, ranking: [string, string, number][], others: PlaceKing['otherThrones'],
): PlaceKing => ({
  place: { id, name, category, district, visitedGroupCount: visited, lat: 37.557, lng: 126.924 },
  king: { group: { id: king[0], name: king[1] }, visits, daysAsKing: days },
  ranking: ranking.map(([gid, gname, v], i) => ({ rank: i + 1, group: { id: gid, name: gname }, visits: v })),
  myGroupId: 'g-uni',
  otherThrones: others,
})
export const placeKings: Record<string, PlaceKing> = {
  'p-wine': kingOf('p-wine', '동교동 와인바', '술집', '마포구 동교동', 48, ['g-film', '필름 동아리'], 31, 42,
    [['g-film', '필름 동아리', 31], ['g-uni', '대학 동기 모임', 29], ['g-lunch', '회사 점심팟', 18]],
    [{ placeId: 'p-mangwon', placeName: '망원 필름카페', rank: 1, visits: 23 }, { placeId: 'p-cinema', placeName: '홍대 시네마', rank: 1, visits: 9 }, { placeId: 'p-lp', placeName: '상수 LP바', rank: 2, visits: 14 }]),
  'p-mangwon': kingOf('p-mangwon', '망원 필름카페', '카페', '마포구 망원동', 27, ['g-film', '필름 동아리'], 23, 64,
    [['g-film', '필름 동아리', 23], ['g-movie', '영화 동호회', 15], ['g-uni', '대학 동기 모임', 6]],
    [{ placeId: 'p-wine', placeName: '동교동 와인바', rank: 1, visits: 31 }, { placeId: 'p-cinema', placeName: '홍대 시네마', rank: 1, visits: 9 }, { placeId: 'p-lp', placeName: '상수 LP바', rank: 2, visits: 14 }]),
  'p-roast': kingOf('p-roast', '연남 로스터리', '카페', '마포구 연남동', 36, ['g-uni', '대학 동기 모임'], 23, 17,
    [['g-uni', '대학 동기 모임', 23], ['g-film', '필름 동아리', 19], ['g-board', '보드게임 모임', 11]],
    [{ placeId: 'p-hap', placeName: '합정 이자카야', rank: 1, visits: 14 }, { placeId: 'p-seong', placeName: '성수 달빛포차', rank: 1, visits: 8 }, { placeId: 'p-wine', placeName: '동교동 와인바', rank: 2, visits: 29 }]),
  'p-pasta': kingOf('p-pasta', '서교동 파스타집', '식당', '마포구 서교동', 22, ['g-lunch', '회사 점심팟'], 17, 9,
    [['g-lunch', '회사 점심팟', 17], ['g-uni', '대학 동기 모임', 12], ['g-run', '러닝 크루', 6]],
    [{ placeId: 'p-cityhall', placeName: '시청 국밥집', rank: 1, visits: 21 }]),
  'p-comic': kingOf('p-comic', '홍대 만화방', '만화카페', '마포구 서교동', 15, ['g-board', '보드게임 모임'], 12, 30,
    [['g-board', '보드게임 모임', 12], ['g-film', '필름 동아리', 7], ['g-uni', '대학 동기 모임', 5]],
    [{ placeId: 'p-board', placeName: '레드버튼 홍대점', rank: 1, visits: 18 }]),
  'p-cinema': kingOf('p-cinema', '홍대 시네마', '영화관', '마포구 서교동', 19, ['g-film', '필름 동아리'], 9, 55,
    [['g-film', '필름 동아리', 9], ['g-movie', '영화 동호회', 8], ['g-uni', '대학 동기 모임', 3]],
    [{ placeId: 'p-wine', placeName: '동교동 와인바', rank: 1, visits: 31 }, { placeId: 'p-mangwon', placeName: '망원 필름카페', rank: 1, visits: 23 }, { placeId: 'p-lp', placeName: '상수 LP바', rank: 2, visits: 14 }]),
  'p-lp': kingOf('p-lp', '상수 LP바', '술집', '마포구 상수동', 12, ['g-movie', '영화 동호회'], 16, 21,
    [['g-movie', '영화 동호회', 16], ['g-film', '필름 동아리', 14], ['g-uni', '대학 동기 모임', 4]],
    [{ placeId: 'p-cinema', placeName: '홍대 시네마', rank: 2, visits: 8 }]),
}

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
export const myThrones: MyThrones = { groupId: 'g-uni', total: 3, groupName: '대학 동기 모임', breakdown: '마포 2 · 성동 1' }

/** 확대 지도가 준비된 지역 (지금은 마포 · 홍대 일대만) */
export const areas: Record<string, Area> = { 'd-mapo': { id: 'd-mapo', name: '홍대 · 연남' }, hongdae: { id: 'hongdae', name: '홍대 · 연남' } }

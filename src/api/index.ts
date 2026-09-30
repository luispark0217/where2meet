/* ─────────────────────────────────────────────
   데이터 가져오는 곳 (API 연결 지점)
   지금은 가짜 데이터를 돌려줘요.
   재운: 각 함수 안을 fetch('/api/...') 로 바꾸면 화면은 손대지 않아도 돼요.
   ───────────────────────────────────────────── */
import * as mock from '../data/mock'
import type { Area, DistrictCluster, Group, KingPin, Meeting, Member, MyRankSummary, MyThrones, PlaceKing, RankingEntry } from '../data/types'

const delay = <T,>(v: T, ms = 0) => new Promise<T>((r) => setTimeout(() => r(v), ms))

export const api = {
  /** 로그인한 나 — GET /api/me */
  me: (): Promise<Member> => delay(mock.me),

  /** 내 모임 목록 — GET /api/groups */
  myGroups: (): Promise<Group[]> => delay(mock.groups),

  /** 모임 상세 — GET /api/groups/:id */
  group: (id: string): Promise<Group | undefined> => delay(mock.groups.find((g) => g.id === id)),

  /** 모임의 약속들 — GET /api/groups/:id/meetings */
  groupMeetings: (groupId: string): Promise<Meeting[]> => delay(mock.meetings.filter((m) => m.groupId === groupId)),

  /** 약속 상세 — GET /api/meetings/:id */
  meeting: (id: string): Promise<Meeting | undefined> => {
    const m = mock.meetings.find((x) => x.id === id)
    // 가짜 데이터: 줄다리기 마감을 '지금부터 42초 뒤'로 매번 새로 잡아요
    return delay(m && m.stage === 'tug' && m.midpoint ? { ...m, midpoint: { ...m.midpoint, tugEndsAt: Date.now() + 42_000 } } : m)
  },

  /** 서울 전체 지도의 구별 왕좌 수 — GET /api/ranking/districts */
  districtClusters: (): Promise<DistrictCluster[]> => delay(mock.districtClusters),

  /** 내 모임이 가진 왕 자리 요약 — GET /api/me/thrones */
  myThrones: (): Promise<MyThrones> => delay(mock.myThrones),

  /** 확대 지역 정보 — GET /api/areas/:area  (없는 지역이면 이름만 구 이름으로) */
  area: (area: string): Promise<Area | undefined> => {
    const c = mock.districtClusters.find((d) => d.id === area)
    return delay(mock.areas[area] ?? (c ? { id: c.id, name: c.name } : undefined))
  },

  /** 확대 지역의 왕 핀들 — GET /api/areas/:area/kings */
  areaKings: (area: string): Promise<KingPin[]> => delay(mock.areas[area] ? mock.hongdaePins : []),

  /** 장소의 왕과 순위 — GET /api/places/:id/king */
  placeKing: (placeId: string): Promise<PlaceKing | undefined> => delay(mock.placeKings[placeId]),

  /** 전체 모임 랭킹 — GET /api/ranking?type=group|category|local */
  ranking: (_type: 'group' | 'category' | 'local' = 'group'): Promise<RankingEntry[]> => delay(mock.ranking),

  /** 내 모임 순위 요약 — GET /api/me/rank */
  myRank: (): Promise<MyRankSummary> => delay(mock.myRank),
}

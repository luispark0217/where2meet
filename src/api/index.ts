/* ─────────────────────────────────────────────
   데이터 가져오는 곳 (API 연결 지점) — A~G 화면 + 공통(나 · 모임 · 약속 · 장소)
   지금은 가짜 데이터를 돌려줘요. 바뀌는 값은 ./store.ts 한 곳에 있어요.
   재운: 이 파일과 tug.ts · me.ts · social.ts 의 함수 안을 fetch('/api/...') 로 바꾸면
        화면은 손대지 않아도 돼요. (store.ts · data/mock.ts 는 그때 지워요)
   ───────────────────────────────────────────── */
import * as mock from '../data/mock'
import type { Area, DistrictCluster, Group, KingPin, Meeting, Member, MyRankSummary, MyThrones, PlaceKing, RankingEntry } from '../data/types'
import { db, findGroup, findMeeting, meetingView } from './store'

/** 가짜 지연 (ms). 느린 네트워크를 흉내내려면 숫자를 키워요 */
const MOCK_DELAY = 0
export const delay = <T,>(v: T, ms = MOCK_DELAY) => new Promise<T>((r) => setTimeout(() => r(v), ms))

export const api = {
  /** 로그인한 나 — GET /api/me */
  me: (): Promise<Member> => delay(mock.me),

  /** 내 모임 목록 (내 역할 포함) — GET /api/groups */
  myGroups: (): Promise<Group[]> => delay(db.groups.map((g) => ({ ...g }))),

  /** 모임 상세 — GET /api/groups/:id */
  group: (id: string): Promise<Group | undefined> => delay(findGroup(id)),

  /** 모임의 약속들 — GET /api/groups/:id/meetings */
  groupMeetings: (groupId: string): Promise<Meeting[]> => delay(db.meetings.filter((m) => m.groupId === groupId).map(meetingView)),

  /** 약속 상세 — GET /api/meetings/:id (줄다리기 중이면 midpoint 가 지금 판 상태) */
  meeting: (id: string): Promise<Meeting | undefined> => {
    const m = findMeeting(id)
    return delay(m && meetingView(m))
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

  /** 확대 지역의 왕 핀들 — GET /api/areas/:area/kings (준비 안 된 지역은 빈 배열) */
  areaKings: (area: string): Promise<KingPin[]> => delay(mock.areas[area] ? mock.hongdaePins : []),

  /** 장소의 왕과 순위 — GET /api/places/:id/king */
  placeKing: (placeId: string): Promise<PlaceKing | undefined> => delay(mock.placeKing(placeId)),

  /** 전체 모임 랭킹 — GET /api/ranking?type=group|category|local */
  ranking: (_type: 'group' | 'category' | 'local' = 'group'): Promise<RankingEntry[]> => delay(mock.ranking),

  /** 내 모임 순위 요약 — GET /api/me/rank */
  myRank: (): Promise<MyRankSummary> => delay(mock.myRank),
}

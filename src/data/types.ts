/* ─────────────────────────────────────────────
   화면이 필요로 하는 데이터 모양 (백엔드와의 약속)
   재운: 서버 응답을 이 모양에 맞춰주면 화면은 그대로 돌아가요.
   ───────────────────────────────────────────── */

export type ID = string

export type AvatarColor = 'lime' | 'yellow' | 'blue' | 'pink' | 'purple'

export interface Member {
  id: ID
  name: string            // "은수"
  color: AvatarColor
  photoUrl?: string | null
}

export type GroupCategory = '친구' | '동아리' | '회사' | '가족'

/** 모임 (예: 대학 동기 모임) */
export interface Group {
  id: ID
  name: string
  category: GroupCategory
  photoUrl?: string | null
  members: Member[]
  memberCount: number
  since: number           // 결성 연도 (2021)
  kingCount: number       // 왕 자리 수
  meetingCount: number    // 누적 약속 수
  avgLateMin: number      // 평균 지각(분)
  /** 카드 아래 한 줄 상태 문구. 예: "다음 약속 · 금 19:00" */
  statusText: string
}

export type MeetingStage = 'time' | 'place' | 'tug' | 'confirmed' | 'done'

/** 약속 (예: 금요일 저녁) */
export interface Meeting {
  id: ID
  groupId: ID
  title: string
  stage: MeetingStage
  bucket: 'active' | 'upcoming' | 'past'   // 진행 중 / 예정 / 지난
  subText: string          // "홍대입구 부근 · 9/25"
  placePhotoUrl?: string | null
  winnerName?: string      // 완료된 약속의 1등
  participants: Member[]
  /** 시간 조율 표: days x hours, 값은 0~1 (가능한 사람 비율) */
  availability?: { days: string[]; hours: number[]; ratio: number[][]; picked?: [number, number] }
  timeConfirmedLabel?: string  // "금 19:00 확정" (없으면 아직 시간 투표 중)
  placeName?: string           // 확정된 가게 이름
  responded?: string           // "4/6 응답 · 마감 D-2"
  midpoint?: {
    stationName: string        // "홍대입구역"
    avgMin: number
    maxGapMin: number
    tugEndsAt?: number         // 줄다리기 마감 시각 (ms)
  }
}

export type PlaceCategory = '술집' | '카페' | '식당' | '만화카페' | '영화관'

export interface Place {
  id: ID
  name: string              // "동교동 와인바"
  category: PlaceCategory
  district: string          // "마포구 동교동"
  photoUrl?: string | null
  visitedGroupCount: number // 방문한 모임 수
  lat: number
  lng: number
}

/** 한 장소에서의 모임 순위 */
export interface PlaceRankEntry {
  rank: number
  group: Pick<Group, 'id' | 'name' | 'photoUrl'>
  visits: number
}

export interface PlaceKing {
  place: Place
  king: { group: Pick<Group, 'id' | 'name' | 'photoUrl'>; visits: number; daysAsKing: number }
  ranking: PlaceRankEntry[]
  /** 내 모임이 들어 있으면 하이라이트 */
  myGroupId?: ID
  otherThrones: { placeId: ID; placeName: string; rank: number; visits: number }[]
}

/** 지도 위 구 단위 묶음 (서울 전체 보기) */
/** 우리 모임 왕 자리 요약 (지도 아래 카드) */
export interface MyThrones {
  groupId: ID
  groupName: string
  total: number
  breakdown: string   // "마포 2 · 성동 1"
}

/** 확대 지역 정보 */
export interface Area {
  id: ID
  name: string        // "홍대 · 연남"
}

export interface DistrictCluster {
  id: ID
  name: string        // "마포구"
  count: number       // 왕좌 수
  hot?: boolean       // 크게 표시 (후광)
  /** 지도 좌표 (0~1, 지도 박스 기준) — 카카오맵 연결 시 lat/lng 로 교체 */
  x: number
  y: number
}

/** 지도 위 왕 핀 (확대 보기) */
export interface KingPin {
  placeId: ID
  placeName: string
  category: PlaceCategory
  kingGroupName: string
  kingPhotoUrl?: string | null
  visits: number
  mine?: boolean
  x: number
  y: number
}

export interface RankingEntry {
  rank: number
  group: Pick<Group, 'id' | 'name' | 'photoUrl'>
  kingCount: number
  visits: number
  delta: number        // 순위 변동 (+2, -1, 0)
}

export interface MyRankSummary {
  groupId: ID
  groupName: string
  rank: number
  kingsToFirst: number
}

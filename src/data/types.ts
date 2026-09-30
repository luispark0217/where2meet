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

export type GroupCategory = '친구' | '동아리' | '회사' | '가족' | '기타'

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
  /** 이 모임에서 내 역할 (마이 화면) */
  myRole?: '방장' | '멤버'
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
  /** 확정된 날짜·시각 (ISO, +09:00). 시간 투표 중이면 없음 */
  scheduledAt?: string
  placeName?: string           // 확정된 가게 이름 (또는 '여기서 약속 잡기'로 정해 둔 가게)
  placeId?: ID                 // 그 가게 id — 누르면 /place/:id
  responded?: string           // "4/6 응답 · 마감 D-2"
  midpoint?: {
    stationName: string        // "홍대입구역"
    avgMin: number
    maxGapMin: number
    tugEndsAt?: number         // 줄다리기 마감 시각 (ms) — GET /meetings/:id/tug 의 endsAt 과 같은 값 (거울)
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

/* ─────────────────────────────────────────────
   H~S 화면(새 화면)의 데이터 모양
   @mock-only 표시가 있는 필드는 지금 그림 좌표·문구라서, 서버는 lat/lng·ISO·id 로 주면 돼요.
   ───────────────────────────────────────────── */

/* ── M·R 줄다리기 ── */

/** 줄다리기 판 위의 한 사람 */
export interface TugPlayer {
  member: Member
  /** @mock-only 지도판(390×560) 위 아바타 가운데 좌표 */
  x: number
  y: number
}

/** 한 번 당길 때마다 바뀌는 판 상태 */
export interface TugStep {
  stationName: string               // 지금 중간 지점에 가장 가까운 역 "합정역"
  avgMin: number                    // 평균 이동시간
  gapMin: number                    // 최대 차이
  myMin: number                     // 내 이동시간 (지금)
  deltas: Record<ID, number>        // member.id → 원래 지점 대비 이동시간 변화 (음수 = 가까워짐)
  bubble: string                    // @mock-only "합정역 쪽으로 이동 중"
  point: { x: number; y: number }   // @mock-only 지금 중간 지점 좌표
  bubbleAt: { x: number; y: number } // @mock-only 말풍선 왼쪽 위
  /** 최근 소식 한 줄 — 색은 authorId 의 아바타 색 */
  news: { text: string; authorId: ID }
}

export interface TugBoard {
  meetingId: ID
  origin: { x: number; y: number; label: string }   // @mock-only 원래 중간 지점
  myBaseMin: number                 // 원래 내 이동시간 (28분)
  gapLimitMin: number               // 공정성 한도 (15분)
  pullsTotal: number                // 한 사람당 당기기 횟수
  pullsUsed: number                 // 내가 이미 쓴 당기기 수
  players: TugPlayer[]
  /** 지금까지의 판 상태들. 지금 = steps[stepIdx] */
  steps: TugStep[]
  stepIdx: number
  endsAt: number                    // 마감 시각 (ms) — 약속 하나에 하나, 처음 한 번만 정해져요
}

/* ── N 장소 리스트 · P 투표 ── */

export interface CandidatePlace {
  id: ID
  name: string
  category: PlaceCategory
  walkMin: number
  note: string              // "리뷰 1.2k" · "넓은 좌석"
  match: number             // 취향 일치 %
  /** 이 장소의 왕 모임 — 우리 모임과 왕좌 싸움이 걸린 곳(우리가 왕 / 2회 차이 이내)만 채워요 */
  kingGroupId?: ID
  kingGroupName?: string
  kingIsUs?: boolean        // 우리 모임이 왕인 곳 (지도 핀에 왕관)
  likes: number
  liked?: boolean           // 내가 찜했는지
  photoUrl?: string | null
  /** 사진 자리표시 톤 (사진이 없을 때) */
  tone: 'light' | 'mid' | 'dark'
  /** @mock-only 지도판(390×400) 핀 위치 — 없으면 지도에 안 보여요 */
  pin?: { x: number; y: number }
}

export interface PlaceListInfo {
  meetingId: ID
  title: string             // "금요일 저녁"
  areaLabel: string         // "홍대입구 주변" (지금 중간 지점 기준)
  mood: string              // "조용한 분위기"
  /** 확정된 장소 (확정 뒤에만) */
  confirmed?: { placeId: ID; name: string }
  places: CandidatePlace[]
}

export interface VoteOption {
  place: Pick<CandidatePlace, 'id' | 'name' | 'category' | 'walkMin' | 'match' | 'kingGroupName' | 'photoUrl' | 'tone'>
  voters: Member[]
}

export interface PlaceVoteInfo {
  meetingId: ID
  memberCount: number       // 6
  deadlineLabel: string     // @mock-only "오늘 19:00 마감" → 서버는 deadlineAt(ISO)
  me: Member
  myChoice?: ID             // 내가 고른 장소 id
  confirmedPlaceId?: ID     // 이미 확정됐으면
  options: VoteOption[]
}

/* ── H 알림 · I 마이 · J 설정 ── */

/** 알림 종류 → 아이콘 */
export type AlertKind = 'throneLost' | 'tug' | 'depart' | 'invite' | 'throneWon' | 'rankUp'
/** 알림 거르기 칩 */
export type AlertCategory = '약속' | '랭킹' | '모임'

export interface AlertItem {
  id: ID
  kind: AlertKind
  category: AlertCategory
  title: string            // "왕좌를 빼앗겼어요!"
  body: string             // "동교동 와인바 · 필름 동아리가 2회 차이로 역전"
  timeLabel: string        // @mock-only "10분 전" → 서버는 createdAt(ISO)
  section: '오늘' | '이번 주' | '지난 알림'  // @mock-only createdAt 으로 화면이 나눠요
  read: boolean
  /** 누르면 이동할 화면 (#/ 뒤 주소) */
  to: string
}

export interface MyProfile {
  member: Member
  handle: string           // "eunsu"
  groupCount: number
  joinedYear: number
  stats: { meetings: number; avgLateMin: number; raceWins: number }
  /** 내 칭호. 첫 번째가 대표 칭호 */
  titles: string[]
  mainTitle: string
  /** 가장 많이 간 곳 (지역) */
  topPlace: { name: string; visits: number; areaId: ID }
}

export type SettingKey = 'depart' | 'coaching' | 'throne' | 'tug' | 'publicRanking'
export type Settings = Record<SettingKey, boolean> & {
  locationShare: string    // "출발 1시간 전부터"
  map: string              // "카카오맵"
}

/* ── O 채팅 · S 공유 · L 도전 · K·Q 만들기 ── */

export interface SharedPlace {
  placeId: ID
  name: string              // "연남 로스터리"
  category: PlaceCategory
  walkMin: number           // 도보 7분
  kingGroupName?: string    // "대학 동기 모임" (왕이 있으면)
  photoUrl?: string | null
}

/** 채팅 메시지 */
export type ChatMessage =
  | { id: ID; kind: 'system'; text: string }                                   // "은수님이 한 칸 당겼어요 (-4분)"
  | { id: ID; kind: 'text'; author: Member; text: string; sentAt: number }
  | { id: ID; kind: 'place'; author: Member; sentAt: number; place: SharedPlace } // 장소 공유 카드

export interface ChatRoom {
  meetingId: ID
  title: string             // "금요일 저녁"
  groupName: string         // "대학 동기 모임"
  memberCount: number
  stage: MeetingStage
  /** 위쪽 라임 띠 — 줄다리기 진행 상태 (줄다리기 중인 약속만) */
  tug?: { endsAt: number; towards: string; arrived: boolean }
  /** 위쪽 라임 띠 — 장소가 확정된 약속 */
  confirmed?: { placeId: ID; name: string; whenLabel: string }
  messages: ChatMessage[]
  /** 약속 단계에 맞는 빠른 답장 */
  quickReplies: string[]
}

/** 공유하기 시트 미리보기 */
export interface ShareInfo {
  meetingId: ID
  title: string             // "금요일 저녁"
  groupName: string
  whenWhere: string         // @mock-only "9/25 (금) 19:00 · 홍대입구역" → 서버는 scheduledAt + place/station
  url: string               // "https://where2meet.app/p/xk29"
  photoUrl?: string | null
}

/** 왕좌 도전 (내 모임이 왕이면 '지키기') */
export interface ThroneChallenge {
  place: { id: ID; name: string; category: PlaceCategory; district: string; photoUrl?: string | null }
  king: { groupId: ID; name: string; visits: number; photoUrl?: string | null }
  mine: { groupId: ID; name: string; visits: number; photoUrl?: string | null }
  /** 내 모임이 왕일 때 뒤쫓는 2위 모임 */
  rival?: { groupId: ID; name: string; visits: number; photoUrl?: string | null }
  /** 역전까지 필요한 방문 수 (0 이면 이미 왕) */
  toOvertake: number
  /** 이 장소 왕좌 알림을 받는 중인지 */
  watching: boolean
  rules: { badge: string; text: string }[]
}

/** 새 모임 만들기 화면 초기값 */
export interface NewGroupDraft {
  categories: GroupCategory[]
  invitees: Member[]        // 이미 초대된 사람 (나 포함)
  inviteUrl: string
}

export interface NewGroupInput {
  name: string
  category: GroupCategory
  memberIds: ID[]
  joinRanking: boolean
  photo?: File | null
}

export interface NewMeetingInput {
  groupId: ID
  /** L '여기서 약속 잡기'로 들어오면 그 장소 */
  placeId?: ID
}

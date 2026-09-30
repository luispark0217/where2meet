/* ─────────────────────────────────────────────
   types v2 제안 (docs 전용 — src/data/types.ts 를 대체하지 않음)
   원칙
   1) 서버는 "원본 데이터"만 보낸다. 문구("다음 약속 · 금 19:00")는 화면이 만든다.
   2) 시각은 모두 ISO 8601 문자열 (KST 오프셋 포함, 예 "2026-09-25T19:00:00+09:00").
   3) 위치는 lat/lng (WGS84). 화면 픽셀 x/y 는 서버가 절대 보내지 않는다.
   4) 사람·모임·장소를 가리킬 때는 이름만이 아니라 id 를 같이 보낸다.
   5) v1 필드는 옮겨가는 동안 @deprecated 로 남겨도 된다.
   ───────────────────────────────────────────── */

export type ID = string
/** ISO 8601, 예 "2026-09-25T19:00:00+09:00" */
export type ISODateTime = string
/** "2026-09-25" */
export type ISODate = string

export interface LatLng { lat: number; lng: number }

/* ── 공통 ─────────────────────────────────── */

export interface Page<T> {
  items: T[]
  /** 다음 페이지가 없으면 null */
  nextCursor: string | null
  total?: number
}

export interface ApiErrorBody {
  error: {
    /** 기계가 읽는 코드 — 화면 분기용 */
    code:
      | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION'
      | 'CONFLICT' | 'RATE_LIMITED' | 'DEADLINE_PASSED'
      | 'CHECKIN_TOO_FAR' | 'CHECKIN_OUT_OF_TIME' | 'CHECKIN_DUPLICATE'
      | 'CHECKIN_LOW_ACCURACY' | 'CHECKIN_NO_LOCATION' | 'INTERNAL'
    /** 사람이 읽는 한국어 문구 — 토스트에 그대로 보여줘도 되는 수준 */
    message: string
    /** 필드별 오류 등 */
    details?: Record<string, unknown>
  }
}

/* ── 사람 / 로그인 ────────────────────────── */

export type AvatarColor = 'lime' | 'yellow' | 'blue' | 'pink' | 'purple'

export interface Member {
  id: ID
  name: string
  color: AvatarColor
  photoUrl?: string | null
}

/** GET /api/me — 로그인한 나. Member + 계정 정보 */
export interface Me extends Member {
  /** 대표 모임 (랭킹 하단 "내 모임" 카드용). 없으면 null */
  primaryGroupId: ID | null
  createdAt: ISODateTime
}

/* ── 모임 ─────────────────────────────────── */

export type GroupCategory = '친구' | '동아리' | '회사' | '가족'

export interface GroupRef { id: ID; name: string; photoUrl?: string | null }

/** 카드의 한 줄 상태를 만들기 위한 원본 (v1 statusText 대체) */
export type GroupStatus =
  | { kind: 'next'; meetingId: ID; scheduledAt: ISODateTime }                 // "다음 약속 · 금 19:00"
  | { kind: 'time_voting'; meetingId: ID; respondedCount: number; participantCount: number } // "시간 정하는 중 · 4/6"
  | { kind: 'place_voting'; meetingId: ID; tugEndsAt: ISODateTime | null }    // "장소 투표 중"
  | { kind: 'idle'; lastMeetingAt: ISODateTime | null }                       // "약속 없음 · 12일 전"

export interface Group extends GroupRef {
  category: GroupCategory
  /** 카드 미리보기용 최대 N명 (나를 포함). 전체 목록은 /groups/:id/members */
  membersPreview: Member[]
  memberCount: number
  /** 결성일 — 화면은 연도만 씀 */
  createdAt: ISODateTime
  kingCount: number
  meetingCount: number
  /** 레이스 기록이 없으면 null */
  avgLateMin: number | null
  status: GroupStatus
  /** 내가 이 모임에서 가진 역할 */
  myRole: 'owner' | 'member'
}

/* ── 약속 ─────────────────────────────────── */

/** v1 에 'race' 추가 (화면 칩 "③ 레이스") */
export type MeetingStage = 'time' | 'place' | 'tug' | 'confirmed' | 'race' | 'done'

export interface PlaceRef {
  id: ID
  name: string
  category: PlaceCategory
  photoUrl?: string | null
  location: LatLng
}

export interface StationRef {
  id: ID                 // 역 코드
  name: string           // "홍대입구역"
  location: LatLng
}

/** when2meet 표 — 슬롯은 실제 시각으로 */
export interface Availability {
  /** 후보 날짜 (화면이 "금 25" 로 포맷) */
  dates: ISODate[]
  /** 후보 시간 (0~23). 슬롯 = dates[d] + hours[h] */
  hours: number[]
  slotMinutes: 60 | 30
  /** 가능 인원 수 counts[hourIdx][dateIdx] — 비율은 화면이 respondedCount 로 나눔 */
  counts: number[][]
  respondedCount: number
  participantCount: number
  /** 내가 고른 슬롯 (ISO 시작 시각 배열) */
  mySlots: ISODateTime[]
  /** 투표 마감 */
  deadline: ISODateTime | null
  /** 확정된 시각 (v1 picked / timeConfirmedLabel 대체) */
  confirmedAt: ISODateTime | null
}

export interface Midpoint {
  station: StationRef
  avgMin: number
  maxGapMin: number
  /** 참가자별 출발지 — 개인정보: 동/역 단위로 흐리게, 본인 동의한 사람만 */
  origins: { memberId: ID; approx: LatLng; travelMin: number }[]
  tug: {
    endsAt: ISODateTime
    /** 서버 기준 현재 시각 — 클라이언트 시계 오차 보정용 */
    serverNow: ISODateTime
    /** 현재 끌려간 방향/후보 (줄다리기 규칙 확정 후 구체화) */
    candidates: { station: StationRef; votes: number }[]
  } | null
}

export interface Meeting {
  id: ID
  groupId: ID
  title: string
  stage: MeetingStage
  /** 확정된 약속 시각 (없으면 null) — bucket 계산 근거 */
  scheduledAt: ISODateTime | null
  /** 서버가 scheduledAt/stage 로 계산해서 줘도 되고, 화면이 계산해도 됨 */
  bucket: 'active' | 'upcoming' | 'past'
  /** 확정 장소 (confirmed 이후) */
  place: PlaceRef | null
  /** place 가 없을 때 카드에 보여줄 대략 위치 (역) */
  areaLabelStation: StationRef | null
  participants: Member[]
  /** 레이스 1등 (v1 winnerName 대체) */
  winner: Member | null
  /** 방문 인정 여부 — 사진 인증 결과 요약 */
  visit: { status: 'none' | 'pending' | 'verified' | 'rejected'; verifiedAt: ISODateTime | null }
  availability: Availability | null
  midpoint: Midpoint | null
  createdBy: ID
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

/** 목록용 가벼운 모양 (GET /groups/:id/meetings) */
export type MeetingSummary = Pick<Meeting,
  'id' | 'groupId' | 'title' | 'stage' | 'scheduledAt' | 'bucket' | 'place' | 'areaLabelStation' | 'participants' | 'winner'
> & {
  /** stage=time 카드용 */
  timeVoting?: { respondedCount: number; participantCount: number; deadline: ISODateTime | null }
}

/* ── 장소 / 왕 ────────────────────────────── */

export type PlaceCategory = '술집' | '카페' | '식당' | '만화카페' | '영화관'

export interface Place extends PlaceRef {
  /** 법정 구 코드 + 이름 */
  district: { code: string; name: string }   // { code: "11440", name: "마포구" }
  neighborhood: string                        // "동교동"
  address: string
  visitedGroupCount: number
  /** 외부 지도 연동 id (카카오 place id 등) */
  externalIds?: { kakao?: string; naver?: string }
}

export interface PlaceRankEntry {
  rank: number
  group: GroupRef
  visits: number
  lastVisitedAt: ISODateTime
}

export interface PlaceKing {
  place: Place
  /** 아직 왕이 없는 장소면 null */
  king: { group: GroupRef; visits: number; since: ISODateTime } | null
  ranking: PlaceRankEntry[]            // 상위 N (기본 10)
  /** 내 모임들의 이 장소 순위 (여러 모임 가능, 순위 밖이면 rank=null) */
  myGroups: { groupId: ID; rank: number | null; visits: number }[]
  /** 왕 모임의 다른 왕좌 */
  kingOtherThrones: { place: Pick<PlaceRef, 'id' | 'name' | 'category'>; rank: number; visits: number }[]
}

/* ── 지도 ─────────────────────────────────── */

export interface Bounds { sw: LatLng; ne: LatLng }

/** 서울 전체 보기 — 구 단위 묶음 */
export interface DistrictCluster {
  code: string          // 행정구 코드
  name: string
  kingCount: number     // v1 count
  /** 최근 24h 왕 교체 수 등으로 서버가 판단 (v1 hot) */
  hot: boolean
  /** 구 중심 좌표 (v1 x,y 대체) */
  center: LatLng
  /** 확대 보기로 갈 때 쓸 영역 id */
  areaId: string
}

/** 확대 보기 — 왕 핀 */
export interface KingPin {
  place: PlaceRef        // location 포함 (v1 x,y 대체)
  kingGroup: GroupRef    // v1 kingGroupName/kingPhotoUrl 대체
  visits: number
  mine: boolean          // 내 모임 중 하나가 왕
}

/** 확대 보기 — 왕이 없는 일반 가게 (지금은 화면에 하드코딩됨) */
export interface PlainPin { place: PlaceRef }

export interface AreaKings {
  area: { id: string; name: string; bounds: Bounds }   // "홍대 · 연남"
  stations: StationRef[]
  kings: KingPin[]
  plain: PlainPin[]
}

export interface MapLive {
  /** "실시간 · 방금 3곳 왕 교체" */
  kingChangesLastHour: number
  updatedAt: ISODateTime
}

/** v1 myThrones (타입 없음) 대체 */
export interface MyThrones {
  group: GroupRef
  total: number
  /** v1 breakdown "마포 2 · 성동 1" 대체 */
  byDistrict: { code: string; name: string; count: number }[]
  /** 지도에 찍을 내 왕 핀 (지금 RankingMap 에 하드코딩된 2개) */
  pins: { placeId: ID; location: LatLng }[]
}

/* ── 랭킹 ─────────────────────────────────── */

export type RankingType = 'group' | 'category' | 'local'

export interface RankingQuery {
  type: RankingType
  /** type=category 일 때 필수 */
  category?: PlaceCategory
  /** type=local 일 때 필수 (구 코드). 없으면 서버가 내 위치/대표 모임 기준 */
  districtCode?: string
  cursor?: string
  limit?: number
}

export interface RankingEntry {
  rank: number
  group: GroupRef
  kingCount: number
  visits: number
  /** 전일 스냅샷 대비 (+ 상승). 신규 진입이면 null */
  delta: number | null
}

export interface RankingResponse extends Page<RankingEntry> {
  query: RankingQuery
  /** 스냅샷 기준 시각 */
  asOf: ISODateTime
}

export interface MyRankSummary {
  group: GroupRef           // v1 groupName 만 있어 링크를 못 만들었음
  rank: number | null
  kingCount: number
  kingsToFirst: number
}

/* ── 사진 인증 (방문 인정) ─────────────────── */

export type CheckinSource = 'camera' | 'gallery'

export interface CheckinUploadUrlRequest {
  contentType: 'image/jpeg' | 'image/heic' | 'image/webp'
  byteSize: number
}
export interface CheckinUploadUrlResponse {
  photoKey: string
  uploadUrl: string          // presigned PUT
  headers: Record<string, string>
  /** 1회용. 카메라 촬영은 이 값 발급 후 N분 이내 제출해야 함 */
  nonce: string
  expiresAt: ISODateTime
}

export interface CheckinRequest {
  photoKey: string
  nonce: string
  source: CheckinSource
  placeId: ID
  /** camera: 셔터 누른 순간 기기 시각 / gallery: EXIF DateTimeOriginal+OffsetTime */
  capturedAt: ISODateTime
  /** camera: 셔터 시점 navigator.geolocation / gallery: EXIF GPS */
  location: (LatLng & {
    accuracyM: number | null        // gallery(EXIF)는 보통 null
    fixAt: ISODateTime | null       // 위치 측정 시각 (position.timestamp)
  }) | null
  /** gallery 일 때 클라이언트가 읽은 EXIF 요약 (서버도 원본에서 다시 읽음) */
  exif?: {
    dateTimeOriginal?: string
    offsetTime?: string
    gpsLat?: number
    gpsLng?: number
    make?: string
    model?: string
    software?: string
  }
  device: { platform: string; userAgent: string }
}

export type CheckinRejectReason =
  | 'TOO_FAR' | 'LOW_ACCURACY' | 'NO_LOCATION' | 'OUT_OF_TIME_WINDOW'
  | 'STALE_CAPTURE' | 'DUPLICATE_PHOTO' | 'ALREADY_COUNTED' | 'EXIF_MISSING'
  | 'EXIF_EDITED' | 'NONCE_INVALID' | 'NOT_PARTICIPANT'

export interface Checkin {
  id: ID
  meetingId: ID
  memberId: ID
  placeId: ID
  source: CheckinSource
  status: 'verified' | 'pending' | 'rejected'
  reasons: CheckinRejectReason[]
  distanceM: number | null
  capturedAt: ISODateTime
  createdAt: ISODateTime
  /** EXIF·GPS 를 지운 공개용 사진 */
  photoUrl: string
}

export interface CheckinResponse {
  checkin: Checkin
  /** 이 인증으로 약속이 방문으로 인정됐는지 */
  visitCounted: boolean
  /** 인정됐다면 갱신된 이 장소 내 모임 순위 */
  placeStanding?: { rank: number; visits: number; becameKing: boolean; dethronedGroup?: GroupRef }
}

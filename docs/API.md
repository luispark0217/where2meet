# 모일곳 API 연결 가이드 (재운용)

> 프론트는 지금 가짜 데이터(`src/data/mock.ts`)로 돌아가요. 이 문서는 **어떤 주소로 무엇을 돌려주면 화면이 그대로 붙는지**, 그리고 **실서비스 전에 바꾸면 좋은 모양(v2)** 을 정리한 거예요.
> v2 타입 전체는 `docs/types-v2-proposal.ts` 에 있어요 (실제 `src/data/types.ts` 는 건드리지 않았어요).

---

## 1. 경계 한눈에 보기

```
화면 (src/pages/*.tsx)
   │  useApi(() => api.xxx())      ← 로딩/에러 상태 관리
   ▼
src/api/index.ts  ← ★ 여기만 바꾸면 됨 (지금은 mock 반환)
   │  fetch(`${BASE}/api/...`)
   ▼
백엔드
```

- 화면은 `api.*` 함수가 돌려주는 **Promise 의 모양(`src/data/types.ts`)** 만 알아요.
- 인증: 쿠키 세션(권장, `credentials: 'include'`) 또는 `Authorization: Bearer <token>`. 둘 중 정해주시면 `request()` 한 곳만 맞추면 돼요.
- 시각: **ISO 8601 + `+09:00`** 권장. (v1 은 `tugEndsAt` 만 ms 숫자)
- 좌표: **lat/lng (WGS84)**. 화면 픽셀 x/y 는 서버가 보내지 않는 게 목표 (5장 참고).
- 공통 에러 응답 (모든 4xx/5xx):

```json
{ "error": { "code": "NOT_FOUND", "message": "약속을 찾을 수 없어요", "details": {} } }
```

`code` 목록: `UNAUTHORIZED` `FORBIDDEN` `NOT_FOUND` `VALIDATION` `CONFLICT` `RATE_LIMITED` `DEADLINE_PASSED` `CHECKIN_*` (6장) `INTERNAL`

---

## 2. 화면 ↔ 함수 표

| 화면 (주소) | 파일 | 쓰는 함수 |
|---|---|---|
| A 내 모임 (`/`) | MyGroups.tsx | `me`, `myGroups` |
| B 모임 상세 (`/group/:id`) | GroupDetail.tsx | `group`, `groupMeetings` |
| C 약속 상세 (`/meet/:id`) | MeetingDetail.tsx | `meeting` |
| D 서울 왕좌 지도 (`/ranking`) | RankingMap.tsx | `districtClusters`, `myThrones` |
| E 확대 지도 (`/ranking/area/:area`) | AreaMap.tsx | `areaKings` |
| F 왕 상세 (`/place/:id`) | PlaceKing.tsx | `placeKing` |
| G 랭킹 리스트 (`/ranking/list`) | RankingList.tsx | `ranking`, `myRank` |

---

## 3. 함수별 명세 (v1 = 지금 types.ts 그대로)

### 3.1 `api.me()` → `GET /api/me`
화면 A: 아바타(`name` 첫 글자, `color`, `photoUrl`), "안녕 은수,". 비로그인 → `401 UNAUTHORIZED`.
```json
{ "id": "u-eunsu", "name": "은수", "color": "lime", "photoUrl": null }
```
v2: `primaryGroupId`, `createdAt` 추가 (G 화면 "내 모임" 카드 링크용).

### 3.2 `api.myGroups()` → `GET /api/groups`
화면 A: 카드(사진, `왕 {kingCount}곳`, `name`, `statusText`, 멤버 아바타 3명 + `+{memberCount-3}`), 상단 "N개가 기다려요", 카테고리 필터(클라이언트에서 거름).
```json
[
  {
    "id": "g-uni", "name": "대학 동기 모임", "category": "친구", "photoUrl": null,
    "members": [{ "id": "u-eunsu", "name": "은수", "color": "lime" }],
    "memberCount": 6, "since": 2021, "kingCount": 3, "meetingCount": 24, "avgLateMin": 4,
    "statusText": "다음 약속 · 금 19:00"
  }
]
```
- `members` 는 **미리보기용 4명 정도면 충분** (카드가 나 제외 3명만 그림). 전체 멤버는 별도 API 로.
- v2: `statusText` → `status` 원본 객체, `since` → `createdAt`, `avgLateMin` 은 기록 없으면 `null`, `myRole` 추가.

### 3.3 `api.group(id)` → `GET /api/groups/:id`
화면 B 상단: `category`, `name`, `members`(아바타), `{memberCount}명 · {since}년부터`, 통계 3칸(`meetingCount`, `kingCount`, `avgLateMin`). 응답 모양은 3.2 의 원소 하나.
- 없으면 **`404` 로 에러를 던져주세요**. 지금 mock 은 `undefined` 를 돌려주는데, `useApi` 는 `data === undefined` 면 계속 "로딩 중"으로 봐서 화면이 멈춰요.
- 내가 멤버가 아니면 `403`.

### 3.4 `api.groupMeetings(groupId)` → `GET /api/groups/:id/meetings?bucket=active|upcoming|past&cursor=`
화면 B 약속 카드: `stage`(색·라벨), `title`, `subText`, `placePhotoUrl`(confirmed), `participants`+`winnerName`(done). 탭 "진행 중/예정/지난" 은 `bucket` 으로 클라이언트가 거름.
```json
[
  { "id": "m-fri", "groupId": "g-uni", "title": "금요일 저녁", "stage": "tug", "bucket": "active",
    "subText": "홍대입구 부근 · 9/25", "participants": [ ... ] },
  { "id": "m-study", "groupId": "g-uni", "title": "스터디 뒤풀이", "stage": "done", "bucket": "active",
    "subText": "합정역 · 9/12", "winnerName": "도윤", "participants": [ ... ] }
]
```
- 목록에선 `availability`/`midpoint` 는 **빼도 됨** (카드는 안 씀).
- 페이지네이션: 지난 약속은 쌓이므로 v2 에서 `{ items, nextCursor }` 권장.
- `bucket` 규칙 제안: `done` 이고 `scheduledAt` 이 30일↑ 지났으면 `past`, 시간 확정됐고 아직 진행할 게 없으면 `upcoming`, 나머지 `active`. (서버가 계산해 주거나 v2 처럼 `scheduledAt` 을 주면 화면이 계산)

### 3.5 `api.meeting(id)` → `GET /api/meetings/:id`
화면 C: `title`, `availability`(시간표), `midpoint`(역 이름, 평균/최대 차이, 줄다리기 카운트다운), `participants`(지도 위 이니셜·색).
```json
{
  "id": "m-fri", "groupId": "g-uni", "title": "금요일 저녁", "stage": "tug", "bucket": "active",
  "subText": "홍대입구 부근 · 9/25",
  "participants": [{ "id": "u-eunsu", "name": "은수", "color": "lime" }],
  "availability": {
    "days": ["금 25", "토 26", "일 27"],
    "hours": [17, 18, 19, 20, 21, 22],
    "ratio": [[0.26, 0.45, 0.63], [0.54, 0.63, 0.45], [1, 0.63, 0.26], [1, 0.82, 0.26], [0.63, 0.45, 0.17], [0.26, 0.26, 0.17]],
    "picked": [2, 0]
  },
  "timeConfirmedLabel": "금 19:00 확정",
  "midpoint": { "stationName": "홍대입구역", "avgMin": 24, "maxGapMin": 7, "tugEndsAt": 1790000000000 }
}
```
주의할 점
- `ratio[시간인덱스][날짜인덱스]` (행=시간, 열=날짜). 0~1. `picked` 는 `[시간인덱스, 날짜인덱스]`.
- 화면이 `days[i].split(' ')[0]` 로 요일만 잘라 써요 → `"금 25"` 형식을 꼭 지켜야 함. v2 에선 `dates: ["2026-09-25", ...]` 로 바꾸고 화면이 포맷.
- `timeConfirmedLabel`, `responded` 는 **현재 화면에서 안 씀** (라벨은 `picked` 로 화면이 만듦).
- `tugEndsAt` 은 기기 시계가 틀리면 카운트다운이 어긋남 → v2 에서 `serverNow` 같이 주기.
- 시간 투표 전(`stage: time`)엔 `midpoint` 없음, 장소 단계 전엔 없어도 됨. 둘 다 없으면 카드가 안 그려짐.
- 지도의 친구 위치는 지금 **그림 좌표로 고정**. 실제 연결 시 v2 `midpoint.origins`(대략 위치) 필요.

### 3.6 `api.districtClusters()` → `GET /api/map/districts?category=`
화면 D: 구별 검은 원(숫자=`count`, 크기 `34 + 0.6*count`), `hot` 이면 라임 후광.
```json
[{ "id": "d-mapo", "name": "마포구", "count": 23, "hot": true, "x": 0.305, "y": 0.451 }]
```
- `x`,`y` 는 **지도 그림 박스 기준 0~1 비율** (390×844 그림). 서버가 알 수 없는 값 → v2 `center: {lat,lng}` + `code` 로 교체.
- 카테고리 칩(전체/술집/카페…)이 있지만 지금은 필터를 안 보냄 → `?category=` 지원 권장.

### 3.7 `api.myThrones()` → `GET /api/me/thrones`
화면 D 하단 카드: "우리 모임 왕 자리 {total}곳", "{groupName} · {breakdown}".
```json
{ "total": 3, "groupName": "대학 동기 모임", "breakdown": "마포 2 · 성동 1" }
```
- **types.ts 에 타입이 없음** (mock 에서 추론). v2 `MyThrones` 로 정식화: `group{id,name}`, `byDistrict[]`, 지도용 `pins[]`.
- 지도 위 "우리 모임 왕" 핀 2개는 지금 화면에 하드코딩 → `pins` 로 받아야 함.

### 3.8 `api.areaKings(area)` → `GET /api/map/areas/:area/kings?category=`
화면 E: 지도 위 왕 핀 + 아래 가로 카드(`kingGroupName`, `{placeName}의 왕 · {visits}회`, `mine` 이면 "내 모임" 표시).
```json
[{ "placeId": "p-wine", "placeName": "동교동 와인바", "category": "술집",
   "kingGroupName": "필름 동아리", "kingPhotoUrl": null, "visits": 31, "mine": false, "x": 110, "y": 193 }]
```
- `x`,`y` 는 **화면 픽셀**(390px 폭 그림 기준) → v2 는 `place.location{lat,lng}`.
- `kingGroupName` 만 있고 모임 id 가 없음 → v2 `kingGroup{id,name,photoUrl}`.
- 영역 이름 "홍대 · 연남", 역 표시, 왕 없는 일반 가게 핀도 하드코딩 → v2 `AreaKings{ area, stations, kings, plain }`.
- `area` 값은 지금 `hongdae` 하나뿐. 구 원(D)을 누르면 무조건 hongdae 로 감 → 구 → 영역 매핑(`areaId`) 필요.
- 대안: 영역 대신 `GET /api/map/kings?bbox=swLat,swLng,neLat,neLng` (카카오맵 붙이면 이게 더 자연스러움).

### 3.9 `api.placeKing(placeId)` → `GET /api/places/:id/king`
화면 F: 장소명, `{category} · {district} · 방문한 모임 {visitedGroupCount}곳`, 현재 왕(`방문 {visits}회 · {daysAsKing}일째 왕 자리`), 장소 랭킹(막대 = visits / 1등 visits, 내 모임 행 강조 + "N회 차이!"), 왕 모임의 다른 왕좌.
```json
{
  "place": { "id": "p-wine", "name": "동교동 와인바", "category": "술집", "district": "마포구 동교동",
             "photoUrl": null, "visitedGroupCount": 48, "lat": 37.5596, "lng": 126.9252 },
  "king": { "group": { "id": "g-film", "name": "필름 동아리" }, "visits": 31, "daysAsKing": 42 },
  "ranking": [
    { "rank": 1, "group": { "id": "g-film", "name": "필름 동아리" }, "visits": 31 },
    { "rank": 2, "group": { "id": "g-uni", "name": "대학 동기 모임" }, "visits": 29 }
  ],
  "myGroupId": "g-uni",
  "otherThrones": [{ "placeId": "p-roast", "placeName": "연남 로스터리", "rank": 1, "visits": 23 }]
}
```
- 동점 규칙 정해주세요 (제안: 방문 수 같으면 **먼저 그 수에 도달한 모임**이 위 → 왕이 쉽게 안 바뀜).
- 아직 방문 0 인 장소: mock 은 아무 id 나 와인바로 대체하지만 실제로는 `king: null` 로 (v2).
- `daysAsKing` → v2 `king.since`(ISO). `myGroupId` 는 하나뿐인데 한 사람이 여러 모임 → v2 `myGroups[]`.
- `otherThrones` 는 **왕 모임의** 다른 왕좌 (화면 제목 "{왕 모임}의 다른 왕좌"). 이름 혼동 방지로 v2 `kingOtherThrones`.
- `district` 가 "마포구 동교동" 합친 문자열 → v2 `district{code,name}` + `neighborhood`.

### 3.10 `api.ranking(type)` → `GET /api/rankings?type=group|category|local&category=&district=&cursor=&limit=20`
화면 G: 시상대(1~3위, `왕 {kingCount}곳`), 4위~ 리스트(`왕 {kingCount}곳 · 방문 {visits}회`, `delta` ▲▼—).
```json
[{ "rank": 1, "group": { "id": "g-film", "name": "필름 동아리" }, "kingCount": 14, "visits": 212, "delta": 0 }]
```
- 모임 랭킹 정렬: `kingCount` desc → `visits` desc → 먼저 달성한 순.
- `category`: 해당 카테고리 장소의 왕 수만 셈 → 어떤 카테고리인지 **파라미터 필요** (지금 화면엔 선택 UI 없음, 기본값 제안: 술집).
- `local`: 구 코드 기준. 파라미터 없으면 서버가 대표 모임의 가장 왕좌 많은 구로.
- `delta`: 전날 자정 스냅샷 대비. 신규는 `null` (v2).
- 지금 화면은 `type` 을 넘기지만 mock 이 무시함 → 서버에서 구분 필요.
- v2 응답은 `{ items, nextCursor, asOf, query }`.

### 3.11 `api.myRank()` → `GET /api/me/rank?type=`
화면 G 하단 라임 카드: "내 모임 · {groupName}", "{rank}위 · 1위까지 왕 자리 {kingsToFirst}곳 남았어요".
```json
{ "groupName": "대학 동기 모임", "rank": 2, "kingsToFirst": 3 }
```
- 모임 id 가 없어서 링크가 `/group/g-uni` 로 **하드코딩**됨 → v2 `group{id,name}`.
- 어느 모임 기준? 제안: 대표 모임(`me.primaryGroupId`), 없으면 가장 순위 높은 모임.
- 탭(type)에 따라 달라져야 하면 `?type=` 도 받기.

---

## 4. 아직 없는 API (화면에 버튼만 있음)

| 버튼/기능 | 위치 | 제안 |
|---|---|---|
| 로그인 | 전체 | `POST /api/auth/kakao` (code → 세션), `POST /api/auth/logout` |
| + 새 약속 / 도전하기 | B, F → `/new` | `POST /api/groups/:id/meetings` `{title, dates[], hours[], deadline}` |
| 시간표 칸 선택 | C | `PUT /api/meetings/:id/availability` `{slots: ISO[]}` (내 가능 시간 전체 덮어쓰기) |
| 시간 확정 | C | `POST /api/meetings/:id/time/confirm` `{startAt}` (방장 또는 마감 시 자동) |
| 출발지 등록 | C | `PUT /api/meetings/:id/origin` `{lat,lng}` 또는 `{stationId}` |
| ↔ 줄다리기 | C | `POST /api/meetings/:id/tug` `{direction|stationId}` → 마감(`endsAt`) 후 서버가 확정. 409 `DEADLINE_PASSED` |
| 약속 확정하고 공유하기 | C | `POST /api/meetings/:id/confirm` `{placeId}` → `{shareUrl}` |
| 장소·모임 검색 | D | `GET /api/search?q=&type=place|group` |
| 모임 만들기/초대 | A | `POST /api/groups`, `POST /api/groups/:id/invites` → 초대 링크 |
| 실시간 표시 | D, F, G | "방금 3곳 왕 교체" 하드코딩 → `GET /api/map/live` 폴링(30초) 또는 SSE `/api/stream` |
| 방문 인증 | (새 화면) | 6장 |

실시간 줄다리기는 초 단위라 폴링보다 **SSE/WebSocket** 권장 (`GET /api/meetings/:id/stream`).

---

## 5. 화면에 보이는 문구 vs 원본 데이터

서버가 한국어 문구를 만들어 보내면 요일/상대시간이 **캐시된 순간부터 틀려져요** ("D-2" 가 다음 날에도 D-2). 원본을 보내고 화면이 포맷하는 걸 권장.

| v1 필드 (예시) | 문제 | v2 제안 |
|---|---|---|
| `Group.statusText` "다음 약속 · 금 19:00" / "시간 정하는 중 · 4/6" / "약속 없음 · 12일 전" | 문구 4종이 섞임, 상대시간 | `status: {kind:'next', meetingId, scheduledAt} \| {kind:'time_voting', respondedCount, participantCount} \| {kind:'place_voting', tugEndsAt} \| {kind:'idle', lastMeetingAt}` |
| `Meeting.subText` "홍대입구 부근 · 9/25" / "4/6 응답 · 마감 D-2" | 장소·날짜·응답 수가 한 줄에 | `place`, `areaLabelStation`, `scheduledAt`, `timeVoting{respondedCount, participantCount, deadline}` |
| `Meeting.timeConfirmedLabel` "금 19:00 확정" | 화면에서 안 씀, 포맷 문자열 | `availability.confirmedAt` (ISO) |
| `Meeting.responded` "4/6 응답 · 마감 D-2" | 화면에서 안 씀, subText 와 중복 | `availability.respondedCount/participantCount/deadline` |
| `availability.days` "금 25" | 화면이 `split(' ')` 으로 파싱 | `dates: ["2026-09-25"]` |
| `availability.ratio` 0~1 | 몇 명인지 모름 | `counts[][]` + `respondedCount` (비율은 화면 계산), `mySlots[]` |
| `availability.picked` [시간idx, 날짜idx] | 인덱스라 표가 바뀌면 깨짐 | `confirmedAt` |
| `midpoint.tugEndsAt` ms 숫자 | 기기 시계 오차 | `tug.endsAt` ISO + `serverNow` |
| `Meeting.winnerName` "도윤" | 동명이인·아바타 불가 | `winner: Member` |
| `Group.since` 2021 | 연도만 | `createdAt` |
| `PlaceKing.king.daysAsKing` 42 | 매일 바뀌는 값 | `king.since` |
| `Place.district` "마포구 동교동" | 구 필터/랭킹 불가 | `district{code,name}`, `neighborhood`, `address` |
| `KingPin.kingGroupName` | id 없음 | `kingGroup{id,name,photoUrl}` |
| `MyRankSummary.groupName` | id 없음 → 링크 하드코딩 | `group{id,name,photoUrl}` |
| `myThrones.breakdown` "마포 2 · 성동 1" | 문구 | `byDistrict[{code,name,count}]` |

좌표 (지도 그림 → 실제 지도)

| v1 | 의미 | v2 |
|---|---|---|
| `DistrictCluster.x/y` (0~1) | 그림 박스 비율 | `center{lat,lng}`, `code`, `areaId` |
| `KingPin.x/y` (px) | 390px 그림 픽셀 | `place.location{lat,lng}` |
| RankingMap 내 왕 핀 `[[84,330],[318,580]]` | 화면 하드코딩 | `MyThrones.pins[{placeId, location}]` |
| AreaMap 일반 가게 핀·홍대입구역 | 화면 하드코딩 | `AreaKings.plain[]`, `stations[]` |
| MeetingDetail 친구 출발지 | 화면 하드코딩 | `midpoint.origins[{memberId, approx, travelMin}]` (대략 좌표만) |

그 밖에 빠진 것
- **타임스탬프**: 모든 엔티티에 `createdAt/updatedAt`, 약속에 `scheduledAt`.
- **stage 에 `race` 없음** (화면 칩엔 "③ 레이스") → `'race'` 추가.
- **방문 인정 상태**: 약속에 `visit.status` (none/pending/verified/rejected).
- **확정 장소 id**: 약속이 어떤 `placeId` 로 확정됐는지 (지금은 `placePhotoUrl` 만).
- **페이지네이션**: 약속 목록, 랭킹, 장소 랭킹 → `{items, nextCursor}`.
- **사진**: 모든 `RoundPhoto` 가 지금 `src` 없이 그려짐 → 모임/장소 `photoUrl` 을 실제로 채워주면 프론트가 연결.
- **myThrones 타입** 정의 없음.

---

## 6. 사진 인증(방문 인정) 흐름

### 규칙 요약
- 약속이 **장소의 방문 1회**로 인정되려면, 약속 참가자가 **그 장소에서 찍은 사진**으로 인증해야 함.
- 1순위: **앱 안 카메라 촬영** + 촬영 순간의 **기기 GPS** (`source: "camera"`).
- 2순위: **갤러리 업로드** + 사진의 **EXIF GPS/촬영시각** (`source: "gallery"`) — 신뢰도 낮음.
- 촬영 시각이 약속 시각 근처인지도 확인.
- 인정되면 `(장소, 모임)` 방문 수 +1 → 장소 랭킹 재계산 → 1위가 **왕**.

### 순서
```
1. POST /api/meetings/:id/checkins/upload-url   { contentType, byteSize }
   ← { photoKey, uploadUrl, headers, nonce, expiresAt }      (nonce 유효 10분, 1회용)
2. PUT  uploadUrl  (사진 바이너리, S3/R2 presigned)
3. POST /api/meetings/:id/checkins   (아래 요청)
   ← 201 { checkin, visitCounted, placeStanding }
4. GET  /api/meetings/:id/checkins   → 인증 목록/상태 (약속 카드의 visit.status 로도 요약)
```

### 3번 요청
```json
{
  "photoKey": "chk/2026/09/25/abc.jpg",
  "nonce": "n_7f3a...",
  "source": "camera",
  "placeId": "p-wine",
  "capturedAt": "2026-09-25T19:12:03+09:00",
  "location": { "lat": 37.55961, "lng": 126.92518, "accuracyM": 18, "fixAt": "2026-09-25T19:12:01+09:00" },
  "exif": null,
  "device": { "platform": "iOS", "userAgent": "..." }
}
```
- `camera`: 앱이 `getUserMedia` 로 찍고(캔버스 → JPEG, EXIF 없음) 셔터 순간 `navigator.geolocation.getCurrentPosition({ enableHighAccuracy: true, maximumAge: 0 })` 값을 보냄. (`<input capture>` 는 기기에 따라 갤러리 선택이 가능해서 camera 로 보면 안 됨)
- `gallery`: `location` 은 EXIF GPS, `capturedAt` 은 `DateTimeOriginal`+`OffsetTimeOriginal`(없으면 KST 가정), `accuracyM: null`. **서버도 원본 파일에서 EXIF 를 다시 읽어** 클라이언트 값과 비교.

### 검증 규칙 (제안값, 설정으로 빼두기)
| 항목 | camera | gallery |
|---|---|---|
| 거리 (사진 위치 ↔ 장소 좌표, haversine) | `≤ max(80m, accuracyM)` 이고 최대 150m | `≤ 80m` |
| 위치 정확도 | `accuracyM > 100m` → `pending` 또는 `LOW_ACCURACY` | 해당 없음 |
| 위치 측정 신선도 | `capturedAt - fixAt ≤ 60초` | — |
| 촬영 시각 창 | `scheduledAt - 1h ≤ capturedAt ≤ scheduledAt + 6h` | 동일 |
| 제출 지연 | 서버 수신 - `capturedAt` ≤ 10분 (nonce 발급 후 촬영했는지도) | 약속 후 **48시간 이내** 제출 |
| EXIF | 없어도 됨 | GPS·촬영시각 없으면 `EXIF_MISSING` 거절. `Software` 에 편집앱 흔적이면 `pending` |
| 결과 | 통과 → `verified` | 통과 → 기본 `verified`, 애매하면 `pending` (다른 참가자 1명 camera 인증 시 자동 승격) |

- 장소 좌표가 넓은 곳(영화관·대형 건물)은 장소별 `radiusM` 컬럼으로 반경 조정.
- 약속이 확정된 장소(`meeting.place.id`)와 `placeId` 가 다르면 거절(또는 "다른 장소 방문"으로 따로 처리 — 정책 결정 필요).

### 중복 방지
- **약속 1건 = 방문 최대 1회.** 참가자 여럿이 인증해도 +1 (첫 `verified` 시점에 `visitCounted: true`, 이후 `ALREADY_COUNTED`).
- 같은 모임·같은 장소는 **하루(KST) 1회**만 인정 (하루에 약속 여러 개 만들어 쌓는 것 방지).
- 사진 **SHA-256** 완전 일치 + **perceptual hash**(pHash, 해밍거리 ≤ 6) 유사 사진 → `DUPLICATE_PHOTO` (다른 모임 사진 재사용 방지 포함).
- `nonce` 1회용, 약속·사용자에 묶기.
- 약속 참가자만 인증 가능 (`NOT_PARTICIPANT`), 참가자 2명 미만 약속은 방문 불인정 제안.

### 부정행위 메모 (완벽 차단은 불가 → 비용을 올리고 기록을 남기기)
- 웹 브라우저 위치는 개발자도구/가짜 GPS 앱으로 조작 가능. 서버에서 **순간이동 검사**(같은 사용자의 직전 인증과 거리/시간 → 시속 200km↑ 면 `pending`), 요청 IP 대략 위치(국가/통신사)도 참고.
- EXIF 는 쉽게 편집됨 → gallery 는 신뢰도 낮게, 왕이 바뀌는 인증이면 `pending` 검토 큐로.
- 레이트리밋: 사용자당 인증 시도 10분 5회.
- 모든 원본 값(위치, EXIF, UA, IP, 해시, 판정 이유)을 `checkin_audit` 에 저장 → 신고 시 되돌리기(방문 -1, 랭킹 재계산) 가능하게.
- **개인정보**: 공개용 사진은 EXIF/GPS 를 지운 사본(`photoUrl`), 원본은 비공개 버킷에 보관 기한(예: 90일) 두기. 위치 수집 동의 문구 필요.

### 인정 후 처리
1. `place_group_visits(placeId, groupId).visits += 1`, `lastVisitedAt` 갱신
2. 장소 1위 재계산 → 바뀌면 `king_history` 기록(`since`), 이전 왕 모임에 알림
3. 모임 `kingCount`, 구별 `kingCount` 갱신 (D 지도), "최근 왕 교체 수" 카운트
4. 랭킹 `delta` 는 매일 00:00 KST 스냅샷 기준

실패 응답 예:
```json
{ "error": { "code": "CHECKIN_TOO_FAR", "message": "장소에서 320m 떨어져 있어요", "details": { "distanceM": 320, "limitM": 80 } } }
```

---

## 7. 연결 방법

### 7.1 환경변수
`.env.local` (Vite 는 `VITE_` 로 시작해야 화면에서 읽힘)
```
VITE_API_BASE_URL=https://api.moilgot.example   # 비우면 같은 도메인의 /api
VITE_USE_MOCK=false                              # true 면 지금처럼 mock
```
개발 중 CORS 를 피하려면 `vite.config.ts` 에 `server.proxy: { '/api': 'http://localhost:8080' }`.

### 7.2 `src/api/index.ts` 바꾸는 예
```ts
const BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message) }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, body?.error?.code ?? 'INTERNAL', body?.error?.message ?? '잠시 후 다시 시도해주세요', body?.error?.details)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

export const api = {
  me: (): Promise<Member> => USE_MOCK ? delay(mock.me) : request('/api/me'),
  group: (id: string): Promise<Group> => USE_MOCK ? delay(mock.groups.find((g) => g.id === id)!) : request(`/api/groups/${encodeURIComponent(id)}`),
  ranking: (type = 'group') => USE_MOCK ? delay(mock.ranking) : request<RankingEntry[]>(`/api/rankings?type=${type}`),
  // ... 나머지도 같은 식
}
```
- 함수 이름·반환 타입을 유지하면 **화면 파일은 수정 불필요**.
- v2 로 넘어갈 때는 서버가 v2 를 주고, `index.ts` 안에서 v1 모양으로 바꾸는 **어댑터 함수**를 잠깐 두면 화면을 한 장씩 옮길 수 있어요.

### 7.3 에러 처리 기대
- `useApi` 는 `{ data, error, loading }` 을 돌려줌. **`undefined` 를 성공값으로 돌려주면 영원히 loading** → 없는 리소스는 반드시 404 로 throw.
- `401` → 프론트가 로그인 화면으로 보냄 (전역 처리 예정). `403`/`404` → "찾을 수 없어요" 화면. `5xx`/네트워크 → 재시도 버튼.
- 지금 화면들은 `error` 를 아직 그리지 않음 → 프론트 쪽 할 일로 남겨둠.
- 응답 시간 목표: 목록 300ms 이내. 랭킹/지도 집계는 캐시(30~60초) OK — 화면의 "실시간" 표시는 1분 단위면 충분.

### 7.4 체크리스트
- [ ] 인증 방식 (쿠키 vs 토큰) 결정 → `request()` 반영
- [ ] v1 그대로 11개 GET 먼저 붙이기 (3장)
- [ ] 없는 리소스 404, 에러 바디 형식 통일
- [ ] 좌표 lat/lng 로 전환 (카카오맵 연결과 같이)
- [ ] 문구 필드 → 원본 필드 (5장), 화면 포맷터는 프론트가 작업
- [ ] 사진 인증 (6장) + 랭킹 재계산 배치

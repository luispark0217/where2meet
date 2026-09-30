# where2meet — 프론트엔드 (퍼블리싱)

은수 피그마(`where2meet 리뉴얼 — 메인 · 서울 왕좌 랭킹`)를 실제 웹 화면으로 옮긴 코드예요.
화면은 **가짜 데이터**로 돌아가고, 백엔드는 재운이 `src/api/` 의 네 파일(`index.ts` · `tug.ts` · `me.ts` · `social.ts`)에 연결해요 (`docs/API.md`).

- 기술: React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router
- 대상: 모바일 웹 (최대 폭 430px, PC에서는 가운데 폰 폭으로 보여요)

## 실행

```bash
npm install
npm run dev        # 개발 서버 (http://localhost:5173)
npm run build      # 배포용 파일 → dist/
```

## 화면 목록

| 피그마 | 주소 | 파일 |
|---|---|---|
| A 내 모임 | `#/` | `src/pages/MyGroups.tsx` |
| B 모임 상세 | `#/group/:id` | `src/pages/GroupDetail.tsx` |
| C 약속 상세 | `#/meet/:id` | `src/pages/MeetingDetail.tsx` |
| D 서울 왕좌 지도 | `#/ranking` | `src/pages/RankingMap.tsx` |
| E 확대 지도 | `#/ranking/area/:area` | `src/pages/AreaMap.tsx` |
| F 왕 상세 | `#/place/:id` | `src/pages/PlaceKing.tsx` |
| G 랭킹 리스트 | `#/ranking/list` | `src/pages/RankingList.tsx` |
| M · R 장소 줄다리기 (당긴 후) | `#/meet/:id/tug` (`?pulled=1`) | `src/pages/new/Tug.tsx` |
| N 장소 리스트 | `#/meet/:id/places` | `src/pages/new/PlaceList.tsx` |
| P 장소 투표 | `#/meet/:id/vote` | `src/pages/new/PlaceVote.tsx` |
| O 채팅 | `#/meet/:id/chat` | `src/pages/new/Chat.tsx` |
| S 공유하기 | `#/meet/:id/share` | `src/pages/new/Share.tsx` |
| L 왕좌 도전하기 | `#/place/:id/challenge` | `src/pages/new/Challenge.tsx` |
| H 알림 | `#/alerts` | `src/pages/new/Alerts.tsx` |
| I 마이 | `#/my` | `src/pages/new/My.tsx` |
| J 설정 | `#/settings` | `src/pages/new/Settings.tsx` |
| K 만들기(+) | `#/new` | `src/pages/new/CreateSheet.tsx` |
| Q 새 모임 만들기 | `#/group/new` | `src/pages/new/NewGroup.tsx` |

## 폴더 구조

```
src/
  api/index.ts        ← 데이터 가져오는 곳: A~G + 공통(나·모임·약속·장소)
  api/tug.ts · me.ts · social.ts ← 새 화면(줄다리기·장소·투표·확정 / 알림·마이·설정 / 만들기·채팅·공유·도전)의 데이터
                         (재운: 이 네 파일의 함수 안만 fetch로 바꾸면 됨)
  api/store.ts        ← 가짜 서버 DB (목 전용): 투표·찜·확정·새 모임·줄다리기가 화면을 오가도 유지돼요
  api/useApi.ts       ← 화면에서 쓰는 불러오기 도우미 (로딩·없음·오류 상태)
  data/types.ts       ← 화면이 필요로 하는 데이터 모양 (백엔드와의 약속)
  data/mock.ts        ← 가짜 데이터의 처음 상태 (피그마 내용 + 2026 달력 날짜)
  lib/josa.ts         ← 을/를 · (으)로 고르기
  data/categories.ts  ← 장소 카테고리 색·글자
  components/         ← 공통 부품 (탭바, 칩, 아바타, 왕관, 사진, 지도판 …)
  pages/              ← 화면 A~G
  pages/new/          ← 화면 H~S
  index.css           ← 디자인 기준표 (색·글꼴) — 색 바꿀 땐 여기만
docs/API.md           ← 백엔드 연결 명세 (재운용)
docs/DESIGN_NOTES.md  ← 디자인팀 확인 요청 (은수용)
design-ref/           ← 피그마 원본 화면 캡처 (비교용)
qa/                   ← 피그마 비교·검수 도구와 보고서
```

## 가짜 데이터로 흐름 확인하기

- 한 번의 흐름이 모든 화면에 남아요: C → 줄다리기(M)에서 당기기 → C·N·S 에 합정역 반영 → 투표(P) → 이 장소로 확정 → 공유(S) → C·B·O·N 에 확정 장소.
- 줄다리기 마감은 약속을 처음 열 때 한 번 정해져요(42초). 같은 탭에서는 새로고침해도 이어져요.
- 처음 상태로 돌리기: 주소에 `?fresh=1` (예: `http://localhost:5173/?fresh=1#/`). 새 탭·새 창도 처음 상태예요.
- `#/meet/m-fri/tug?pulled=1` 은 디자인 비교용 R 미리보기예요 (실제로 당기지 않아요).

## 디자인 수치 맞추는 방법

- 색·글꼴은 `src/index.css`의 `@theme`에 모여 있어요. 예: `--color-lime: #c6f432`.
- 위치는 피그마 390×844 프레임 기준으로 맞췄어요. 피그마 y좌표에서 **44(상태바)** 를 뺀 값이 화면 위치예요.
- 피그마와 겹쳐 비교: `npm run build && python3 qa/compare.py` → `qa/out/*_compare.png`
  (왼쪽부터 피그마 | 웹 | 반투명 겹침 | 빨간색 = 다른 부분). 주소에 `?frame=1`을 붙이면 아이폰 상태바/홈바 여백을 흉내내요.

## 일부러 피그마와 다르게 한 것

- 피그마의 `9:41` 상태바와 폰 테두리는 그리지 않아요 (실제 폰 상태바가 그 자리에 나와요).
- D·E·F의 지도는 **카카오맵 자리표시 그림**이에요. 카카오맵 키가 생기면 `src/components/MapArt.tsx`의 지도판만 교체하고 위의 핀·카드는 그대로 써요.
- 사진은 회색 자리표시예요. 데이터에 `photoUrl`이 오면 실제 사진이 나와요.
- 탭 아이콘(홈·알림·마이)은 피그마에 아직 아이콘이 없어서 둥근 네모로 둬요.
- 만들기(K)·공유하기(S) 시트 뒤에는 피그마의 흐린 그림 대신 실제 화면(내 모임 / 약속 상세)을 흐리게 깔아요.
- 왕관 아이콘은 피그마 파일에서 내려받을 수 없어 같은 모양으로 다시 그렸어요 (`src/components/Crown.tsx`).
- 아직 기능이 없는 버튼(카카오톡 공유, 확대/축소, 시간표 입력 등)은 누르면 "아직 준비 중인 기능이에요"가 떠요.
- N 장소 리스트의 왕 표시는 '우리 모임과 왕좌 싸움이 걸린 곳'(우리가 왕이거나 2회 차이 이내)만 보여줘요. 모든 장소에 왕이 있고, 누르면 F 에서 볼 수 있어요.

## 배포 (Vercel)

1. GitHub 새 저장소에 이 폴더를 올려요 (`node_modules`, `dist` 제외).
2. Vercel → Add New → Project → 저장소 선택 → Framework: **Vite** (자동 인식) → Deploy.
3. 지금은 주소가 `#/...` 방식이라 추가 설정 없이 새로고침이 돼요.

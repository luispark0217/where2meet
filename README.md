# where2meet — 프론트엔드 (퍼블리싱)

은수 피그마(`where2meet 리뉴얼 — 메인 · 서울 왕좌 랭킹`)를 실제 웹 화면으로 옮긴 코드예요.
화면은 **가짜 데이터**로 돌아가고, 백엔드는 재운이 `src/api/index.ts`에 연결해요.

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
| 알림 · 마이 · 새 약속 | `#/alerts` `#/my` `#/new` | `src/pages/ComingSoon.tsx` (디자인 나오면 교체) |

## 폴더 구조

```
src/
  api/index.ts        ← 데이터 가져오는 곳 (재운: 여기만 fetch로 바꾸면 됨)
  api/useApi.ts       ← 화면에서 쓰는 불러오기 도우미 (로딩·없음·오류 상태)
  data/types.ts       ← 화면이 필요로 하는 데이터 모양 (백엔드와의 약속)
  data/mock.ts        ← 가짜 데이터 (피그마 내용 그대로)
  data/categories.ts  ← 장소 카테고리 색·글자
  components/         ← 공통 부품 (탭바, 칩, 아바타, 왕관, 사진, 지도판 …)
  pages/              ← 화면 7개
  index.css           ← 디자인 기준표 (색·글꼴) — 색 바꿀 땐 여기만
docs/API.md           ← 백엔드 연결 명세 (재운용)
docs/DESIGN_NOTES.md  ← 디자인팀 확인 요청 (은수용)
design-ref/           ← 피그마 원본 화면 캡처 (비교용)
qa/                   ← 피그마 비교·검수 도구와 보고서
```

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
- 왕관 아이콘은 피그마 파일에서 내려받을 수 없어 같은 모양으로 다시 그렸어요 (`src/components/Crown.tsx`).
- 아직 기능이 없는 버튼(공유, 줄다리기, 확대/축소 등)은 누르면 "아직 준비 중인 기능이에요"가 떠요.

## 배포 (Vercel)

1. GitHub 새 저장소에 이 폴더를 올려요 (`node_modules`, `dist` 제외).
2. Vercel → Add New → Project → 저장소 선택 → Framework: **Vite** (자동 인식) → Deploy.
3. 지금은 주소가 `#/...` 방식이라 추가 설정 없이 새로고침이 돼요.

# Mobile & accessibility review: where2meet

Reviewer: Mobile & Accessibility specialist (independent review)
Build: `npm run build` → `dist/`, served on :4174. Tool: Playwright Chromium (mobile emulation, touch, DPR 2).
Viewports: 360x740, 390x844, 430x932, 1280x800, each with and without `?frame=1`. Extra checks at 320x568 (reflow) and 740x360 (landscape).
Screens: A `#/`, B `#/group/g-uni`, C `#/meet/m-fri`, D `#/ranking`, E `#/ranking/area/hongdae`, F `#/place/p-wine`, G `#/ranking/list`.
Screenshots: `qa/mobile/` (81 files, named `<screen>_<WxH>[_frame][_bottom].png`, plus `focus_*`, `long_*`, `tabbar_*`).

## What passed

- **No horizontal page scroll** on any screen at any viewport, including 320px and the long-text stress test. `scrollWidth` always equals `innerWidth`.
- **Desktop 1280x800:** the app stays a centred 430px column (x=425..855) on every screen, and the tab bar stays inside the column.
- **Fixed tab bar:** it never permanently hides content. After scrolling to the bottom of A and G, the last card ends above `nav.top` (the `TabBarSpacer` works).
- **Reduced motion:** with `prefers-reduced-motion: reduce`, `.live-dot` computes `animation-name: none`. There are no other animations or transitions, and `scroll-behavior` is `auto`.
- **Pinch-zoom:** the viewport meta allows it (no `user-scalable=no`). `lang="ko"` is set.
- **Icon-only controls have names:** every `IconButton`, map cluster, king marker and the FAB has an `aria-label`. No unnamed interactive element was found on any screen.
- **Dark-theme grey text passes contrast:** `#9aa098` on `#0e100f` is **7.14:1**, on `#1a1d1b` **6.36:1**, and on `#242826` **5.59:1**.
- **Long names mostly truncate cleanly** (A, B, D, E, G). Exceptions are items 3 and 13 below.

---

## Findings (prioritised)

Severity: **P0** is broken for most users. **P1** is a real defect or WCAG AA failure. **P2** should be fixed. **P3** is polish.

### P0

**1. The tab bar's labels and the + button are cut off at the bottom when the safe-area inset is 0.** This affects every tab screen (A, D, E, G) at all widths without `?frame=1`, which matches Android and mobile Safari with toolbars.
- Evidence: `qa/mobile/tabbar_clipped_360x740_noSafeArea.png`, `A_home_360x740.png`, `D_rankmap_360x740.png`. At 360x740 each label's bottom is **743px** against a 740px viewport. The + FAB (`top 5 + 52 = 57px` inside a 49px bar) ends at **748px**, so 8px of the circle is lost. In `_frame` shots the 34px padding hides the problem.
- Cause: in `src/components/TabBar.tsx` the row is `h-[49px]`, but the label sits at `top-[37px]` and its line box is 11×1.35 ≈ 15px tall (ends at 52px). The FAB also overhangs.
- Fix (`src/components/TabBar.tsx`):
  - Change the inner `<div className="relative h-[49px]">` to `h-[56px]`, or set the nav's `paddingBottom: 'max(var(--sab), 8px)'`.
  - Change the label to `top-[33px]`.
  - Update `TabBarSpacer` to match (`calc(58px + var(--sab))`) and the `fromBottom()` maths in `RankingMap.tsx` and `AreaMap.tsx`.

**2. On G, the "내 모임" summary bar never sticks, so at first paint it sits under the tab bar.**
- Evidence: `G_ranklist_360x740.png`. The card spans y=646–702 and `nav.top` is 690, so it is covered by **12px** and its second line is hidden. Its computed `position` is `sticky`, but its parent `Screen` computes `overflow-x:hidden; overflow-y:auto`, which makes the parent the scroll container. Because the parent never scrolls, `sticky` does nothing.
- Fix (`src/components/Screen.tsx`): replace `overflow-x-hidden` with `overflow-x-clip`. `overflow: clip` does not create a scroll container. This also fixes sticky behaviour for any future sticky headers.

### P1

**3. On C, a long station name wraps onto the text below and covers the buttons.**
- Evidence: `qa/mobile/long_C_meet_360x740.png`. "디지털미디어시티역 경의중앙선 출구" wraps to two lines and overlaps "평균 24분 · 최대 차이 7분" and the top of the "줄다리기" button.
- Cause: `PlaceCard` in `src/pages/MeetingDetail.tsx` places everything with absolute `top-[196px]`, `top-[228px]`, `top-[250px]` inside a fixed `h-[300px]` section.
- Fix: add `right-[20px] truncate` to the station `<p>` (quick fix). Better: turn the section into a flex column (`flex flex-col gap-*`, no fixed height) so a real Kakao station name can wrap.

**4. The time-grid cells are too small to tap: 74x18px with a 4px gap.** Screen C, all viewports.
- Evidence: the tap-target scan lists 18 cells at `74x18`. The vertical pitch is 22px, which fails WCAG 2.2 **2.5.8 Target Size (24px)** and is far below the 44px iOS guideline. On a phone, tapping 19시 easily selects 18시 or 20시.
- Fix (`MeetingDetail.tsx` `TimeCard`):
  - Change `h-[18px]` to `h-[28px]`; `h-[24px]` is the minimum.
  - Make the section's height automatic (drop `h-[236px]`, use normal flow).
  - Alternatively, keep the 18px visual bar but wrap it in a 28px-tall transparent `<button>`.

**5. The time grid only works by pressing Tab through every cell, and its grid semantics are incomplete.** Screen C.
- Evidence: `focus_timegrid_360x740.png`. After Tab reaches the first cell, `ArrowRight` leaves focus on "금 25 17시". There are **18 separate tab stops** to cross.
  - The day headers and hour labels are bare `<span>`s. They are not `columnheader`/`rowheader`, and the header row has no `role="row"`.
  - The confirmation pill ("금 19:00 확정") changes on Enter, but nothing announces it.
- Fix (`MeetingDetail.tsx`):
  - Use a roving tabindex: `tabIndex={on || (!picked && r===0 && c===0) ? 0 : -1}` plus an `onKeyDown` that handles Arrow keys and Home/End.
  - Wrap the header cells in `<div role="row" className="contents">` with `role="columnheader"`, and give each hour label `role="rowheader"`.
  - Add `aria-live="polite"` to the confirmation pill `<span>`.
  - Simpler alternative: drop `role=grid` and use a `radiogroup` with 18 `role="radio"` buttons and arrow-key handling.

**6. The countdown has `aria-live="polite"` and changes every second,** so a screen reader announces "줄다리기 중 0:41, 0:40, 0:39…" non-stop. Screen C.
- Evidence: `MeetingDetail.tsx` `PlaceCard`: the `<span aria-live="polite">` is updated by a `setInterval(…,1000)`.
- Fix: remove `aria-live` from the ticking span and add a visually hidden `<span aria-live="polite" className="sr-only">` that only updates at meaningful points (for example, each minute and when "줄다리기 끝" appears).

**7. Light-theme grey text fails contrast: `--color-paper-muted #9ba197` is 2.28–2.65:1** (4.5:1 required). Screens D, E and F, and the light tab bar.

| Usage | Ratio |
|---|---|
| on `#ffffff` (E card subtitle, F "방문 31회 · 42일째", F "31회" counts, inactive light tab labels) | **2.65** |
| on `#f2f3ef` (F other-throne "1위 · 23회") | **2.37** |
| on `#eef6d6` (F "29회" on my-rank row) | **2.37** |
| on `#edefe8` (D district labels, search placeholder) | **2.28** |

- Fix (`src/index.css`): set `--color-paper-muted` to **`#646a60`**, which gives 5.57:1 on white, 4.98:1 on `#eef6d6` and 4.80:1 on `#edefe8`, so it passes on all four backgrounds. Keep the lighter value only for the decorative inactive crown fill, for example as a new `--color-paper-faint: #9ba197`.

**8. Inactive dark tab labels fail contrast: `--color-night-off #6b716c` on `#121513` is 3.68:1** at 11px. Screens A and G, and the "알림"/"마이" tabs everywhere.
- Fix (`src/index.css`): set `--color-night-off` to `#868c86`, which is 5.35:1.

**9. Category colours as text or badge backgrounds fail contrast.** Screens D, E and F.

| Pair | Ratio |
|---|---|
| CategoryPin letter on white: 식 `#ff9a3c` | **2.11** |
| CategoryPin letter on white: 만 `#2fc7a0` | **2.14** |
| CategoryPin letter on white: 카 `#b58656` | 3.23 |
| CategoryPin letter on white: 영 `#4f8bff` | 3.25 |
| CategoryPin letter on white: 술 `#8c7bff` | 3.29 |
| White 10px letter on the same colours (KingMarker badge) | same ratios |
| White "홍대입구역" on `--color-station #2db400` | **2.75** |
| F "실시간" `--color-live #ff5a4e` on `#f2f3ef` | **2.76** |
| "경의선숲길" `#6e8a4e` on park `#dcebc8` | 3.10 |

- Fix:
  - In `MapArt.tsx` `CategoryPin` and `AreaMap.tsx` `KingMarker`, use ink `#111412` text on the category colour, or add darker `--color-cat-*-text` tokens: food `#b35a00`, comic `#0f7a60`, cafe `#8a5f35`, movie `#2461d6`, bar `#5b47e0`, all at least 4.5:1 on white.
  - For the station label use `bg-[#1f7d00]` (5.26:1).
  - For "실시간" on light backgrounds use `text-[#c4302a]` (4.95:1).

**10. Map screens (D, E) at 360x740: the bottom card and zoom control sit on top of map pins.**
- Evidence:
  - `D_rankmap_360x740_frame.png`: the 관악구 "5" cluster and the 강남 "my throne" pin sit under the 76px summary card. The overlap scan reports the 관악구 link overlapping the card by 57x44px, and 송파구 "14" overlapping the zoom control by 13x30px.
  - `D_rankmap_360x740.png`: the 강남 crown pin is half-hidden behind the zoom control.
  - `E_area_360x740_frame.png`: the "9회 · 필름 동아리" marker is covered by the carousel (64x63px overlap), and a plain "식당" pin is under the carousel even without the frame.
  - `D_320x568.png`: the zoom control covers cluster "9", and the card covers "14" and "11".
- Cause: `MapBoard` uses fixed Figma coordinates on an 844px-tall board, but on a 740px screen the bottom UI moves up 104px.
- Fix (`src/components/MapArt.tsx` `MapBoard` plus the pages):
  - Scale the board's y-coordinates to the space available: `transform: scale(min(1, (100dvh - topUI - bottomUI)/boardH))` with `transform-origin: top center`.
  - Alternatively, make the board pannable (`overflow:auto` on the board wrapper, with `pointer-events-auto`) so hidden pins can be dragged into view.
  - Short term: add `pointer-events-none` to the empty space around the carousel (it is already transparent) and move the zoom control to `top: at(212)`, under the live badge.

**11. The tab bar layout breaks below about 352px width.** The Home and My tabs are pushed off-screen.
- Evidence: `A_320x568.png` and `G_320x568.png`. The "홈" item starts at x=−16 and "마이" ends at x=336 on a 320px screen. Items are placed at fixed `calc(50% ± 146px)` offsets.
- Fix (`TabBar.tsx`): replace the absolute offsets with `grid grid-cols-5 place-items-center`, keeping the FAB in column 3. The Figma spacing is preserved at 390px and nothing clips at 320px.

**12. On the map screens, keyboard focus reaches every map pin before the search box and filter chips.** Screens D and E.
- Evidence: `focus_rankmap_search_360x740.png`. The first Tab lands on the "마포구 23" cluster, and there are 10 clusters on D (5 kings plus pins on E) before the search, "순위" or chips. This happens because `MapBoard` comes first in the DOM.
- Fix (`RankingMap.tsx`, `AreaMap.tsx`): render the header, search and chips before `<MapBoard>` in the JSX. They are absolutely positioned, so nothing moves visually. Also add a "skip to list" link, or give the map region `role="region" aria-label="지도"`.

### P2

**13. F: in the ranking row the gap badge and fixed-width bar squeeze the group name to about 3 characters.**
- Evidence: `F_place_360x740.png` shows "대학 동…" (`scrollWidth 86 > clientWidth 67`). `long_F_place_360x740.png` shows "서울대학…".
- Fix (`PlaceKing.tsx`):
  - Change the badge margin `ml-[24px]` to `ml-[8px]`.
  - Change the bar to `w-[56px]` at small widths (`w-[56px] min-[380px]:w-[70px]`).
  - Give the name `flex-1`.
  - Also shorten the badge text to "−2회".

**14. B: the mini heat-map inside the "시간 정하는 중" card overflows and is clipped at 360 and 390.**
- Evidence: `B_group_360x740.png` (the right-most column is cut at the card edge). There are 7 columns of 17px plus 6 gaps of 3px = **137px**, but the slot is only 126px wide at 360.
- Fix (`GroupDetail.tsx` `MiniHeat`): use `grid grid-cols-7 gap-[3px] w-full` with cells `h-[12px] w-full` so it scales to the card.

**15. B: in the "완료" card, "1등 도윤" wraps to two lines at 360** (the element measures 20x30px).
- Evidence: `B_group_360x740.png`.
- Fix (`GroupDetail.tsx`): add `whitespace-nowrap truncate min-w-0` to the winner `<span>`, or reduce the `AvatarStack` to 2 avatars below 380px.

**16. E: the first carousel card snaps flush against the screen edge, losing the 24px gutter.**
- Evidence: `E_area_360x740.png`, `E_area_430x932_edges.png`. `scrollLeft=24` on load and `firstCard.x=0`. `snap-start` aligns cards to the scrollport edge because no scroll padding is set.
- Fix (`AreaMap.tsx`): add `scroll-px-6` to the carousel container.

**17. Horizontal chip rows and the E carousel have no visible cue that they scroll, and on desktop they can't be scrolled without Shift+wheel.**
- Evidence: at 360, the "영화관" chip on D/E is cut at x=334–398 and the scrollbar is hidden by `.no-scrollbar`. At 1280, the E carousel is 1496px wide inside a 430px scrollport with no scrollbar or arrows.
- Fix:
  - Add a right-edge fade mask to `ChipRow` in `Chip.tsx`: `[mask-image:linear-gradient(90deg,#000_85%,transparent)]`.
  - On pointer:fine devices, show a thin scrollbar: `@media (pointer:fine){ .no-scrollbar{scrollbar-width:thin} }` in `index.css`.
  - Add prev/next buttons to the E carousel.

**18. Tap targets below 44px** (WCAG 2.5.8 is met at ≥24px, but these miss the iOS/Android 44/48dp guideline):

| Control | Size |
|---|---|
| D zoom `+` / `–` | **13x30 and 12x30**, and they have no handler |
| B bucket chips | 28–30px tall |
| C step chips | 28–30px |
| Filter chips on A, D, E, G | 34–36px |
| `IconButton` default (A 메뉴, B 뒤로/더보기, C 뒤로/공유) | 40x40 |
| G "지도로 보기" | 38px |

- Fix:
  - `RankingMap.tsx`: give the zoom buttons `size-[44px] flex items-center justify-center`.
  - `IconButton.tsx`: change the default `size = 40` to `44`.
  - `Chip.tsx`: add `min-h-[36px]` for `sm` and pad the hit area with `relative after:absolute after:-inset-y-[6px] after:content-['']` to reach 44px without changing the visuals.

**19. C: the step indicator is built from toggle buttons that do nothing.**
- Evidence: "① 시간 확정" is a `<button aria-pressed="true">` with no `onClick`, and "③ 레이스" is a `<button aria-pressed="false">`. Screen readers announce them as toggle buttons.
- Fix (`MeetingDetail.tsx`): render the steps as `<ol aria-label="진행 단계">` with `<li>` items, put `aria-current="step"` on step ②, and add a visually hidden "완료" to step ①. Do not use `Chip` here.

**20. There is no custom focus style, and the map search box shows no focus indicator at all.**
- Evidence: `focus_home_tab7_360x740.png`. Only the browser's default `outline:auto` is used, and it is thin and inconsistent across the lime, cream, dark and photo backgrounds. The D search `<input>` has `outline-none`, and its `<label>` wrapper has no `:focus-within` style.
- Fix (`src/index.css`, in `@layer base`): add `:focus-visible { outline: 2px solid var(--color-lime); outline-offset: 2px; }` and, for light screens, `.bg-paper :focus-visible, .bg-white :focus-visible { outline-color: var(--color-ink); }`. In `RankingMap.tsx`, add `focus-within:ring-2 focus-within:ring-ink` to the search `<label>`.

### P3

**21. Accessible names are noisy or ignored.**
- `Photo` placeholders announce "사진 자리" on every card. `Avatar` initials inside links produce link names like "왕 1곳 회사 점심팟 장소 투표 중 지 도 서 +2".
- `CategoryPin` puts `aria-label` on a role-less `<span>`, which is ignored or prohibited in ARIA 1.2.
- Fix:
  - `Photo.tsx`: when there is no `alt`, render `aria-hidden` instead of `role="img" aria-label="사진 자리"`.
  - `MyGroups.tsx` `GroupCard`: wrap the `AvatarStack` in `aria-hidden` and add an sr-only "멤버 {memberCount}명".
  - `MapArt.tsx` `CategoryPin`: add `role="img"` or make it `aria-hidden`.

**22. The page `<title>` is always "where2meet", and focus is not moved on route change** (WCAG 2.4.2). Screen-reader users get no cue that the screen changed.
- Fix: add a small `useTitle('모임 상세 · where2meet')` in each page and focus the page `<h1>` (`tabIndex={-1}`) on mount. D and E have no `<h1>`: add sr-only `<h1>서울 왕좌 지도</h1>` and `<h1>홍대 · 연남 왕좌 지도</h1>`.

**23. A: "ink/60" status text on lime cards is 4.46:1,** just below 4.5 at 11px.
- Fix (`MyGroups.tsx` `GroupCard`): change `text-ink/60` to `text-ink/70` (6.19:1).

**24. Time-grid availability is shown only by colour, and the lowest levels are nearly invisible.** A 17% lime cell on `#1a1d1b` is 1.59:1 against the card, and adjacent levels (17% vs 26%) are 1.32:1 (the non-text requirement is 3:1). The `aria-label` gives the percentage, but sighted low-vision users cannot tell 17/26/45% apart.
- Fix (`MeetingDetail.tsx`): use a stepped scale with a minimum alpha of 0.25 and at least 4 distinct steps, and/or print the available count ("3/4") inside cells of 28px or taller (see item 4).

**25. Landscape and 430px-wide map edges.**
- In landscape (740x360, `E_740x360.png`), the map screens are `h-dvh overflow-hidden`, so the carousel covers about 60% of the map and nothing scrolls.
- At 430px, the 390px-wide map artwork leaves 20px plain bands on both sides (`E_area_430x932_edges.png`).
- Fix: in `index.html`, lock orientation via the manifest (`"orientation":"portrait"`) or add `@media (orientation:landscape) and (max-height:500px)` that hides the carousel behind a toggle. In `MapArt.tsx`, draw the art with `width="100%" preserveAspectRatio="xMidYMid slice"` so it bleeds to 430px.

---

## Suggested fix order

1. **Tab bar, in one PR:** items 1 and 11 (`TabBar.tsx`, `TabBarSpacer`, `fromBottom`).
2. **Sticky bar:** item 2 is a one-word change in `Screen.tsx`.
3. **Contrast tokens:** items 7, 8, 9 and 23 are mostly `index.css` changes.
4. **Time grid rework:** items 4, 5 and 24 (`MeetingDetail.tsx`).
5. **Map-screen layout for short screens:** items 10, 12, 16 and 17.

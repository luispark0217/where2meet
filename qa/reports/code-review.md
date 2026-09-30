# where2meet — Frontend code review

Reviewer: senior FE (independent). Scope: `src/` (React 19 / Vite 8 / TS / Tailwind v4 / react-router 7 HashRouter), build output `dist/`.
No source files were modified.

## What was checked

| Check | Result |
|---|---|
| `npx tsc -b` | clean (exit 0) |
| `npx oxlint src` | 4 warnings, 0 errors: 3x `only-export-components` (MapArt.tsx:75, :78, RankingMap.tsx:14), 1x `exhaustive-deps` (useApi.ts:7) |
| `npm run build` | ok. JS 310 KB (96 KB gzip), CSS 107 KB (33 KB gzip), 124 woff2 files, dist 4.1 MB |
| Tailwind classes | A script pulled **every** class token out of `src/**/*.tsx` and looked for its selector in `dist/assets/index-*.css`. **Every class generates CSS**, including the ones flagged as suspicious: `bg-white/8`, `shadow-float`, `shadow-soft`, `shadow-sheet`, `bg-lime/45`, `from-night/0`, `to-night`, `text-ink/60`, `text-ink/70`, `bg-ink/50`, `border-station`, `bg-station`, `bg-map-2`, `text-lime-deep`, `bg-gradient-to-b`, `from-[#6e6e6e]`, `placeholder:text-paper-muted`, `border-[2.5px]` and the rest. The Tailwind problems that do exist are about **class conflicts** (items 5 and 6), not classes that fail to generate. |
| Runtime | Headless Chromium (Playwright) against `dist/`, at 375x667 and 430x932. Items 1, 2, 3, 4, 5, 6 and 7 were reproduced this way. |

---

## Findings (prioritized)

### HIGH

**1. The back button on a directly opened link leaves the app (goes to `about:blank`).**
`src/pages/PlaceKing.tsx:31`, `AreaMap.tsx:40`, `GroupDetail.tsx:41`, `MeetingDetail.tsx:20`, `ComingSoon.tsx:12`. All of these use `onClick={() => nav(-1)}`.
Verified: open `#/place/p-wine` in a new tab and tap ←. The tab ends up on `about:blank`. Shared links (KakaoTalk and similar) are the main way people arrive at `/meet/:id`, so this path is common.
Fix: add one hook and use it everywhere.
```ts
// src/hooks/useBack.ts
export function useBack(fallback = '/') {
  const nav = useNavigate(); const loc = useLocation()
  return () => (loc.key === 'default' ? nav(fallback, { replace: true }) : nav(-1))
}
```
Suggested fallbacks: meet → `/group/:groupId`, place and area → `/ranking`, group → `/`.

**2. The meeting detail page is empty for 4 of the 5 meetings, and its step chips are hardcoded.**
`src/pages/MeetingDetail.tsx:25-32`.
`TimeCard` renders only when `m.availability` exists, and `PlaceCard` only when `m.midpoint` exists. Only `m-fri` has either. Verified: `#/meet/m-mt`, `m-bday` and `m-study` render 0 `<section>`s. The screen shows only the header, the chips and the "약속 확정하고 공유하기" button. Every card on the group screen except one leads to this dead end.
The step indicator is also always "① 시간 확정 / ② 장소 정하는 중", whatever `m.stage` is. For example, `m-mt` has `stage: 'time'` but the chips say the time is already confirmed.
Fix:
- Derive the steps from `m.stage`.
- Give each stage a fallback, such as a "time voting" card for `time`, a place summary for `confirmed`, and a result or winner view for `done`, or at least an explicit "디자인 준비 중" block.
- Add mock `availability` for `m-mt`.

**3. `useApi` has no real loading, error or not-found handling, and no page renders any of those states.**
`src/api/useApi.ts:4-14`. Every page ignores `loading` and `error`.
- If the API resolves `undefined` (the contract for a missing group, meeting or place), `loading` stays `true` forever and the page renders blank. Verified: `#/group/g-nope` has no `<h1>`; `#/meet/m-nope` shows an empty title.
- When deps change, `data` is not cleared. `PlaceKing` → "다른 왕좌" → `/place/p-roast` reuses the same component instance, so the old place stays on screen until the new response arrives. If that request fails, the old place stays indefinitely and the error is never shown.
- Under StrictMode the effect runs twice in dev. With real `fetch` that means duplicate requests and no cancellation.
- Smaller symptoms: `AreaMap.tsx:43` shows "왕좌 0곳" while loading, and headers flash empty.

Fix: a status-based hook with abort, plus a shared `<PageState>` (skeleton / error + retry / "찾을 수 없어요" + home link) used by every page.
```ts
type State<T> = { status: 'loading' } | { status: 'ok'; data: T } | { status: 'notFound' } | { status: 'error'; error: unknown }
export function useApi<T>(load: (signal: AbortSignal) => Promise<T | undefined>, deps: unknown[]) {
  const [s, set] = useState<State<T>>({ status: 'loading' })
  const ref = useRef(load); ref.current = load
  useEffect(() => {
    const ac = new AbortController(); set({ status: 'loading' })
    ref.current(ac.signal).then(
      (d) => !ac.signal.aborted && set(d === undefined ? { status: 'notFound' } : { status: 'ok', data: d }),
      (e) => !ac.signal.aborted && set({ status: 'error', error: e }))
    return () => ac.abort()
  }, deps) // eslint-disable-line
  return s
}
```
Also pass the `signal` through from the `api.*` functions so 재운 can hand it to `fetch`.

### MEDIUM

**4. The mock `placeKing` silently returns the wrong place.**
`src/api/index.ts:37`: `mock.placeKings[placeId] ?? mock.placeKings['p-wine']`.
Verified: `#/place/p-roast` (linked from the area map cards and from "다른 왕좌") shows **동교동 와인바**. QA will file this as a bug, and the fallback hides not-found cases from the backend developer.
Fix: return `undefined`, and add mock entries for `p-roast`, `p-pasta`, `p-comic`, `p-cinema` and `p-lp`, or build them from `hongdaePins`.

**5. The `Screen` background class loses to its own default: `bg-map` and `bg-map-2` never apply.**
`src/components/Screen.tsx:9`, used by `RankingMap.tsx:26` (`className="... bg-map"`) and `AreaMap.tsx:30` (`bg-map-2`).
The element gets both `bg-paper` and `bg-map`/`bg-map-2`. In the built CSS `.bg-paper` comes after both of them (byte offsets 95851 vs 95507 / 95549), so paper wins. Verified: at 430 px width the computed background on `/ranking` and `/ranking/area/hongdae` is `rgb(244,245,241)` (paper), not the map color. On phones wider than 390 px (Pro Max, most Android devices) the 390 px map board has 20 px paper-colored bands on each side. `PlaceKing`'s `bg-white` only wins because it happens to sort later.
Fix: stop stacking utilities for the same property. Make the prop decide:
```tsx
const BG = { night: 'bg-night text-white', paper: 'bg-paper text-ink', map: 'bg-map text-ink', map2: 'bg-map-2 text-ink', white: 'bg-white text-ink' } as const
export function Screen({ bg = 'night', ... }: { bg?: keyof typeof BG; ... })
```
Alternatively, add `tailwind-merge`. The same accidental ordering is what makes `IconButton`'s `shadow-float` plus `className="shadow-soft"` (`GroupDetail.tsx:41`) work today.

**6. The "내 모임" bar in the ranking list never sticks.**
`src/pages/RankingList.tsx:51`, caused by `Screen.tsx:9`.
`Screen` has `overflow-x-hidden`, which forces `overflow-y: auto`. That makes `Screen` the sticky container, and because `Screen` never scrolls (the document does), `sticky` behaves like `relative`. Verified at 375x667: the bar sits at y=646. It should be at 547 (`bottom: 64px`), so it is hidden behind the tab bar until the user scrolls to the end.
Fix: in `Screen`, change `overflow-x-hidden` to `overflow-x-clip`. `clip` does not create a scroll container.

**7. Unknown URLs silently render Home at the wrong address.**
`src/App.tsx:36`: `<Route path="*" element={<MyGroups />} />`.
Verified: `#/does/not/exist` shows "내 모임" with the Home tab active while the URL stays wrong. Refresh, share and back all carry the bad URL around.
Fix: `<Route path="*" element={<Navigate to="/" replace />} />`, or a small NotFound screen with a home link.

**8. Gaps in the API contract that will bite the backend handoff.**
- `src/api/index.ts:31`: `myThrones` has no return type, and its shape (`{ total, groupName, breakdown }`) exists only in `mock.ts:98`. Add `export interface MyThrones` to `types.ts` and annotate the return.
- `types.ts:121`: `MyRankSummary` has no `groupId`, so `RankingList.tsx:51` hardcodes `to="/group/g-uni"`. Add `groupId: ID`.
- `api/index.ts:34`: `areaKings(_area)` ignores the area. `AreaMap.tsx:42` hardcodes the title "홍대 · 연남". `RankingMap.tsx:82` sends every district cluster to `/ranking/area/hongdae`. `MeetingDetail.tsx:92` hardcodes the same link. Return `{ area: { slug, name }, pins }` from the API, add a `slug` (or `areaId`) to `DistrictCluster`, and build the links from the data.
- `KingPin.x/y` are pixels on the 390x844 Figma board, while `DistrictCluster.x/y` are 0-1 ratios. Document both units in `types.ts`, or align them (preferably lat/lng with a projection helper) before 재운 fills them in.
- `Meeting.responded` duplicates `subText` (`mock.ts:41`) and is never read. Either remove it or state which one is canonical.

**9. Controls that do nothing are rendered as enabled buttons.**
- `MeetingDetail.tsx`: the step `Chip`s at 26-28 are `<button aria-pressed>` with no `onClick`; 공유 at 22; "약속 확정하고 공유하기" at 34; "↔ 줄다리기" at 91.
- `MyGroups.tsx:29`: 메뉴.
- `GroupDetail.tsx:42`: 더보기.
- `PlaceKing.tsx:32`: 공유.
- `RankingMap.tsx`: zoom +/– at 56-58, search input at 42, and category chips at 48. `cat` state is set but never used, so the filter changes nothing.

A mock is expected to have stubs, but QA and the backend developer cannot tell stubs from bugs.
Fix:
- Mark each stub with `// TODO(backend|design):` and either `aria-disabled` or a shared `onClick={notReady}` toast ("준비 중이에요").
- Render the step indicator as a non-interactive `<ol>` rather than `Chip` buttons.
- Wire the RankingMap filter to `api.districtClusters(cat)`, or hide the chips.

**10. Tapping a time cell says "확정" (confirmed) even though only a local selection changed.**
`src/pages/MeetingDetail.tsx:45-46`.
Tapping any cell changes the badge to "금 17:00 확정" with no confirmation or API call. The user reads this as a committed decision.
Fix: keep "확정" only for the server value (`m.timeConfirmedLabel`). Show the local pick as "선택: 금 17:00" and expose an `onPick` callback, which will become a `POST /meetings/:id/availability` later.
Also, `useState(av.picked)` is seeded from props and never resynced. Key the card by meeting: `<TimeCard key={m.id} … />`.

**11. The README is still the Vite template boilerplate.**
`README.md`. For a handoff deliverable this is the first file the backend developer opens.
Replace it with:
- how to run, lint and build;
- the route table (currently in the `App.tsx:11-21` comment);
- "all data goes through `src/api/index.ts`, shapes in `src/data/types.ts`";
- the `?frame=1` Figma overlay mode;
- the list of stubbed controls (item 9).

**12. Backend image URLs are injected into CSS `url()` unquoted.**
`src/components/Avatar.tsx:23` and `src/components/Photo.tsx:17`: `` `center/cover url(${src})` ``.
A URL containing spaces, `(`, `)` or `'` (common in S3 or CDN keys with Korean filenames) breaks the whole `background` declaration and the image disappears. It also lets data control CSS.
Fix: `` `center/cover url("${encodeURI(src)}")` ``, or better, render an `<img className="size-full object-cover" alt="">` inside the circle, which also gives lazy loading.

### LOW

**13. The countdown mock and `useCountdown` have small problems.**
- `mock.ts:39`: `tugEndsAt: Date.now() + 42*1000` is evaluated when the module is imported, so 42 s after the app loads the card permanently shows "줄다리기 끝". Compute it lazily in `api.meeting`.
- `MeetingDetail.tsx:98-108`: the interval keeps running after it reaches 0, and when `endsAt` changes, `s` stays stale for 1 s.
Fix: `setS(calc())` immediately inside the effect, and `clearInterval` once it hits 0.

**14. The time grid's ARIA structure is invalid.**
`MeetingDetail.tsx:53-57`. `role="grid"` contains the corner `<span>` and the day headers outside any `role="row"`, and the rows use `display: contents`. Screen readers will misreport the grid.
Fix: wrap the header in `<div role="row" className="contents">` with `role="columnheader"` cells, give the hour labels `role="rowheader"`, and add `aria-label` or `aria-selected` only on the gridcells. The 18 px-high tap targets are also well under the 44 px guideline. Consider a larger hit area using padding and a negative margin.

**15. The top-left header shifts when data loads.**
`MyGroups.tsx:27-29`. While `me` is loading, `justify-between` has only one child, so the menu button renders on the **left** and then jumps right. With a real network this is visible.
Fix: `{me ? <Avatar …/> : <span className="size-[42px]" />}`.

**16. The placeholder photo is announced even when it is decorative.**
`Photo.tsx:6`: `aria-label={alt || '사진 자리'}` turns `alt=""` into a label. Every group card link (`MyGroups.tsx:64`) starts its accessible name with "사진 자리".
Fix: `{...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}`.

**17. `CategoryPin` puts `aria-label` on a plain `<span>` with no role.**
`MapArt.tsx:82`. The label is ignored or prohibited on generic elements, so the pin reads as "카" / "식". Add `role="img"`, or use `aria-hidden` since the pins are decorative.

**18. The category typing is loose, and the lint warnings come from here.**
- `MapArt.tsx:75,78`: `CAT_COLOR` and `CAT_SHORT` are `Record<string, string>`.
- `CategoryPin` has `cat: string`, and `AreaMap.tsx:19` uses `PLAIN: [string, …]`.
- `RankingMap.tsx:14`: `PLACE_FILTERS` repeats `PlaceCategory` by hand and is exported from a page component, which causes the `only-export-components` warnings.

Fix: move these into `src/data/categories.ts` as `Record<PlaceCategory, …>` and `['전체', ...PLACE_CATEGORIES] as const`. A typo such as `'바'` will then fail `tsc` instead of rendering an uncolored pin.

**19. Required route params have defaults that hide bugs.**
`GroupDetail.tsx:24` (`id = 'g-uni'`), `MeetingDetail.tsx:12` (`'m-fri'`), `PlaceKing.tsx:15` (`'p-wine'`), `AreaMap.tsx:23` (`'hongdae'`). The routes require `:id`, so these defaults never apply. They only suggest a fallback that does not exist. Use `const { id } = useParams() as { id: string }`, or handle a missing id through the not-found state.

**20. Some code is dead or left over.**
- `mock.ts:19` + `:46`: `const hour` is only kept alive by `void hour`. Delete both.
- `useApi.ts:12` and `MeetingDetail.tsx:105`: `// eslint-disable-next-line react-hooks/exhaustive-deps`. The project runs oxlint, not ESLint, and oxlint still warns on useApi.ts:7. Use `// oxlint-disable-next-line …`, or rewrite as in item 3.
- `Meeting.bucket` `'upcoming'` has no mock data, so the "예정" tab is always empty. Add one mock meeting so the empty state is not the only state reviewers see.

**21. The podium columns shift when there are fewer than 3 entries.**
`RankingList.tsx:42`: `[podium[1], podium[0], podium[2]].map((e,i) => e && …)` drops the missing slots, so with 1 or 2 groups the winner moves to column 1.
Fix: render `<div key={i} />` for the empty slots.

**22. Colors are hardcoded where tokens already exist.**
- `MeetingDetail.tsx:110`: `FILL` duplicates the avatar colors in `Avatar.tsx:3`.
- `MidpointMap` and `MiniMap` use `#c6f432`, `#111412` and `#fff`.
- Gradients use `rgba(198,244,50,…)` (`AreaMap.tsx:78`, `PlaceKing.tsx:25`, `MeetingDetail.tsx:65`).

Changing `--color-lime` in `index.css` (which the file header promises is the only place to edit) will not update these.
Fix: use `var(--color-*)`, and `color-mix(in oklab, var(--color-lime) 40%, transparent)` for the alpha variants. Export the avatar color map from one module.

**23. Tailwind v4 naming (informational).**
`GroupDetail.tsx:38` and `PlaceKing.tsx:38` use the v3 name `bg-gradient-to-b`. It still generates (verified), but the v4 canonical name is `bg-linear-to-b`. Rename it for consistency with the v4 docs.

**24. Fonts and bundle size: acceptable, with optional improvements.**
- **Fonts:** of the 124 woff2 files, only **20 subsets** match every character in the UI source, because of `unicode-range`. The browser downloads roughly 20 x 50 KB at most, not 4 MB, so the font count by itself is not a problem.
  - However, 80 KB of the 107 KB CSS is `@font-face` rules, and it blocks rendering.
  - Optional: import only `@fontsource-variable/noto-sans-kr/wght.css` in a separate `<link rel=stylesheet>`, or switch to a single dynamic-subset CDN font such as Pretendard.
  - In any case, add `font-display: swap`. Fontsource already sets it, so just confirm it is kept.
- **JS:** 310 KB in one chunk. If it grows, `React.lazy` the map pages (D/E/F).

**25. Minor semantics.**
- `TabBar.tsx:15`: `aria-label` duplicates the visible label. Harmless, but remove it so a future label change cannot drift.
- `GroupDetail.tsx:54-66`: the `<dl>` puts `<dd>` before `<dt>` inside a `<div>`. That is valid HTML, but the value is read before the term. Swap the order in the DOM and use `flex-col-reverse` or `order-*` to keep the visual order.

---

### Suggested order of work
1. Items 1, 2, 3, 4 and 7: routing and data states. These are the ones QA will hit immediately.
2. Items 5 and 6: one-line `Screen` fixes (`overflow-x-clip`, a `bg` union).
3. Items 8, 9, 11 and 12: handoff hygiene for 재운.
4. The remaining low-severity items as cleanup.

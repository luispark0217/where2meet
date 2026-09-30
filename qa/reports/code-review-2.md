# where2meet: Frontend code review 2 (screens H–S)

Reviewer: senior FE, working independently. Scope: commit `2247075 H-S screens + wiring`, which covers `src/pages/new/*`, `src/api/{tug,me,social}.ts`, `src/components/{tug,me,social}/*` and their wiring into A–G. No files under `src/` were modified.

## What was checked

| Check | Result |
|---|---|
| `npx tsc -b` | Clean (exit 0). |
| `npx oxlint src` | 1 warning (`useApi.ts:12` exhaustive-deps, pre-existing). No new warnings. |
| `vite build` → `dist-cr` | OK. JS 385 KB (116 KB gzip), CSS 123 KB. `dist-cr` has been deleted. |
| Tailwind classes | I extracted every class token in the new files and looked it up in the built CSS. **All of them generate**, including `py-[7px]!`, `aria-disabled:opacity-60`, `[&>li+li]:before:*`, `focus-within:outline-lime` and `bg-white/12`. The one real Tailwind v4 bug is a cascade/variable problem, item 9. |
| Runtime | Playwright (Chromium) against the build served on :4192, at 390×844 and 360×740. No page errors or console errors. No horizontal overflow at 360px on any new route. Every item marked **(verified)** was reproduced this way. |

---

## HIGH

**1. Tug deadlines come from three separate mocks, so every screen shows a different countdown. (verified)**
`src/api/index.ts:27` (`midpoint.tugEndsAt`), `src/api/tug.ts:143` (`board.endsAt`) and `src/api/social.ts:116` (`chat.tug.endsAt`) each compute `Date.now() + 42_000` at the moment they are called.
- Verified: Chat shows `0:37`. Tapping "보러가기" opens Tug, which shows `0:42`.
- There are also three countdown hooks with different rounding: `tug/useCountdown.ts:5` uses `ceil`, while `Chat.tsx:162` and `MeetingDetail.tsx:132` use `round`.

For 재운 this also blurs the contract: which endpoint owns the deadline?

Fix:
- In mock data, set one module-level `export const TUG_ENDS_AT = Date.now() + 42_000` in `data/mock.ts` and have all three APIs read it.
- The real API should expose the deadline in exactly one place, `GET /meetings/:id/tug`. Chat and MeetingDetail should read it from there, or keep `midpoint.tugEndsAt` documented as a mirror.
- Delete the two local `useCountdown` copies and keep `components/tug/useCountdown.ts`, moved to `components/useCountdown.ts` (see item 12).

**2. The same place has two IDs, and 10 of 12 place-list rows lead to "장소를 찾을 수 없어요". (verified)**
- `api/tug.ts:102` uses `p-roastery` for 연남 로스터리.
- `data/mock.ts:54,77`, `social.ts` (chat card) and `me.ts` (alerts) all use `p-roast`.
- `PlaceList.tsx:117` links every row to `/place/${p.id}`. Only `p-pasta` and `p-wine` exist in `placeKings`.
- Verified: `#/place/p-roastery` and `#/place/p-dumpling` both show the not-found screen.

Fix:
- Rename to `p-roast` in `tug.ts` (candidate list and vote).
- Either add minimal `placeKings` entries for the other candidates, or render candidates that have no king as a non-link or open a place sheet.
- Tell 재운 that the place ID is global: the same ID is used across candidates, kings and chat.

**3. All the new meeting screens only work for `m-fri`, while the A–G screens link to them for every meeting. (verified)**
- `tug.ts:139,151,158` and `social.ts:79,94` return `undefined` for any ID other than `m-fri`.
- `MeetingDetail.tsx:124-125` shows "장소 리스트 보기" for every meeting that has a midpoint.
- `MeetingDetail.tsx:61` sends stage `place` (`m-lunch`) to Share.
- Verified dead ends: `#/meet/m-lunch/places`, `#/meet/m-bday/places`, `#/meet/m-lunch/tug`, `#/meet/m-mt/chat`, and m-lunch "약속 확정하고 공유하기" leads to a share sheet that says "약속을 찾을 수 없어요".

Fix (mock only): key the mocks by meeting and fall back to generic data built from `mock.meetings`, as `socialApi.challenge` already does from `placeKings`. At minimum, hide the entry points (the places button and the share CTA) when the meeting is not `m-fri`.

**4. The handoff docs still say "only `src/api/index.ts`", and about 20 new endpoints are undocumented.**
- `docs/API.md:14` still says "src/api/index.ts ← ★ 여기만 바꾸면 됨". README line 3 says the same. README's folder list does mention the new files.
- `docs/API.md` has no section for `tugApi.*`, `meApi.*` or `socialApi.*`. Its only mention of tug is `docs/API.md:197` `POST /api/meetings/:id/tug {direction|stationId}`, which contradicts `tugApi.pull` → `POST …/tug/pull` with no body.
- Missing entirely: the "이 장소로 확정" call (`PlaceVote.tsx:42-46` only toasts and navigates; `API.md:198` documents `POST /meetings/:id/confirm`), Challenge "알림 받기" (`Challenge.tsx:20`), and the 대표 칭호 choice (`My.tsx:54`). All three are local-only state with no API function.

Fix:
- Add §3.12+ to `API.md`, one row per function in `tug.ts`, `me.ts` and `social.ts` (method, path, request, response type name).
- Reconcile the tug endpoint.
- Add `tugApi.confirm(meetingId, placeId)`, `socialApi.watchThrone(placeId, on)` and `meApi.setMainTitle(title)` as mock functions so every button has a seam.

**5. `?pulled=1` is used both as a design-review switch and as real state. It will double-count pulls against a real backend.**
`Tug.tsx:27-28,36,50`:
- `stepIdx` comes from the URL.
- `pullsLeft = pullsTotal - pullsUsed - stepIdx`.
- `pull()` writes `?pulled=1` without reading anything back from the server.

Verified: after a pull, a reload keeps showing R ("1번 남음"). Once `tugApi.pull` is real, `board.pullsUsed` will already include the pull, and the URL subtracts it again. The response `{ ok }` is ignored.

Fix:
- Have `pull()` return the new `TugBoard` (or `{ pullsUsed, step }`) and store it in state.
- Keep `?pulled=1` only as a mock override inside `tugApi.board` (for example `tugApi.board(id, { preview: 'R' })`), not in the page logic.
- Use `endsAt` from the server as-is. Drop the `- 4000` offset at `Tug.tsx:31`, or move it into the mock as well.

**6. Sheet routes (K `/new`, S `/meet/:id/share`) re-mount their background page, so its state and the page title are lost. (verified)**
`CreateSheet.tsx:31` renders `background={<MyGroups />}` and `Share.tsx:40` renders `background={<MeetingDetail />}`. Both are **new instances**.
- Verified: on A, pick the "동아리" filter and tap +. The background shows "전체". After closing the sheet, A is still reset to "전체", and focus lands on `<body>`. `BottomSheet.tsx:26,46` restores focus to an element that has already been unmounted.
- Verified: on `#/meet/m-fri/share`, `document.title` is "금요일 저녁 · where2meet", not "공유하기". The background `Screen` title effect (`MeetingDetail.tsx:36`, deps `[title]`) fires after data loads and overwrites `Share.tsx:27`.
- The background also re-runs `api.myGroups` and `api.me` in addition to CreateSheet's own calls, so there are duplicate requests once these are real.

Fix, small version: add a `BackgroundContext` in `BottomSheet`. `Screen` skips `document.title` when it is inside a background. Move the title into a `BottomSheet` `title` effect.
Fix, proper version: use React Router's background-location pattern. Navigate with `state: { background: location }`, render `<Routes location={background ?? location}>` plus a second `<Routes>` for sheets. The real page stays mounted with its state and focus target.

## MEDIUM

**7. Tug shows "마감" for one frame on load. (verified)**
`Tug.tsx:34-35` together with `useCountdown.ts:6-8`: the state is initialized while `endsAt` is still `undefined` (→ 0), so the first render after the board loads has `left = 0` and `over = true`.
Verified with a MutationObserver: the timer text sequence is `['마감', '0:42', '0:41']`. The interval also keeps ticking forever after reaching 0.
Fix: derive the value during render and use the effect only to tick.
```ts
const [, tick] = useReducer((n) => n + 1, 0)
useEffect(() => { if (!endsAt) return; const t = setInterval(tick, 1000); return () => clearInterval(t) }, [endsAt])
const left = endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : 0
```
Add `if (left === 0) clearInterval` if you want the interval to stop.

**8. Mock mutations are inconsistent, so likes and votes are lost when you navigate. (verified)**
- `meApi.markRead` and `updateSetting` (`me.ts:92,107`) and `socialApi.sendMessage` (`social.ts:122`) mutate module state, so they survive navigation.
- `tugApi.like`, `castVote` and `pull` (`tug.ts:147,154,168`) do not.
- Verified: liking 파스타집 (3→4), opening it and going back shows 3 again. Voting for 파스타집, then "+ 다른 장소 추가하기" and back, shows the vote on 로스터리 again.
- The pages keep optimistic overlays (`PlaceList.tsx:35`, `PlaceVote.tsx:23`, `Settings.tsx:14`, `Alerts.tsx:22`) and never roll back on failure.

Fix:
- Make `tugApi` mutate its module mock the way `meApi` does.
- Document one rule for 재운: "mutation returns the updated resource; the page replaces its data with it".
- Add a `catch` → revert and `toast` in the four pages.

**9. Tailwind v4: the `NewGroup` name input has no visible focus ring. (verified)**
`NewGroup.tsx:63` has `outline-none … focus-visible:outline-2 focus-visible:outline-lime`.
- In v4, `outline-none` sets `--tw-outline-style:none`, and `focus-visible:outline-2` emits `outline-style: var(--tw-outline-style)`, so the result stays `none`.
- Verified: `:focus-visible` matches, but the computed `outline-style` is `none`.
Fix: use `focus-visible:outline-solid focus-visible:outline-2 …`, or drop `outline-none` and rely on the base `:focus-visible` rule.
Related: `Chat.tsx:75-76` makes the message log focusable (`tabIndex={0}`) with `outline-none`. Verified: it receives focus with no indicator. Remove `outline-none` there.

**10. Mock data in different files contradicts itself.**
- `me.ts:59` alert a-1 says "연남 로스터리 · 필름 동아리가 1회 차이로 역전", but `mock.ts:77` has 대학 동기 모임 as king (23 vs 19), and Challenge `p-roast` says "우리가 왕".
- `me.ts:63` alert a-5 names "서교 만화방". The only 만화카페 is 홍대 만화방 (`mock.ts`), and its king is 보드게임 모임.
- `me.ts:78-83` gives 필름 동아리 9 members; `mock.ts:14` gives 8. The comment admits this.
- `tug.ts:14` voter 은호 (`u-eunho`) is not a member of g-uni (`mock.ts:13` has 하준).
- `tug.ts:10-12` re-declares 지민, 도윤 and 서아 instead of importing them. `social.ts` does it correctly with `uni.members`.
- m-fri "최대 차이" is 7분 on C (`mock.ts` midpoint) but 11분 on M (`tug.ts:60`).

Fix:
- Export the members from `mock.ts` (`export const people = { me, ji, do_, seo, ha }`) and import them everywhere.
- Change the a-1 copy to a place the user actually lost, or flip the `p-roast` ranking.
- Use one member count.
- Replace 은호 with 하준, or add 은호 to g-uni.

**11. The same resource is served twice, with different shapes.**
- `api.me` and `socialApi.me` (`social.ts:108`) are both `GET /api/me`.
- `api.myGroups` (`Group[]`, `GET /api/groups`) and `meApi.myGroups` (`MyGroupRow[]` with `role`, `GET /api/me/groups`) disagree on counts (item 10).
- 재운 would have to implement and keep in sync two endpoints for each.

Fix:
- Delete `socialApi.me` and use `api.me` in `Chat.tsx:19`.
- Add `myRole?: '방장' | '멤버'` to `Group` in `data/types.ts` and have `My.tsx` use `api.myGroups`. Delete `MyGroupRow` and `meApi.myGroups`.

**12. The three teams duplicated helpers.** Consolidation plan (move only, no behaviour change):

| Helper | Copies | Keep → move to |
|---|---|---|
| countdown | `tug/useCountdown.ts`, `Chat.tsx:161`, `MeetingDetail.tsx:131`; inline `mm:ss` in `Chat.tsx:66`, `MeetingDetail.tsx:109` | `components/useCountdown.ts` (with the item 7 fix) + `mmss` |
| toggle | `me/Toggle.tsx`, inline copy `NewGroup.tsx:92-95` | `components/Toggle.tsx`; NewGroup uses `<ToggleTrack on>` |
| king pill | `tug/KingTag.tsx`, inline `Chat.tsx:150-152`, `My.tsx:107-110` (`왕 N`) | `components/KingTag.tsx` with a `label` prop |
| thumb/photo | `tug/Thumb.tsx`, `Photo.tsx` | Keep both, but put them in `Photo.tsx` (`Photo`, `RoundPhoto`, `Thumb`) so all photo placeholders live in one file |
| Korean particles | `StateView.tsx:5` (`을/를`), `PlaceVote.tsx:15` (`으로/로`), `My.tsx:54` hardcodes `(으)로` | `src/lib/josa.ts` (`eul`, `ro`); use `ro(t)` in `My.tsx:54` |
| `delay` | `api/index.ts:9`, `tug.ts:8`, `me.ts:8`, `social.ts:8` | `api/mockDelay.ts` (one knob for simulating latency) |
| `at(y)` | `Tug.tsx:13`, `PlaceList.tsx:16`, `PlaceKing`, `GroupDetail`, `RankingMap`, `AreaMap` | `components/figma.ts` |
| sheet | `social/BottomSheet.tsx`, `copy.ts` | Not social-specific: move them to `components/BottomSheet.tsx` and `components/copyLink.ts` |

After this, `components/{tug,me,social}/` keeps only screen-specific pieces (`TugMap`, `useCoverScale`).

**13. Types for the new screens live in `api/*.ts`, and several break the rules in `docs/types-v2-proposal.ts`.**
README says `data/types.ts` is "the contract with the backend", but 20 new interfaces are in `api/tug.ts`, `me.ts` and `social.ts`. There are five overlapping place shapes: `Place`, `KingPin`, `CandidatePlace`, `SharedPlace` and `ThroneChallenge.place`. Specific rule breaks:
- Pixel coordinates from the server: `TugPlayer.x/y`, `TugStep.point/bubbleAt`, `CandidatePlace.pin`, `PlaceListInfo.center`. This breaks rule 3.
- A CSS value from the server: `TugStep.news.color = 'var(--color-av-yellow)'` (`tug.ts:62`). It should be `authorId`, and the page maps it to an avatar color.
- Pre-formatted labels, breaking rule 1: `AlertItem.timeLabel` and `section`, `ShareInfo.whenWhere`, `PlaceVoteInfo.deadlineLabel`.
- Names without IDs, breaking rule 4: `kingGroupName`, `MyProfile.topPlace`.

Fix:
- Move the types to `data/types.ts`, or re-export them from it with a header comment per screen.
- Mark the pixel, label and CSS fields `/** @mock-only: 서버는 lat/lng·ISO·id 로 */` so 재운 knows which fields to replace. Add a v2 section for them in `types-v2-proposal.ts`.

**14. Several new screens ignore load and error status.**
- `My.tsx:17`: if `groups` fails, the section silently disappears.
- `NewGroup.tsx:16`: if `draft` fails or is slow, there are no chips, and "모임 만들기" silently does nothing (`create` returns when `!draft`).
- `CreateSheet.tsx:16-17`: an empty chip row, and "약속 만들기 시작" then calls `soon()`.
- `Chat.tsx:19,77`: until `me` resolves, every message renders as someone else's and then jumps to the right.

Fix:
- Show `StateView` or a disabled CTA in NewGroup and CreateSheet.
- In Chat, render messages only when both `room` and `me` are loaded, or take `me` from a single app-level context (see item 11).

## LOW

**15. `Challenge.tsx:21-24` calls `toast` inside a `setState` updater.**
StrictMode runs updaters twice in dev, so this fires twice. A real side-effect there, such as an API call, would duplicate.
Fix: `const next = !notify; setNotify(next); toast(...)`.

**16. The long-press copy does not match the behaviour.**
`Tug.tsx:113` says "꾹 누르고 있으면 내 쪽으로 한 칸씩" (repeat), but `pressStart` (`:40`) fires once per hold. Verified: a 700 ms hold gives exactly one pull.
Fix: either repeat on an interval while the press is held (bounded by `pullsLeft`), or change the copy.

**17. The `py-[7px]!` override in `CreateSheet.tsx:59` works (verified `padding-block:7px!important`), but it patches `Chip` from outside.**
Fix: add a `Chip` size (for example `sm` with `py-[7px]`, or a new `smTall`) and remove the only `!` in the codebase.

**18. BottomSheet uses a hardcoded `id="sheet-title"` (`BottomSheet.tsx:59,65`).**
Fix: `const id = useId()`. This is harmless today, but sheets stacking (for example Share opened from Challenge later) would collide.

**19. Route params have hardcoded fallbacks: `const { id = 'm-fri' } = useParams()` (`Tug.tsx:22`, `PlaceList.tsx:28`, `PlaceVote.tsx:19`, `Chat.tsx:16`, `Share.tsx:23`) and `id = 'p-wine'` (`Challenge.tsx:14`).**
The routes always supply `:id`, so the fallback can only hide a wiring bug by showing m-fri data.
Fix: use `const { id } = useParams() as { id: string }`, or `if (!id) return <NotFound/>`.

**20. Dead code.**
- `src/pages/ComingSoon.tsx` is no longer imported anywhere, because H, I and K replaced it. Delete it and drop its mention in the README.
- `meApi.markRead` builds a module mock and `Alerts.tsx` also keeps its own `readHere` overlay. Once item 8's rule is adopted, one of the two is redundant.

**21. CreateSheet's "새 약속 잡기" card is a `<button aria-pressed="true">` that only moves focus to the chips (`CreateSheet.tsx:33`).**
Screen readers announce it as a toggle that is always on.
Fix: make it a static `<div>` heading, or a real radio if a second option such as "새 모임" is meant to be selectable.

**22. Toast position overlaps the Chat quick replies.**
`.w2m-toast` sits at `bottom: calc(90px + var(--tabpad))` (`index.css`), which falls on Chat's quick-reply row (about 100–130 px from the bottom).
Fix: allow `toast(msg, { offset })`, or set a CSS var (`--toast-bottom`) per screen, and use about 140px on Chat.

---

## Apply these first
1. **Item 2:** rename `p-roastery` → `p-roast` in `tug.ts`, and stop linking candidates that have no `placeKings` entry. A one-file fix that removes most of the dead ends.
2. **Items 1 + 7 + 12 (countdown row):** one `components/useCountdown.ts` with render-derived `left`, and one `TUG_ENDS_AT` in `mock.ts`.
3. **Item 9:** add `focus-visible:outline-solid` in `NewGroup.tsx:63`, and remove `outline-none` from `Chat.tsx:76`.
4. **Item 3:** hide or guard the places, tug, chat and share entry points for meetings other than `m-fri`, or generate fallback mocks.
5. **Item 6 (small version):** add a `BackgroundContext` so background `Screen`s don't set the title. Plan the background-location refactor.
6. **Items 4 + 5:** update `docs/API.md` and README for the three new API modules, and add `confirm`, `watchThrone` and `setMainTitle` stubs. Make `pull()` return server state and treat `?pulled=1` as a mock-only preview.
7. **Items 8, 10, 11:** add a shared `people` export, use one `me` and one groups endpoint, and make mutations persistent in the mock.
8. Then the rest of item 12's moves, item 13's type relocation, and the LOW items.

# Mobile & accessibility review 2: the 12 new screens

Reviewer: Mobile & Accessibility specialist (independent review, second pass)
Build: `npx vite build --outDir dist-a11y`, served on :4193 (removed after the run). Tool: Playwright Chromium with DPR 2 and touch emulation, plus scripted Tab walks, aria snapshots, MutationObserver counts and DOM text injection for the long-text tests.

**What was tested**
- New screens: M `#/meet/m-fri/tug`, R `…/tug?pulled=1`, N `…/places`, P `…/vote`, O `…/chat`, S `…/share`, L `#/place/p-wine/challenge`, H `#/alerts`, I `#/my`, J `#/settings`, K `#/new`, Q `#/group/new`.
- Viewports: 320x568, 360x740, 390x844, 430x932 and 740x360, each with and without `?frame=1`. Extra checks at 390x400 and 390x340 (simulated keyboard) and 390x500 (split screen).
- Screens A–G were spot-checked for regressions at 320 and 360 widths.

**Evidence:** `qa/mobile-2/` (169 PNGs).
- `<screen>_<WxH>[_frame].png` is the plain sweep.
- `long_*` is the long-text stress test, `sheet_*` is short-screen sheets, `focus_*` is keyboard focus, and `O_keyboard_*` is the chat with the keyboard open.

Severity:
- **P0**: broken for most users.
- **P1**: a real defect, WCAG 2.2 AA failure, or unreachable content.
- **P2**: should fix.
- **P3**: polish.

Tags:
- **[Impl]**: the code differs from Figma, or the code is wrong.
- **[Design]**: the problem is in the Figma spec itself.

---

## What passed

- **No horizontal page scroll** on any of the 12 screens at any viewport, including with long text injected. `scrollWidth` always equals `innerWidth`. Off-screen items are only inside horizontal chip scrollers, which is intended.
- **Regression check A–G:** the earlier tab-bar clipping is fixed. Labels end at 733px and the + button at 738px in a 740px viewport. On A, G, H and I the last content ends above `nav.top`. The only elements past the edge on B and F are decorative circles, which are clipped.
- **Sheets K and S:**
  - `role="dialog"` with `aria-modal` and a name.
  - Focus moves to the sheet when it opens.
  - Tab and Shift+Tab stay inside the sheet (checked in both directions).
  - Esc closes the sheet.
  - The background is `inert`.
- **Switches on J:**
  - The whole 52px row is a `button role="switch"` with `aria-checked`.
  - Space toggles it (`true→false` verified).
  - The name comes from the row text.
  - The Q switch also toggles with Space and is named through `aria-labelledby`.
- **The tug "당기기" button works without press-and-hold.** Enter, Space or a single tap pulls, and the result is announced through the two `aria-live="polite"` paragraphs ("28분 → 21분" and "내가 한 칸 더 당겼어요!"). When pulls run out or time ends, the button stays focusable (`aria-disabled`) and explains why through a toast.
- **Countdowns do not flood screen readers.** Both timers use `role="timer"`, whose implicit live setting is off. The MutationObserver saw 0 live-region changes in 5s on both M and O.
- **Icon-only buttons have names:** back, ✓ (모두 읽음), ≡ (설정 / 정렬 바꾸기), close, send and "멤버 더 초대하기". No unnamed control was found.
- **Heading structure is sensible:** one `h1` per page and `h2` for sections. The sheets use an `h2` inside the dialog, and the background `h1` is inert.
- **Reduced motion:** the new screens have no keyframe animations, and the glows are static gradients. Only short transitions remain (see #22).
- **Chat send:** after Enter, focus stays in the input and the log scrolls to the newest message.
- **Main text contrast passes:**
  - `#9aa098` on the night cards: 5.6–7.1:1.
  - `ink/70` on lime: 6.17:1.
  - `white/70` on `night-1`: 8.85:1.
  - `lime` on `night-line`: 10.05:1.

---

## Findings

### P1

**1. Bottom sheets K and S cannot scroll, so on short screens the title, close button and first option are off-screen and unreachable. [Impl]**
- Screens: K, S at 740x360 (landscape) and in any window shorter than the sheet.
- Evidence: `sheet_K_740x360.png` and `sheet_S_740x360.png`.
  - K: the sheet top is at **-124px** and the close button at **-100px**. The "새 약속 잡기" card is cut in half, and wheel or touch scrolling does not move it.
  - S: the sheet top is at -38px.
  - The dialog computes `overflow-y: visible; max-height: none`.
- Fix (`src/components/social/BottomSheet.tsx`, the `<section>`):
  - Add `max-h-[calc(100dvh-var(--sat)-12px)] overflow-y-auto overscroll-contain`.
  - Keep the close button reachable. Either make it `sticky top-0` inside the section, or move the handle, title and close into a non-scrolling header with a scrolling body below.

**2. On a small screen (320x568), the tug map hides the meeting point, the bubble and my own avatar behind the header. On R, the main result of the pull is not visible. [Impl + Design]**
- Screens: M, R at 320x568, with and without frame.
- Evidence:
  - `R_320x568.png`: the new point and my avatar are above the header, and the lime point overlaps the "장소 줄다리기" title.
  - `M_320x568_frame.png`: the "원래 지점" label sits under the h1.
  - `long_M_320x568.png`: a long station name in the bubble collides with the title and the timer.
- Cause: `useCoverScale` uses a "cover" scale anchored to the bottom (`top: box.h - H*scale`). When the map area is short (568 − 320 panel), the top of the 390x560 board is cropped. The panel is fixed at `310px + tabpad`, which is 56% of an SE screen.
- Fix:
  - `src/components/tug/TugMap.tsx`: fit the bounding box of `players`, `point` and `bubbleAt` rather than the whole board. Scale that box with `min(box.w / bw, (box.h - headerH) / bh)` and centre it below the header, where `headerH` is `var(--sat) + 56px`.
  - `src/pages/new/Tug.tsx`: add a compact panel for `@media (max-height: 640px)`: a 72px 당기기 button, the hint hidden, and about 250px total. Figma should also spec an SE-height variant.

**3. After a sheet closes, focus goes to `<body>` instead of back to the control that opened it. [Impl]**
- Screens: K (opened from the + on A), S (opened from share on C).
- Evidence: the Tab-walk log shows that after Esc, `document.activeElement` is `BODY` on both `#/` and `#/meet/m-fri`.
- Cause: the sheet is its own route. The page behind it (`<MyGroups/>` or `<MeetingDetail/>`) is a new instance, so the `prevFocus` saved in `BottomSheet` is a detached node.
- Fix, either of:
  - (a) Make K and S nested routes that render over a persistent parent page through `<Outlet/>`, so the opener is not remounted.
  - (b) Pass `state={{ returnFocus: 'new-fab' }}` on the opener `Link`. The page then runs `useEffect(() => { if (loc.state?.returnFocus) document.querySelector('[data-rf="new-fab"]')?.focus() }, [])`. This applies to `TabBar.tsx`, the share button in `MeetingDetail.tsx`, `MyGroups.tsx` and `MeetingDetail.tsx`.

**4. Two focusable elements show no focus indicator (WCAG 2.4.7). [Impl]**
- Q, "모임 이름" input (`focus_Q_name_input_390.png`): computed `outline-style: none` while focused.
  - Cause: in Tailwind v4, `outline-none` sets `--tw-outline-style: none`. `focus-visible:outline-2` only sets the width and reuses that variable, so no outline is drawn.
  - Fix (`src/pages/new/NewGroup.tsx:64`): replace `outline-none … focus-visible:outline-2 focus-visible:outline-lime` with `focus:outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-lime`.
- O, the message log (`focus_O_log_invisible_390.png`): it has `tabIndex={0}`, which is correct for keyboard scrolling, but `outline-none` removes the ring.
  - Fix (`src/pages/new/Chat.tsx:76`): remove `outline-none` and add `focus-visible:outline-offset-[-2px]`.
- The same Tailwind v4 variable problem is worth grepping for anywhere `outline-none` is combined with `focus-*:outline-2`.

**5. Focused controls are hidden behind sticky or fixed bottom bars (WCAG 2.2 2.4.11 Focus Not Obscured). [Impl]**
- Q at 320x568 (`focus_obscured_Q_320x568.png`): Tab to "카톡 초대" or "링크 복사" and the control is **100% covered** by the sticky "모임 만들기" bar. The browser does not scroll it into view because the bar is sticky in the same scroller.
- N at 320x568 (`focus_obscured_N_320x568.png`): the like buttons are **57%** covered, and the rows 37%, by the fixed "투표로 정하기" button.
- P and L are at risk in the same way.
- Fix (`src/index.css`, under `@layer base`): add `html { scroll-padding-bottom: calc(110px + var(--sab)); }`. The Tug and Chat pages do not scroll, so this rule does not affect them. For N, you can also add `scroll-margin-bottom` to each `li`.

**6. Small text on the new screens fails contrast. [Design: these are Figma tokens and opacities]**

| Where | Colours | Ratio | Needs | Fix |
|---|---|---|---|---|
| N list meta 12px ("식당 · 도보 4분 · 리뷰 1.2k"), N header meta, zero-count ♥ | `paper-muted #9ba197` on white | **2.65:1** | 4.5 | Change the token `--color-paper-muted` to about `#6e746a` (4.81:1 on white). This also darkens D–G, so recheck those; on `#f4f5f1` go slightly darker. |
| N ♥ count 13px bold | `live #ff5a4e` on white | **3.08:1** | 4.5 | Add `--color-live-text: #d4342a` (4.86:1) for text on light backgrounds (`PlaceList.tsx:129`). |
| S link preview URL 11px bold | `ink/50` on lime | **3.31:1** | 4.5 | Use `text-ink/70` (6.17:1) in `Share.tsx:50`. |
| I "가장 많이 간 곳" 11px bold | `ink/60` on lime | 4.48:1 | 4.5 | Use `text-ink/70` in `My.tsx:72`. |

### P2

**7. When the on-screen keyboard opens, the chat hides the newest message and the log shrinks to 90px. [Impl + Design]**
- Evidence: `O_keyboard_390x400.png` and `O_keyboard_390x340.png`.
  - With the viewport resized to 400 or 340 and the input focused, the log is only 150px or **90px** tall.
  - It stays scrolled to the old position, so the latest bubbles are hidden. `useLayoutEffect` only re-pins when `messages.length` changes.
  - The quick replies, the 26px gap and the tug strip all stay visible.
- Fix (`src/pages/new/Chat.tsx`):
  - Add a `ResizeObserver` on `listRef` that sets `scrollTop = scrollHeight` when the user was already at the bottom.
  - Hide the quick-reply row (and collapse the tug strip to one line) when `window.visualViewport.height < 500`.
- Fix (`index.html`): add `interactive-widget=resizes-content` to the viewport meta so Android Chrome resizes the `dvh` layout instead of only panning.
- Design: Figma has no keyboard-open state for O.

**8. The chat log reads out the whole history when the page opens. [Impl]**
- `role="log" aria-live="polite"` exists before the data loads. The first batch of about 8 messages is inserted into a live region, so screen readers announce all of it.
- Fix (`Chat.tsx:75`): render the log `div` only when `room` is loaded (`{room && <div role="log" …>}`), so only later messages count as changes.

**9. The vote cards are marked as radios but do not behave like a radio group. [Impl]**
- Screen: P.
- Evidence:
  - All 3 cards are separate tab stops (`tabindex` is null on each).
  - ArrowDown leaves both focus and `aria-checked` unchanged.
  - This does not match the ARIA radio pattern, where the group is one Tab stop and the arrow keys move and select.
- Fix (`PlaceVote.tsx:65–99`), either of:
  - Use a roving `tabIndex={on || (!choice && i===0) ? 0 : -1}` plus `onKeyDown`, where ArrowDown/Right selects and focuses the next card and ArrowUp/Left the previous one.
  - Use a visually hidden native `<input type="radio" name="vote">` inside a `<label>` card, which gives the arrow keys for free.

**10. Screen readers never hear how many pulls are left. [Impl]**
- Screens: M, R.
- The aria snapshot shows an empty `paragraph`. `aria-label="2번 남음"` is placed on a plain `<p>`, where ARIA ignores it.
- Fix (`Tug.tsx:81`): add `role="img"` to that `<p>`, or replace the label with `<span className="sr-only">{pullsLeft}번 남음</span>`. Consider adding the pulls left to the button's `aria-describedby` as well.

**11. At 320px, the 당기기 circle covers the edges of the two side buttons, and the Tab order does not match the visual order. [Impl]**
- Screen: M/R at 320x568 (`M_320x568_frame.png`).
  - 당기기 spans x=112–208. "확정 투표" spans 24–124 and "채팅" 196–296.
  - 당기기 is on top, so tapping the inner 12px of either link **spends a pull**.
- Tab order is 확정 투표 → 채팅 → 당기기, but the visual order is 확정 투표 · 당기기 · 채팅 (WCAG 2.4.3).
- Fix (`Tug.tsx:103–111`):
  - Change the side links to `w-[min(100px,calc(50%-56px))]`.
  - Move the 당기기 `<button>` between the two links in the DOM.

**12. The tug hint says "꾹 누르고 있으면" (press and hold), but a single tap or Enter already pulls. [Design + Impl]**
- Holding also gives only one pull, not "한 칸씩" repeatedly. Screen-reader users hear this hint through `aria-describedby`, so it describes an interaction that does not exist. A single tap spending one of three limited pulls could also be accidental.
- Decide in Figma, either:
  - (a) Change the copy to "누를 때마다 내 쪽으로 한 칸 (남은 n번)".
  - (b) Make it a real hold-to-confirm (with a progress ring) and keep Enter or Space as a separate confirm path for keyboard and screen-reader users.

**13. Horizontal chip rows do not scroll a focused chip into view, and they clip the focus ring. [Impl]**
- Screens: K, N, H, I, Q, plus A (regression).
- Evidence: `focus_K_chip_offscreen_360.png`.
  - Tab to "고등학교 친구들" and it sits at x=306–412 in a 360px viewport, with the row's `scrollLeft` still 0.
  - Only the left arc of its ring is visible. The row height equals the chip height (`h-[32px]`, `h-[34px]`, `h-[36px]`) and `overflow-x: auto` clips the 2px-offset outline at the top and bottom.
- Fix:
  - `Chip.tsx`: add `onFocus={(e) => e.currentTarget.scrollIntoView({ inline: 'nearest', block: 'nearest' })}`.
  - `ChipRow`: add `py-[4px]` (subtract 8px from the fixed heights and margins) and `scroll-px-6`.
  - Or give chips `focus-visible:outline-offset-[-2px]`.

**14. Several tap targets are smaller than 40px. [Design]**
- All of them are at least 24px, so WCAG 2.5.8 AA passes, but they miss the project's 40px or 44px guideline:
  - O: "보러가기" 68x30, "투표하기" 68x28, quick replies 32px tall.
  - I: title chips 28–30px.
  - K: group chips 30–32px.
  - N, H and Q: filter chips 32–36px.
  - **Q: the ranking switch is 46x28**, and it is the only tappable part of its 72px card (on J, the whole row is the switch).
- Fix:
  - Q (`NewGroup.tsx:86–96`): make the whole card the `button role="switch"`, as in `Settings.tsx` `SwitchRow`, and draw the track with `ToggleTrack`.
  - Small pills: add an invisible hit area (`relative after:absolute after:-inset-y-[6px] after:inset-x-0 after:content-['']`) so the visual size stays as in Figma.

**15. Toast messages may be missed by screen readers. [Impl]**
- `toast.ts` creates a new `role="status"` node for each message and removes it after 2s. VoiceOver and TalkBack often do not announce a live region inserted together with its text.
- The new screens rely on toasts for important feedback: pull limit, sort change, "링크를 복사했어요", "…으로 확정했어요", create errors.
- Fix (`src/components/toast.ts`):
  - Create one permanent visually-hidden `div role="status" aria-live="polite"` at startup and set its `textContent` (clear it, then set it on the next frame).
  - Keep the visible pill `aria-hidden`.

**16. Long names overflow their containers. [Impl]**
- Evidence: `long_N_320x568.png`, `long_P_320x568.png`, `long_O_320x568.png`.
- N header pill: it is `whitespace-nowrap` with no width limit, so a long meeting title runs under both round buttons and off both screen edges (x −51 to 372).
  - Fix (`PlaceList.tsx:80`): add `max-w-[calc(100%-112px)] truncate`.
- `KingTag` is `whitespace-nowrap shrink-0`, so a long group name runs past the right border of the P card (to 364px) and past the edge of the N row.
  - Fix (`KingTag.tsx`): add `min-w-0 max-w-full`, wrap the name in `<span className="truncate">`, and in `PlaceVote.tsx:78` set the wrapper to `right-[52px]`.
- O place card: the king pill wraps to 2 lines over the photo.
  - Fix (`Chat.tsx:150`): add `max-w-[calc(100%-20px)]` and `truncate` on the text.

**17. At 320px, the voter avatars on the vote cards sit on top of the king tag. [Impl]**
- Screen: P at 320x568 (`P_320x568_frame.png`), with no long text.
- The avatar stack (`right-[68px] top-[76px]`) overlaps the KingTag (top 62–82) on narrow cards.
- Fix (`PlaceVote.tsx:86`): move the stack to `top-[84px]`, or put it in the bar row to the left of "n표". Figma should define the 320 behaviour.

### P3

**18. Landscape (740x360) is barely usable on Tug and Chat. [Design]**
- Evidence: `M_740x360.png` and `O_740x360.png`.
  - Tug: the panel takes 320 of 360px, the map is hidden, and the header overlaps the panel top.
  - Chat: about 100px of messages remain.
- Fix: this is a mobile-only product, so add `"orientation": "portrait"` to the web manifest when the PWA ships. Otherwise add `@media (max-height: 480px)` compact rules to `Tug.tsx` and `Chat.tsx`.

**19. The unselected state of some controls has too little contrast (WCAG 1.4.11). [Design]**
- Unselected vote radio ring `white/30` on `night-1`: 2.71:1.
- Empty pull dot: 2.71:1.
- Both need 3:1, so use `white/40` (3.79:1).
- The switch's off track `#2e332f` on `#1a1d1b` is 1.32:1. This is acceptable only because the knob (4.82:1) carries the state; a 1px `white/20` border on the track would help.

**20. The unread count is a live region inside the page heading. [Impl]**
- Screen: H. The h1's accessible name becomes "알림 새 소식 3개", and the count is announced on every load.
- Fix (`Alerts.tsx:37–40`): move the count into a `<p>` outside the h1. Only announce the result of "모두 읽음" (for example with a toast: "모두 읽었어요").

**21. Some buttons signal their state in a confusing way. [Impl + Design]**
- L "알림 받기": the button uses `aria-pressed` and also changes its label to "알림 켜짐", so screen readers say "알림 켜짐, pressed". Keep the label fixed or drop `aria-pressed` (`Challenge.tsx:85–88`).
- K "새 약속 잡기" has a hard-coded `aria-pressed="true"`, and pressing it only moves focus to the group chips. Figma should decide whether the two cards are a choice (then make them a radiogroup) or actions (then 새 약속 잡기 should navigate).

**22. Short transitions still run with reduced motion on. [Impl]**
- With `prefers-reduced-motion: reduce`, these still run: the tug gauge width (500ms), the vote bar width (300ms), the 당기기 `active:scale-95`, and the Q switch knob.
- `Toggle.tsx` already uses `motion-reduce:transition-none`, but `NewGroup.tsx:94` does not.
- Fix: add `motion-reduce:transition-none` at `Tug.tsx:92,109`, `PlaceVote.tsx:72,94` and `NewGroup.tsx:93–94`.

**23. The empty-name error on Q is only a toast. [Impl]**
- Tapping "모임 만들기" with an empty name shows a toast and focuses the field, but the field is not marked invalid.
- Fix (`NewGroup.tsx`): add `aria-invalid={error}` and `aria-describedby="q-name-err"` on the input, with a persistent inline error line under it.

---

## Implementation vs design summary

- **Design (Figma):**
  - #6 contrast tokens and opacities.
  - #12 hold vs tap copy.
  - #14 target sizes.
  - #18 orientation.
  - #19 non-text contrast.
  - Part of #2 (SE-height tug layout), #7 (keyboard-open chat state), #17 (320px vote card) and #21.
- **Implementation:** everything else, including all the P1 keyboard and focus issues (#3, #4, #5) and the sheet overflow (#1).

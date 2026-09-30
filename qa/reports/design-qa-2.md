# Design QA 2: Figma vs. web (new screens M R N P O S L H I J K Q)

Reviewer: independent, fresh eyes. I edited nothing under `src/`.

**Method.** I built with `npx vite build --outDir dist-dqa` (since deleted) and ran `DIST=dist-dqa OUTDIR=out-dqa PORT=4194 python3 qa/compare.py M R N P O S L H I J K Q A B C D E F G`. That rendered 390x844 screenshots with `?frame=1`, saved in `qa/out-dqa/`. For every screen I cropped and zoomed 2–10x with PIL. I measured edges with row and column pixel profiles against the background, and sampled colours.

I made 5 Figma `get_design_context` calls (S 35:170, L 31:54, O 35:5, I 30:80, H 30:8), spaced more than 20s apart. All coordinates below are screenshot/frame px, where frame = Figma code + 8.

**Pixel-diff scores** (% of pixels that differ):

| Screen | Diff |
|---|---|
| M | 1.7 |
| R | 1.8 |
| N | 4.8 |
| P | 2.6 |
| O | 3.5 |
| S | 7.1 |
| L | 3.6 |
| H | 2.7 |
| I | 2.3 |
| J | 1.7 |
| K | 4.9 |
| Q | 2.1 |

For comparison, the older screens A–G score 2.1–3.5. The high numbers for S, K and N come almost entirely from the known intentional differences: the dimmed page behind the sheet (S, K) and the extra list rows (N).

**Excluded (intentional):**
- Status bar and bezel.
- Grey photo gradients.
- Hand-drawn map art.
- K and S backgrounds behind the sheet.
- The extra rows in N.
- ` · ` separators rendering about 3px narrower.

**Overall.** The new screens are in good shape. Every screen is within about 3px of Figma. Layout, radii, colours, bottom CTAs, sheets and tab bars all measure identical to Figma or within 1px. What remains is small alignment offsets plus two shared-component details (the crown outline and the TopBar title baseline). Each of those affects many screens at once.

## Findings (most visible first)

| # | Screen | Element | Figma | Web | Fix |
|---|---|---|---|---|---|
| 1 | I | Group row photos (4 rows) | 2px solid **white** ring around each 34px photo. Pixels at x 34–35 are (255,255,255) | Ring is 1.5px and renders as 1 grey-white px (244), then blends into the photo. It reads as "no ring" | `src/pages/new/My.tsx:94` `<RoundPhoto size={34} ring={2} ringColor="#fff" …/>` |
| 2 | all dark screens (I, L, N, O, P, Q, H + A–G) | Crown icon | Every crown has an **ink `#111412` outline** (1–1.5px). It is clearly visible on the dark cards (L VS card, I "왕 N" pills, Q ranking card) | `Crown` defaults `stroke` to the fill colour, so there is no outline | `src/components/Crown.tsx:6`: change `stroke={stroke ?? fill}` to `stroke={stroke ?? 'var(--color-ink)'}`. This is one fix for all screens, and it also covers design-qa.md #11 (F 2위 crown). Callers that pass `stroke` explicitly keep theirs. |
| 3 | L, J, Q (TopBar); C (same pattern) | Centre title (17px bold) | Text box top is 10px below the back-button top (Figma L: button 44, text 54). Glyphs y 65–81 | Title is vertically centred in the 40px row, so its top is 8.5px below. Glyphs y 64–80 (1.5px high) | `src/components/TopBar.tsx:15` h1: add `pt-[3px]`, which moves it 1.5px down inside `items-center`. Also `src/pages/MeetingDetail.tsx:40`: same `pt-[3px]`. |
| 4 | M, R | "장소 줄다리기" title | Glyphs y 66–81 | y 64–80 (2px high). The h1 is absolute and centred in the 40px header | `src/pages/new/Tug.tsx:61`: add `top-[10px]` to the h1 so it matches the TopBar value above |
| 5 | O | "보러가기" button in the lime tug banner | x 281–349 (left 257 in banner, so 16px from the banner's right edge 366), y 120–149 | x 285–352 (3px right), y 121–150 | `src/pages/new/Chat.tsx:62`: `pr-[13px]` → `pr-[16px]` |
| 6 | O | Input placeholder "메시지 보내기" | Text top 763 (Figma 755+8). Glyphs y 766–780 | Glyphs y 768–782 (2px low) | `src/pages/new/Chat.tsx:92` input: add `pb-[4px]`, which shifts the centred text up 2px |
| 7 | I | "왕 3 / 왕 5 / 왕 1" pills | Pill x 274–324 (left 250 in row). Gap to "→" (x 342) is 18px | Pill x 277–326 (2–3px right). Gap is 16px | `src/pages/new/My.tsx:106` arrow span: `ml-[16px]` → `ml-[18px]` (the arrow itself is already at x 342) |
| 8 | M, R | Glow around the 당기기 button | Soft falloff. At 3px outside the button: rgb(106,128,37). At y=664: (98,120,37) | Harder inner edge: (136,167,42) and (111,136,39) at the same points. The ring right next to the button is about 25% too bright. The outer extent is correct | `src/pages/new/Tug.tsx:106` gradient: lower the first stops, e.g. `rgba(198,244,50,.5) 52%, rgba(198,244,50,.36) 60%, rgba(198,244,50,.15) 80%, …0) 100%` |
| 9 | H | Headline "알림 / 새 소식 3개" | Glyphs y 68–99 / 110–141 (Figma top 56+8) | y 69–100 / 111–142 (1px low). This is the same 1px drop as A and G in design-qa.md (#15, #16), so it is systemic for 34–36px black/1.15 headings | `src/pages/new/Alerts.tsx:36`: `pt-[20px]` → `pt-[19px]` (the ✓ button is absolute, so it is unaffected) |
| 10 | L | Rule rows (+1 / +1 / !) | Text top is 4px below the badge top (566 vs 562), so glyphs sit at y 577–589 | `items-center` puts the text 0.8px lower: glyphs y 578–589 | `src/pages/new/Challenge.tsx:75`: `items-center` → `items-start`, and line 77 text gets `mt-[4px]` (optional, 1px) |
| 11 | O, S | Photo placeholder art | O place card and S share thumbnail show a gradient plus a top-right circle only | Extra dark "arch" block (bottom-left, 34%×52%) appears in the O card and S thumbnail. P, N and L don't show it visibly, so placeholders look different between screens | `src/components/Photo.tsx:9`: delete the second `<span … rounded-t-[18px] bg-black/15 …/>` so every placeholder matches Figma's circle-only placeholder. Low priority, because it disappears with real photos. |
| 12 | H | "약속 초대" 2-line body | 230px text box that breaks per character, so "요" ends up alone on line 2 | Breaks at a word (`keep-all`): "…시간을 / 입력해주세요" | **No change.** The web wrap is better typography. Both fit in the 66px card. Tell the designer that Figma's own wrap is poor. |

Not reported (sub-pixel or font rendering, no per-element fix):
- Medium and bold Korean text renders about 2–3.5% wider than Figma on every screen. For example, L rule line 1 is 141px vs 136px, and the O "공정성 게이지…" bubble is 226px vs 221px wide, because right-aligned bubbles grow to the left. Figma uses static Noto Sans KR Medium/Bold, and the web uses the variable font. The weights match (Figma: Medium 500), so the width comes from the font build, not a wrong class.
- Several 1px text offsets:
  - J right-hand values: 1px low.
  - K "새 약속 잡기": 1px low.
  - L place name and "3회 방문": 1px low.
  - O last bubble: 1px high.
- The timer text differs in M/R because it is live data.

## Cross-screen consistency (12 new screens + A–G)

- **Header:** Every back button is at x 24–63, y 52–91 on all screens (TopBar screens, O, P and M). The two-line headers in O and P match Figma exactly (title 57–73, subtitle 80–90). The only inconsistency is the 1.5–2px title baseline in #3/#4. It comes from two code paths (`TopBar` centring and `Tug` absolute centring), so fix both together.
- **Crowns:** One shared component. Findings #2 and #11 of design-qa.md are the same root cause and share one fix.
- **Chips:** `Chip` md (H) and sm (I, K) match Figma sizes: 34px, 28px and 30px (K overrides `py-[7px]` as in Figma). The O quick-reply chips are hand-rolled (`Chat.tsx:86`) but identical to `Chip size="sm"` with `py-[7px]`. They could reuse `Chip`; no visual change.
- **Icon buttons:** `My.tsx:28` re-implements the glass `IconButton` as a `Link`. It looks identical, but it will drift if `IconButton` changes. This is a code note only.
- **Bottom CTAs:** P, Q and K are 56px tall. L is 54px, with a 120px-wide secondary button. CTA label sizes are 15px (P, L) and 16px (K, Q). All of these match Figma, and the glyph boxes are identical, so the inconsistency is in the design itself, not the build. Worth raising with the designer if you want a single CTA spec.
- **Sheets (K, S):** Both use `BottomSheet`: radius 32, grabber 40×5 at top 10, title 20px black at top 32, close button 40px. Everything measures identical to Figma S (35:180).
- **Tab bar (H, I vs A):** Identical, with bands at y 766–817 in all.
- **Card radii and colours:** Every card measured matches its Figma frame. Values: H 20, I 16 and 20, L 26, P 24, K 24, S 22, O 20. `night-1` and `night-2` are used as in Figma.

## Verdict per screen

- **M (줄다리기):** Very close. Title is 2px high (#4) and the button glow is slightly hard-edged (#8).
- **R (당긴 뒤):** Same as M. The pulled state and labels match.
- **N (장소 리스트):** Very close. Markers, crown, chips and rows are within 1px. Only the crown outline (#2) applies.
- **P (장소 투표):** Very close. Cards, bars, voters and CTAs are pixel-aligned.
- **O (채팅):** Close. The banner button sits 3px right (#5) and the input placeholder is 2px low (#6). Bubbles are slightly wider only because of font rendering.
- **S (공유하기):** Sheet matches Figma values exactly. The only difference is the extra placeholder shape (#11).
- **L (왕좌 도전):** Very close. There is the TopBar 1.5px (#3) and the crown outline (#2). Rules are 1px low (#10).
- **H (알림):** Close. Headline is 1px low (#9). The web wrap in "약속 초대" is intentional and better (#12).
- **I (마이):** Close. The most visible issue in this batch is the missing white photo rings (#1). The king pills are 2–3px right (#7).
- **J (설정):** Very close. Only the TopBar 1.5px applies (#3).
- **K (만들기 시트):** Very close. The sheet and cards match. A 4th group chip peeks at the right edge, which is correct scroll affordance.
- **Q (새 모임):** Very close. There is the TopBar 1.5px (#3) and the crown outline (#2). All fields, chips, avatars and the CTA are aligned.

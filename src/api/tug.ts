/* ─────────────────────────────────────────────
   장소 줄다리기 · 장소 리스트 · 장소 투표 · 확정 (M·R·N·P) 데이터
   지금은 가짜 데이터(./store.ts)를 읽고 바꿔요. 재운: 각 함수 안을 fetch 로 바꾸면 돼요.
   규칙: 바꾸는 함수는 바뀐 결과를 돌려주고, 화면은 그 값으로 바꿔 그려요.
   ───────────────────────────────────────────── */
import * as mock from '../data/mock'
import type { CandidatePlace, ID, Meeting, PlaceListInfo, PlaceVoteInfo, TugBoard, VoteOption } from '../data/types'
import { ro } from '../lib/josa'
import { delay } from './index'
import { commit, currentStep, db, findGroup, findMeeting, meetingView, systemMessage, tugOf } from './store'

export type { CandidatePlace, PlaceListInfo, PlaceVoteInfo, TugBoard, TugPlayer, TugStep, VoteOption } from '../data/types'

/** 당기기가 거절된 이유 (서버: 409 + code) */
export type PullError = 'DEADLINE_PASSED' | 'NO_PULLS_LEFT' | 'GAP_LIMIT'

function boardOf(meetingId: ID, preview?: 'R'): TugBoard | undefined {
  const b = mock.tugBoards[meetingId]
  const m = findMeeting(meetingId)
  const t = tugOf(meetingId)
  if (!b || !t || !m || m.stage !== 'tug') return undefined
  const { startPullsUsed: _s, ...rest } = b
  // ?pulled=1 (디자인 비교용 R 미리보기): 실제로 당긴 것처럼 보여만 주고 상태는 안 바꿔요. 이미 당겼으면 그대로.
  const stepIdx = preview === 'R' ? Math.max(t.stepIdx, 1) : t.stepIdx
  const pullsUsed = t.pullsUsed + (stepIdx - t.stepIdx)
  return { ...rest, stepIdx, pullsUsed, endsAt: t.endsAt }
}

/** 장소 한 곳의 목록 모양 (왕 정보는 장소 데이터에서) */
function candidate(meetingId: ID, c: mock.CandidateSeed): CandidatePlace {
  const k = mock.placeKing(c.id)!
  const m = findMeeting(meetingId)
  const mine = db.likes[meetingId]?.[c.id]
  // 왕 표시는 '우리 모임과 왕좌 싸움이 걸린 곳'만: 우리가 왕이거나, 우리가 2회 차이 이내로 뒤쫓는 곳
  // (왕 자체는 모든 장소에 있고, 장소를 누르면 F 에서 볼 수 있어요)
  const ours = k.ranking.find((r) => r.group.id === m?.groupId)
  const contested = !!ours && k.king.visits - ours.visits <= 2
  return {
    id: c.id, name: k.place.name, category: k.place.category, walkMin: c.walkMin, note: c.note, match: c.match,
    ...(contested ? { kingGroupId: k.king.group.id, kingGroupName: k.king.group.name } : {}),
    kingIsUs: k.king.group.id === m?.groupId,
    likes: c.likes + (mine ? 1 : 0), liked: !!mine, tone: c.tone, pin: c.pin,
  }
}

function voteOf(meetingId: ID): PlaceVoteInfo | undefined {
  const v = mock.voteSeeds[meetingId]
  const m = findMeeting(meetingId)
  const list = mock.candidates[meetingId]?.list
  if (!v || !m || !list) return undefined
  const choice = db.votes[meetingId]
  const options: VoteOption[] = v.others.map(([placeId, voters]) => {
    const c = candidate(meetingId, list.find((x) => x.id === placeId)!)
    return {
      place: { id: c.id, name: c.name, category: c.category, walkMin: c.walkMin, match: c.match, kingGroupName: c.kingGroupName, photoUrl: c.photoUrl, tone: c.tone },
      voters: placeId === choice ? [mock.me, ...voters] : voters,
    }
  })
  return {
    meetingId, memberCount: findGroup(m.groupId)?.memberCount ?? m.participants.length, deadlineLabel: v.deadlineLabel, me: mock.me,
    myChoice: choice, confirmedPlaceId: m.stage === 'confirmed' || m.stage === 'done' ? m.placeId : undefined, options,
  }
}

export const tugApi = {
  /**
   * 줄다리기 판 — GET /api/meetings/:id/tug
   * 마감(endsAt)은 이 응답 하나가 기준이에요 (약속 상세의 midpoint.tugEndsAt 은 같은 값을 비춰요).
   * preview 'R' 는 목 전용 (디자인 비교 ?pulled=1).
   */
  board: (meetingId: ID, opts: { preview?: 'R' } = {}): Promise<TugBoard | undefined> => delay(boardOf(meetingId, opts.preview)),

  /** 내 쪽으로 한 칸 당기기 — POST /api/meetings/:id/tug/pull → 바뀐 판. 안 되면 PullError 로 거절 */
  pull: (meetingId: ID): Promise<TugBoard> => {
    const b = mock.tugBoards[meetingId]
    const t = tugOf(meetingId)
    if (!b || !t) return Promise.reject(new Error('NOT_FOUND'))
    const err = (code: PullError) => Promise.reject(new Error(code))
    if (Date.now() >= t.endsAt) return err('DEADLINE_PASSED')
    if (t.pullsUsed >= b.pullsTotal) return err('NO_PULLS_LEFT')
    if (t.stepIdx + 1 >= b.steps.length) return err('GAP_LIMIT')
    t.stepIdx += 1
    t.pullsUsed += 1
    commit()
    const s = b.steps[t.stepIdx]
    systemMessage(meetingId, `은수님이 한 칸 더 당겼어요 (${s.deltas[mock.me.id]}분)`)
    return delay(boardOf(meetingId)!)
  },

  /** 추천 장소 리스트 — GET /api/meetings/:id/places (중간 지점이 정해진 약속만) */
  places: (meetingId: ID): Promise<PlaceListInfo | undefined> => {
    const m = findMeeting(meetingId)
    const c = mock.candidates[meetingId]
    if (!m || !c) return delay(undefined)
    const station = currentStep(meetingId)?.stationName ?? meetingView(m).midpoint?.stationName ?? ''
    return delay({
      meetingId, title: m.title, areaLabel: `${station.replace(/역$/, '')} 주변`, mood: c.mood,
      confirmed: m.placeId && m.placeName && m.stage !== 'time' ? { placeId: m.placeId, name: m.placeName } : undefined,
      places: c.list.map((x) => candidate(meetingId, x)),
    })
  },

  /** 찜(♥) 켜고 끄기 — PUT /api/meetings/:id/places/:placeId/like { on } → 바뀐 장소 */
  like: (meetingId: ID, placeId: ID, on: boolean): Promise<CandidatePlace | undefined> => {
    ;(db.likes[meetingId] ??= {})[placeId] = on
    commit()
    const c = mock.candidates[meetingId]?.list.find((x) => x.id === placeId)
    return delay(c && candidate(meetingId, c))
  },

  /** 장소 투표 현황 — GET /api/meetings/:id/vote */
  vote: (meetingId: ID): Promise<PlaceVoteInfo | undefined> => delay(voteOf(meetingId)),

  /** 내 표 바꾸기 — PUT /api/meetings/:id/vote { placeId } → 바뀐 투표 현황 */
  castVote: (meetingId: ID, placeId: ID): Promise<PlaceVoteInfo | undefined> => {
    db.votes[meetingId] = placeId
    commit()
    return delay(voteOf(meetingId))
  },

  /**
   * 이 장소로 확정 — POST /api/meetings/:id/confirm { placeId } → 바뀐 약속 (stage 'confirmed')
   * 줄다리기 결과 역(midpoint)도 이때 그대로 굳어요.
   */
  confirm: (meetingId: ID, placeId: ID): Promise<Meeting | undefined> => {
    const m = findMeeting(meetingId)
    const k = mock.placeKing(placeId)
    if (!m || !k) return delay(undefined)
    const view = meetingView(m)
    m.stage = 'confirmed'
    m.placeId = placeId
    m.placeName = k.place.name
    if (view.midpoint) m.midpoint = { stationName: view.midpoint.stationName, avgMin: view.midpoint.avgMin, maxGapMin: view.midpoint.maxGapMin }
    m.subText = `${k.place.name}${m.scheduledAt ? ` · ${mock.mdLabel(m.scheduledAt)}` : ''}`
    commit()
    systemMessage(meetingId, `${k.place.name}${ro(k.place.name)} 장소가 확정됐어요`)
    return delay(meetingView(m))
  },
}

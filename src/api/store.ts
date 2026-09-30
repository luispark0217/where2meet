/* ─────────────────────────────────────────────
   가짜 서버의 '데이터베이스' (목 전용 — 백엔드가 붙으면 이 파일은 지워요)
   ─ 모든 목 API(index · tug · me · social)가 이 한 곳의 상태를 읽고 바꿔요.
     그래서 투표·찜·확정·새 모임·당기기가 화면을 오가도 그대로 남아요.
   ─ 같은 탭 안에서는 새로고침해도 유지돼요 (sessionStorage).
     처음 상태로 돌리려면 주소에 ?fresh=1 을 붙여요. 예: http://localhost:5173/?fresh=1#/
   ───────────────────────────────────────────── */
import * as seed from '../data/mock'
import type { ChatMessage, Group, ID, Meeting, Settings } from '../data/types'

/** 줄다리기 진행 상태 (약속 하나에 하나) */
interface TugRuntime { endsAt: number; stepIdx: number; pullsUsed: number }

interface State {
  groups: Group[]
  meetings: Meeting[]
  tug: Record<ID, TugRuntime>
  /** 내가 찜한 장소: meetingId → placeId → 켜짐 */
  likes: Record<ID, Record<ID, boolean>>
  /** 내 표: meetingId → placeId */
  votes: Record<ID, ID | undefined>
  chat: Record<ID, ChatMessage[]>
  alertsRead: ID[]
  settings: Settings
  mainTitle?: string
  /** 왕좌 알림 받는 장소 */
  watching: ID[]
  seq: number
}

const KEY = 'w2m-mock-v2'
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

function fresh(): State {
  return {
    groups: clone(seed.groups),
    meetings: clone(seed.meetings),
    tug: {},
    likes: {},
    votes: Object.fromEntries(Object.entries(seed.voteSeeds).map(([k, v]) => [k, v.myChoice])),
    chat: clone(seed.chatSeeds),
    alertsRead: seed.alerts.filter((a) => a.read).map((a) => a.id),
    settings: { ...seed.settings },
    watching: [],
    seq: 1,
  }
}

function load(): State {
  try {
    if (new URLSearchParams(location.search).has('fresh')) sessionStorage.removeItem(KEY)
    const raw = sessionStorage.getItem(KEY)
    if (raw) return { ...fresh(), ...JSON.parse(raw) }
  } catch { /* 저장소를 못 쓰면 메모리에만 둬요 */ }
  return fresh()
}

/** 지금 상태 (읽기·쓰기 모두 이 객체로) */
export const db: State = load()

/** 바꾼 뒤에 불러서 저장해요 */
export function commit() {
  try { sessionStorage.setItem(KEY, JSON.stringify(db)) } catch { /* 무시 */ }
}

export const nextId = (prefix: string) => { const n = db.seq++; commit(); return `${prefix}-${n}` }

export const findMeeting = (id: ID) => db.meetings.find((m) => m.id === id)
export const findGroup = (id: ID) => db.groups.find((g) => g.id === id)

/**
 * 약속의 줄다리기 상태. 줄다리기 판이 있는 약속을 처음 볼 때 한 번만 마감 시각을 정해요.
 * (C·M·O 어디서 먼저 열어도 같은 마감 — 다시 들어가도 늘어나지 않아요)
 */
export function tugOf(meetingId: ID): TugRuntime | undefined {
  const board = seed.tugBoards[meetingId]
  if (!board) return undefined
  if (!db.tug[meetingId]) {
    db.tug[meetingId] = { endsAt: Date.now() + seed.TUG_SECONDS * 1000, stepIdx: 0, pullsUsed: board.startPullsUsed }
    commit()
  }
  return db.tug[meetingId]
}

/** 지금 중간 지점 (줄다리기 판이 있으면 그 판의 현재 칸) */
export function currentStep(meetingId: ID) {
  const board = seed.tugBoards[meetingId]
  const t = tugOf(meetingId)
  return board && t ? board.steps[Math.min(t.stepIdx, board.steps.length - 1)] : undefined
}

/** 화면에 내보낼 약속: 줄다리기 결과(역·평균·최대 차이·마감)를 midpoint 에 반영 */
export function meetingView(m: Meeting): Meeting {
  const step = currentStep(m.id)
  if (!step || !m.midpoint) return clone(m)
  const t = db.tug[m.id]
  return {
    ...clone(m),
    midpoint: {
      stationName: step.stationName, avgMin: step.avgMin, maxGapMin: step.gapMin,
      tugEndsAt: m.stage === 'tug' ? t.endsAt : undefined,
    },
  }
}

/** 채팅방에 안내 한 줄 넣기 */
export function systemMessage(meetingId: ID, text: string) {
  const list = (db.chat[meetingId] ??= [])
  list.push({ id: `sys-${db.seq++}`, kind: 'system', text })
  commit()
}

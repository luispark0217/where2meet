/* ─────────────────────────────────────────────
   소셜 화면(K 만들기 · Q 새 모임 · S 공유 · O 채팅 · L 왕좌 도전) 데이터
   지금은 가짜 데이터(./store.ts)를 읽고 바꿔요. 재운: 함수 안만 fetch 로 바꾸면 돼요.
   ───────────────────────────────────────────── */
import * as mock from '../data/mock'
import type {
  ChatMessage, ChatRoom, Group, ID, Meeting, MeetingStage, NewGroupDraft, NewGroupInput, NewMeetingInput, ShareInfo, ThroneChallenge,
} from '../data/types'
import { delay } from './index'
import { commit, currentStep, db, findGroup, findMeeting, meetingView, nextId } from './store'

export type { ChatMessage, ChatRoom, NewGroupDraft, NewGroupInput, NewMeetingInput, SharedPlace, ShareInfo, ThroneChallenge } from '../data/types'

const RULES = [
  { badge: '+1', text: '이번 주 안에 방문하면 1회' },
  { badge: '+1', text: '4명 이상 함께 가면 보너스 1회' },
  { badge: '!', text: '위치 공유로 30분 이상 머물러야 인정돼요' },
]

/** 약속 단계에 맞는 빠른 답장 */
const QUICK: Record<MeetingStage, string[]> = {
  time: ['나 금요일 돼', '주말이 좋아', '시간 입력했어'],
  place: ['여기 어때?', '투표 올려줘', '다 좋아'],
  tug: ['좋아', '나도', '투표 올려줘'],
  confirmed: ['곧 도착', '5분만', '먼저 가 있을게'],
  done: ['재밌었다', '사진 올려줘', '다음에 또 봐'],
}

const shareUrl = (id: ID) => `https://where2meet.app/p/${id === 'm-fri' ? 'xk29' : id.replace(/^m-/, '')}`

/** "9/25 (금) 19:00 · 홍대입구역" — 확정 장소 > 지금 중간 지점 > 미정 */
function whenWhere(m: Meeting) {
  const v = meetingView(m)
  const when = m.scheduledAt ? mock.whenLabel(m.scheduledAt) : '시간 정하는 중'
  const where = m.placeName ?? v.midpoint?.stationName ?? '장소 미정'
  return `${when} · ${where}`
}

export const socialApi = {
  /** 약속 채팅방 — GET /api/meetings/:id/chat (모든 약속에 있어요) */
  chat: (meetingId: ID): Promise<ChatRoom | undefined> => {
    const m = findMeeting(meetingId)
    if (!m) return delay(undefined)
    const g = findGroup(m.groupId)
    const v = meetingView(m)
    const step = currentStep(meetingId)
    const messages = db.chat[meetingId] ?? [{ id: `open-${meetingId}`, kind: 'system', text: `${m.title} 채팅방이 열렸어요` } as ChatMessage]
    return delay({
      meetingId, title: m.title, groupName: g?.name ?? '', memberCount: g?.memberCount ?? m.participants.length, stage: m.stage,
      tug: m.stage === 'tug' && v.midpoint?.tugEndsAt ? { endsAt: v.midpoint.tugEndsAt, towards: '합정역', arrived: step?.stationName === '합정역' } : undefined,
      confirmed: (m.stage === 'confirmed' || m.stage === 'done') && m.placeId && m.placeName
        ? { placeId: m.placeId, name: m.placeName, whenLabel: m.scheduledAt ? mock.whenLabel(m.scheduledAt) : '' } : undefined,
      messages: [...messages],
      quickReplies: QUICK[m.stage],
    })
  },

  /** 메시지 보내기 — POST /api/meetings/:id/chat { text } → 보낸 메시지 */
  sendMessage: (meetingId: ID, text: string): Promise<ChatMessage> => {
    const msg: ChatMessage = { id: nextId('msg'), kind: 'text', author: mock.me, text, sentAt: Date.now() }
    ;(db.chat[meetingId] ??= [{ id: `open-${meetingId}`, kind: 'system', text: `${findMeeting(meetingId)?.title ?? ''} 채팅방이 열렸어요` }]).push(msg)
    commit()
    return delay(msg)
  },

  /** 공유 정보 — GET /api/meetings/:id/share (모든 약속) */
  share: (meetingId: ID): Promise<ShareInfo | undefined> => {
    const m = findMeeting(meetingId)
    if (!m) return delay(undefined)
    return delay({ meetingId, title: m.title, groupName: findGroup(m.groupId)?.name ?? '', whenWhere: whenWhere(m), url: shareUrl(meetingId) })
  },

  /** 왕좌 도전 정보 — GET /api/places/:id/challenge (내 모임이 왕이면 rival = 2위) */
  challenge: (placeId: ID): Promise<ThroneChallenge | undefined> => {
    const k = mock.placeKing(placeId)
    if (!k) return delay(undefined)
    const myId = k.myGroupId ?? mock.MY_GROUP_ID
    const myEntry = k.ranking.find((r) => r.group.id === myId)
    const myGroup = findGroup(myId)
    const mineVisits = myEntry?.visits ?? 0
    const isKing = k.king.group.id === myId
    const second = k.ranking[1]
    return delay({
      place: { id: k.place.id, name: k.place.name, category: k.place.category, district: k.place.district, photoUrl: k.place.photoUrl },
      king: { groupId: k.king.group.id, name: k.king.group.name, visits: k.king.visits, photoUrl: k.king.group.photoUrl },
      mine: { groupId: myId, name: myEntry?.group.name ?? myGroup?.name ?? '내 모임', visits: mineVisits, photoUrl: myGroup?.photoUrl },
      rival: isKing && second ? { groupId: second.group.id, name: second.group.name, visits: second.visits, photoUrl: second.group.photoUrl } : undefined,
      toOvertake: isKing ? 0 : Math.max(0, k.king.visits - mineVisits + 1),
      watching: db.watching.includes(placeId),
      rules: RULES,
    })
  },

  /** 왕좌 알림 켜고 끄기 — PUT /api/places/:id/watch { on } */
  watchThrone: (placeId: ID, on: boolean): Promise<{ on: boolean }> => {
    db.watching = on ? [...new Set([...db.watching, placeId])] : db.watching.filter((x) => x !== placeId)
    commit()
    return delay({ on })
  },

  /** 새 모임 화면 초기값 — GET /api/groups/new */
  newGroupDraft: (): Promise<NewGroupDraft> => delay({
    categories: ['친구', '동아리', '회사', '가족', '기타'],
    invitees: [mock.people.me, mock.people.ji, mock.people.do_],
    inviteUrl: 'https://where2meet.app/i/7fq2',
  }),

  /** 모임 만들기 — POST /api/groups → 만든 모임 */
  createGroup: (input: NewGroupInput): Promise<Group> => {
    const all = Object.values(mock.people)
    const members = input.memberIds.map((id) => all.find((p) => p.id === id)).filter((p) => !!p)
    const g: Group = {
      id: nextId('g-new'), name: input.name, category: input.category, members, memberCount: members.length,
      since: 2026, kingCount: 0, meetingCount: 0, avgLateMin: 0, statusText: '약속 없음 · 방금 만듦', myRole: '방장',
    }
    db.groups.push(g)
    commit()
    return delay(g, 150)
  },

  /** 약속 만들기 — POST /api/meetings { groupId, placeId? } → 만든 약속 (시간 정하는 중, 빈 시간표) */
  createMeeting: (input: NewMeetingInput): Promise<Meeting | undefined> => {
    const g = findGroup(input.groupId)
    if (!g) return delay(undefined)
    const place = input.placeId ? mock.placeKing(input.placeId)?.place : undefined
    const m: Meeting = {
      id: nextId('m-new'), groupId: g.id, title: place ? `${place.name} 약속` : '새 약속', stage: 'time', bucket: 'active',
      subText: `0/${g.memberCount} 응답 · 마감 D-3`, participants: g.members, responded: `0/${g.memberCount} 응답 · 마감 D-3`,
      // 다음 주 금·토·일 저녁, 아직 아무도 입력 안 함
      availability: mock.grid('2026-10-02', [17, 18, 19, 20, 21, 22], Array.from({ length: 6 }, () => [0, 0, 0])),
      placeName: place?.name, placeId: place?.id,
    }
    db.meetings.push(m)
    g.statusText = `시간 정하는 중 · 0/${g.memberCount}`
    commit()
    return delay(meetingView(m), 100)
  },
}

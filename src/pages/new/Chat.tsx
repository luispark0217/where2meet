import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../api'
import { useApi } from '../../api/useApi'
import { socialApi, type ChatMessage, type SharedPlace } from '../../api/social'
import { Avatar } from '../../components/Avatar'
import { Chip, ChipRow } from '../../components/Chip'
import { Crown } from '../../components/Crown'
import { KingTag } from '../../components/KingTag'
import { IconButton } from '../../components/IconButton'
import { Photo } from '../../components/Photo'
import { Screen } from '../../components/Screen'
import { StateView } from '../../components/StateView'
import { toast } from '../../components/toast'
import { useBack } from '../../components/useBack'
import { mmss, useCountdown } from '../../components/useCountdown'

/** O · 약속 채팅 (피그마 35:5) — 메시지는 가운데에서 스크롤, 입력창은 화면 아래에 고정 */
export default function Chat() {
  const { id } = useParams() as { id: string }
  const back = useBack(`/meet/${id}`)
  const { data: room, status } = useApi(() => socialApi.chat(id), [id])
  const { data: me } = useApi(api.me)
  const [sent, setSent] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const messages = [...(room?.messages ?? []), ...sent]
  const left = useCountdown(room?.tug?.endsAt)

  // 새 메시지가 오면 맨 아래로
  const ready = !!room && !!me
  const atBottom = useRef(true)
  useLayoutEffect(() => {
    const el = listRef.current
    if (el) { el.scrollTop = el.scrollHeight; atBottom.current = true }
  }, [messages.length, ready])
  // 키보드가 올라와 목록이 줄어들어도, 맨 아래를 보고 있었다면 새 메시지가 계속 보이게
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const ro = new ResizeObserver(() => { if (atBottom.current) el.scrollTop = el.scrollHeight })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ready])
  // 화면이 아주 낮으면(키보드가 올라온 때 등) 빠른 답장 줄을 숨겨 메시지 자리를 넓혀요
  const short = useShortViewport(500)
  // 알림(toast)이 빠른 답장 줄을 가리지 않게 입력창 위로
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--toast-bottom', 'calc(150px + var(--sab))')
    return () => { root.style.removeProperty('--toast-bottom') }
  }, [])

  const send = async (raw: string) => {
    const t = raw.trim()
    if (!t) return
    setText('')
    try {
      const msg = await socialApi.sendMessage(id, t)
      setSent((s) => [...s, msg])
    } catch {
      setText(t)
      toast('보내지 못했어요. 다시 시도해주세요')
    }
  }
  const onSubmit = (e: FormEvent) => { e.preventDefault(); void send(text) }

  return (
    <Screen title={room ? `${room.title} 채팅` : '채팅'}>
      <div className="flex flex-col" style={{ height: 'calc(100dvh - var(--sat))' }}>
        {/* 상단: 뒤로 · 제목 / 모임 */}
        <header className="relative mx-6 mt-[8px] flex h-[40px] shrink-0 items-start">
          <IconButton label="뒤로" onClick={back}>←</IconButton>
          <div className="pointer-events-none absolute inset-x-[48px] top-[2px] text-center">
            <h1 className="truncate text-[17px] font-bold leading-[1.35]">{room?.title ?? ''}</h1>
            {room && <p className="mt-[1px] truncate text-[11px] font-medium leading-[1.35] text-night-muted">{room.groupName} · {room.memberCount}명</p>}
          </div>
        </header>

        {status !== 'ok' && <StateView status={status} what="채팅방" />}

        {/* 줄다리기 상태 띠 */}
        {room?.tug && (
          <div className="mx-6 mt-[16px] flex h-[56px] shrink-0 items-center rounded-[20px] bg-lime pl-[16px] pr-[16px] text-ink">
            <span aria-hidden className="w-[28px] shrink-0 text-[18px] font-black leading-[1.35]">↔</span>
            <div className="min-w-0 flex-1">
              <p role="timer" className="truncate text-[13px] font-bold leading-[1.35]">
                {left > 0 ? `줄다리기 진행 중 · ${mmss(left)}` : '줄다리기 끝'}
              </p>
              <p className="mt-[2.45px] truncate text-[11px] font-medium leading-[1.35] text-ink/70">
                {room.tug.arrived ? `지금 중간 지점은 ${room.tug.towards}` : `지금 ${room.tug.towards} 쪽으로 끌려가는 중`}
              </p>
            </div>
            {left > 0
              ? <Link to={`/meet/${id}/tug`} className="ml-[8px] shrink-0 rounded-full bg-ink px-[12px] py-[7px] text-[12px] font-bold leading-[1.35] text-lime">보러가기</Link>
              : <Link to={`/meet/${id}/vote`} className="ml-[8px] shrink-0 rounded-full bg-ink px-[12px] py-[7px] text-[12px] font-bold leading-[1.35] text-lime">확정 투표하기</Link>}
          </div>
        )}
        {/* 장소 확정 띠 */}
        {room?.confirmed && (
          <div className="mx-6 mt-[16px] flex h-[56px] shrink-0 items-center rounded-[20px] bg-lime pl-[16px] pr-[16px] text-ink">
            <Crown width={18} fill="var(--color-ink)" className="mr-[10px] shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold leading-[1.35]">장소 확정 · {room.confirmed.name}</p>
              <p className="mt-[2.45px] truncate text-[11px] font-medium leading-[1.35] text-ink/70">{room.confirmed.whenLabel}</p>
            </div>
            <Link to={`/place/${room.confirmed.placeId}`} className="ml-[8px] shrink-0 rounded-full bg-ink px-[12px] py-[7px] text-[12px] font-bold leading-[1.35] text-lime">보러가기</Link>
          </div>
        )}

        {/* 메시지 */}
        {/* 대화방·내 정보를 다 불러온 뒤에 log 를 그려요 → 처음 있던 메시지는 읽어주지 않고 새 메시지만 알려줘요 */}
        {room && me
          ? <div ref={listRef} role="log" aria-label="채팅 메시지" aria-live="polite" tabIndex={0}
              onScroll={(e) => { const el = e.currentTarget; atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24 }}
              className="no-scrollbar mt-[8px] min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-[12px] focus-visible:outline-offset-[-2px]">
              {messages.map((m, i) => <Message key={m.id} m={m} prev={messages[i - 1]} mine={m.kind !== 'system' && m.author.id === me.id} prevMine={isMine(messages[i - 1], me.id)} meetingId={id} voting={room.stage === 'tug' || room.stage === 'place'} />)}
            </div>
          : <div className="min-h-0 flex-1" />}

        {/* 빠른 답장 + 입력창 */}
        {room && (
          <div className="shrink-0 px-6" style={{ paddingBottom: 'max(12px, calc(10px + var(--sab)))' }}>
            {!short && <ChipRow gap={6} className="-mx-6 px-6" role="group" aria-label="빠른 답장">
              {room.quickReplies.map((q) => <Chip key={q} size="smTall" onClick={() => void send(q)} pressable={false}>{q}</Chip>)}
            </ChipRow>}
            <form onSubmit={onSubmit} className={`${short ? 'mt-[8px]' : 'mt-[25.8px]'} flex h-[52px] items-center rounded-full bg-night-1 pl-[22px] pr-[6px] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-lime`}>
              <label htmlFor="chat-input" className="sr-only">메시지</label>
              <input id="chat-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="메시지 보내기" autoComplete="off" enterKeyHint="send" maxLength={500}
                className="h-full min-w-0 flex-1 bg-transparent pb-[4px] text-[15px] leading-[1.35] text-white outline-none placeholder:text-night-muted focus-visible:outline-none" />
              <button type="submit" aria-label="보내기" disabled={!text.trim()}
                className="ml-[8px] flex size-[40px] shrink-0 items-center justify-center rounded-full bg-lime text-[18px] font-bold leading-none text-ink">↑</button>
            </form>
          </div>
        )}
      </div>
    </Screen>
  )
}

/** 화면(보이는 영역) 높이가 h 보다 낮은지 — 모바일 키보드가 올라오면 visualViewport 가 줄어요 */
function useShortViewport(h: number) {
  const [short, setShort] = useState(() => viewportH() < h)
  useEffect(() => {
    const vv = window.visualViewport
    const on = () => setShort(viewportH() < h)
    vv?.addEventListener('resize', on)
    window.addEventListener('resize', on)
    return () => { vv?.removeEventListener('resize', on); window.removeEventListener('resize', on) }
  }, [h])
  return short
}
const viewportH = () => window.visualViewport?.height ?? window.innerHeight

const isMine = (m: ChatMessage | undefined, meId?: string) => !!m && m.kind !== 'system' && m.author.id === meId

/**
 * 말풍선 하나. 위쪽 간격은 피그마 그대로:
 * 안내 → 친구 9px, 친구 → 나 15px, 나 → 친구 5px, 친구 → 친구 6px, 나 → 나 6px
 */
function Message({ m, prev, mine, prevMine, meetingId, voting }: { m: ChatMessage; prev?: ChatMessage; mine: boolean; prevMine: boolean; meetingId: string; voting: boolean }) {
  if (m.kind === 'system') {
    return (
      <p className={`flex justify-center ${prev ? 'mt-[12px]' : 'mt-[10px]'}`}>
        <span className="rounded-full bg-night-1 px-[12px] py-[5px] text-center text-[11px] font-medium leading-[1.35] text-white">{m.text}</span>
      </p>
    )
  }
  const mt = !prev ? 10 : prev.kind === 'system' ? 9 : mine ? (prevMine ? 6 : 15) : prevMine ? 5 : 6
  if (mine) {
    return (
      <div className="flex justify-end" style={{ marginTop: mt }}>
        {m.kind === 'text'
          ? <p className="max-w-[80%] rounded-[18px] bg-lime px-[14px] py-[10px] text-[14px] font-medium leading-[1.35] break-words text-ink">{m.text}</p>
          : <PlaceCard place={m.place} meetingId={meetingId} voting={voting} />}
      </div>
    )
  }
  return (
    <div className="flex items-start" style={{ marginTop: mt }}>
      <Avatar member={m.author} size={32} ring={2} ringColor="var(--color-night)" fontSize={13} />
      <div className="ml-[8px] min-w-0 max-w-[calc(100%-40px)]">
        <p className="mt-[2px] text-[11px] font-bold leading-[1.35] text-night-muted">{m.author.name}</p>
        <div className="mt-[3.15px]">
          {m.kind === 'text'
            ? <p className="inline-block max-w-full rounded-[18px] bg-night-2 px-[14px] py-[10px] text-[14px] font-medium leading-[1.35] break-words text-white">{m.text}</p>
            : <PlaceCard place={m.place} meetingId={meetingId} voting={voting} />}
        </div>
      </div>
    </div>
  )
}

/** 장소 공유 카드 240×150 */
function PlaceCard({ place: p, meetingId, voting }: { place: SharedPlace; meetingId: string; voting: boolean }) {
  return (
    <div className="relative h-[150px] w-[240px] max-w-full overflow-hidden rounded-[20px] bg-night-2">
      <Link to={`/place/${p.placeId}`} aria-label={`${p.name} 장소 보기`} className="absolute inset-x-0 top-0 block h-[78px]">
        <Photo src={p.photoUrl} className="h-[78px] w-full" radius={0} tone="mid" plain />
      </Link>
      {p.kingGroupName && (
        <KingTag name={p.kingGroupName} size={10} className="pointer-events-none absolute left-[10px] top-[10px] max-w-[calc(100%-20px)]" />
      )}
      <p className="absolute left-[14px] right-[90px] top-[86px] truncate text-[14px] font-bold leading-[1.35] text-white">{p.name}</p>
      <p className="absolute left-[14px] right-[90px] top-[106px] truncate text-[11px] font-medium leading-[1.35] text-night-muted">{p.category} · 도보 {p.walkMin}분</p>
      <Link to={voting ? `/meet/${meetingId}/vote` : `/place/${p.placeId}`} className="absolute right-[11px] top-[98px] rounded-full bg-lime px-[12px] py-[6px] text-[12px] font-bold leading-[1.35] text-ink">{voting ? '투표하기' : '보기'}</Link>
    </div>
  )
}


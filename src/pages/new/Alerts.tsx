import { useState } from 'react'
import { Link } from 'react-router-dom'
import { meApi, type AlertCategory, type AlertItem, type AlertKind } from '../../api/me'
import { useApi } from '../../api/useApi'
import { Chip, ChipRow } from '../../components/Chip'
import { Crown } from '../../components/Crown'
import { IconButton } from '../../components/IconButton'
import { Screen } from '../../components/Screen'
import { StateView } from '../../components/StateView'
import { TabBar, TabBarSpacer } from '../../components/TabBar'
import { announce } from '../../components/toast'

const FILTERS: ('전체' | AlertCategory)[] = ['전체', '약속', '랭킹', '모임']
const SECTIONS: AlertItem['section'][] = ['오늘', '이번 주', '지난 알림']

/** 알림 종류별 아이콘 글자 (왕좌를 빼앗긴 알림만 라임 원 + 왕관) */
const GLYPH: Record<Exclude<AlertKind, 'throneLost'>, string> = { tug: '↔', depart: '◎', invite: '+', throneWon: '★', rankUp: '▲' }

/** H · 알림 (피그마 30:8) */
export default function Alerts() {
  const { data, status } = useApi(meApi.alerts)
  // 이 화면에서 읽음 처리한 알림 (서버 응답 위에 덧씌움). 'all' = 모두 읽음
  const [readHere, setReadHere] = useState<Set<string> | 'all'>(() => new Set())
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('전체')
  const items = (data ?? []).map((a) => (readHere === 'all' || readHere.has(a.id) ? { ...a, read: true } : a))

  const unread = items.filter((a) => !a.read).length
  const list = items.filter((a) => filter === '전체' || a.category === filter)

  const markRead = (ids?: string[]) => {
    setReadHere((prev) => (!ids || prev === 'all' ? 'all' : new Set([...prev, ...ids])))
    if (!ids) announce('알림을 모두 읽음으로 표시했어요')
    void meApi.markRead(ids)
  }

  return (
    <Screen title="알림">
      <div className="relative px-6 pt-[19px]">
        <h1 className="text-[34px] font-black leading-[1.15] tracking-[-0.01em]">알림</h1>
        {/* 새 소식 수는 제목 밖에 (제목 이름이 '알림' 하나로 읽히게). '모두 읽음' 결과만 따로 읽어줘요 */}
        <p className="mt-[2.9px] text-[34px] font-black leading-[1.15] tracking-[-0.01em] text-lime">{data ? (unread > 0 ? `새 소식 ${unread}개` : '모두 읽었어요') : '\u00a0'}</p>
        <IconButton label="모두 읽음으로 표시" className="absolute right-6 top-[26px]" onClick={() => markRead()}>
          {/* 피그마의 ✓ 글자 모양 (글꼴마다 크기가 달라 선으로 그림) */}
          <svg width="13" height="14" viewBox="0 0 13 14" aria-hidden className="mt-[1px]"><path d="M1.2 8.2 4.6 12.6 11.8 1.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </IconButton>

        <ChipRow className="-mx-6 mt-[27.9px] h-[36px] px-6">
          {FILTERS.map((f) => <Chip key={f} on={filter === f} onClick={() => setFilter(f)}>{f}</Chip>)}
        </ChipRow>

        <StateView status={status} what="알림" />
        {SECTIONS.map((s, i) => {
          const rows = list.filter((a) => a.section === s)
          if (!rows.length) return null
          return (
            <section key={s} aria-label={s} className={i === 0 || !list.some((a) => a.section === SECTIONS[i - 1]) ? 'mt-[16px]' : 'mt-[8px]'}>
              <h2 className="text-[13px] font-bold leading-[1.35] text-night-muted">{s}</h2>
              <ul className="mt-[8.45px] space-y-[8px]">
                {rows.map((a) => <AlertRow key={a.id} a={a} onOpen={() => markRead([a.id])} />)}
              </ul>
            </section>
          )
        })}
        {data && list.length === 0 && (
          <p className="mt-[16px] rounded-[20px] bg-night-1 px-5 py-6 text-[14px] leading-[1.5] text-night-muted">{filter} 알림이 아직 없어요.</p>
        )}
      </div>
      <div className="h-[16px]" />
      <TabBarSpacer />
      <TabBar active="alerts" />
    </Screen>
  )
}

/** 알림 한 줄 66px. 안 읽은 알림 = 진한 카드 + 라임 점 */
function AlertRow({ a, onOpen }: { a: AlertItem; onOpen: () => void }) {
  return (
    <li>
      <Link to={a.to} onClick={onOpen} className={`relative flex h-[66px] items-start rounded-[20px] pl-[14px] pr-[14px] ${a.read ? 'bg-night-1' : 'bg-night-2'}`}>
        {a.kind === 'throneLost'
          ? <span aria-hidden className="mt-[13px] flex size-[40px] shrink-0 items-center justify-center rounded-full bg-lime"><Crown width={20} fill="var(--color-ink)" /></span>
          : <span aria-hidden className="mt-[13px] flex size-[40px] shrink-0 items-center justify-center rounded-full bg-night-line text-[16px] font-bold leading-none text-lime">{GLYPH[a.kind]}</span>}
        <span className="ml-[12px] min-w-0 flex-1 pr-[32px]">
          <span className="mt-[12px] block truncate text-[14px] font-bold leading-[1.35] text-white">{a.title}</span>
          <span className="mt-[3.1px] line-clamp-2 text-[11px] font-medium leading-[1.35] text-night-muted">{a.body}</span>
        </span>
        <span className="absolute right-[14px] top-[14px] text-[10px] font-medium leading-[1.35] text-night-muted">{a.timeLabel}</span>
        {!a.read && <span className="absolute right-[12px] top-[40px] block size-[8px] rounded-full bg-lime"><span className="sr-only">안 읽음</span></span>}
      </Link>
    </li>
  )
}

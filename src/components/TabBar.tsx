import { Link } from 'react-router-dom'
import { Crown } from './Crown'

type TabKey = 'home' | 'ranking' | 'alerts' | 'my'

/** 390px보다 좁은 폰에서는 간격을 비율대로 줄여 양끝 탭이 잘리지 않게 */
const offsetLeft = (px: number) => `calc(50% ${px < 0 ? '-' : '+'} min(${Math.abs(px)}px, ${(Math.abs(px) / 390) * 100}vw))`

/** 하단 탭바. 피그마 기준 가운데(195px)에서 -146, -68, 0, +68, +146px 위치 */
export function TabBar({ active, theme = 'dark' }: { active: TabKey; theme?: 'dark' | 'light' }) {
  const dark = theme === 'dark'
  const on = dark ? 'var(--color-lime)' : 'var(--color-ink)'
  const off = dark ? 'var(--color-night-off)' : 'var(--color-paper-muted)'
  const item = (key: TabKey, label: string, to: string, offset: number) => {
    const isOn = active === key
    const color = isOn ? on : off
    return (
      <Link key={key} to={to} aria-label={label} aria-current={isOn ? 'page' : undefined}
        className="absolute top-0 flex h-[49px] w-[60px] -translate-x-1/2 flex-col items-center"
        style={{ left: offsetLeft(offset) }}>
        {key === 'ranking'
          ? <span className="mt-[13px] flex h-[20px] items-start"><Crown width={22} fill={isOn ? 'var(--color-lime)' : off} stroke={isOn && !dark ? 'var(--color-ink)' : undefined} /></span>
          /* 아이콘 자리: 피그마에 아직 아이콘이 없어 둥근 네모로 표시 (은수 확정 후 교체) */
          : <span className="mt-[11px] block size-[20px] rounded-[7px]" style={{ background: color }} />}
        <span className={`absolute top-[37px] text-[11px] leading-[1.35] ${isOn ? 'font-bold' : 'font-medium'}`} style={{ color }}>{label}</span>
      </Link>
    )
  }
  return (
    <nav aria-label="주요 메뉴" className={`fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t ${dark ? 'border-night-tab-line bg-night-tab' : 'border-paper-line bg-white'}`}
      style={{ paddingBottom: 'var(--tabpad)' }}>
      <div className="relative h-[49px]">
        {item('home', '홈', '/', -146)}
        {item('ranking', '랭킹', '/ranking', -68)}
        <Link to="/new" aria-label="새 약속 만들기" className="absolute top-[5px] flex size-[52px] -translate-x-1/2 items-center justify-center rounded-full bg-lime" style={{ left: '50%' }}>
          <span className="relative block size-[18px]">
            <span className="absolute left-0 top-[7.25px] h-[3.5px] w-[18px] rounded-[2px] bg-ink" />
            <span className="absolute left-[7.25px] top-0 h-[18px] w-[3.5px] rounded-[2px] bg-ink" />
          </span>
        </Link>
        {item('alerts', '알림', '/alerts', 68)}
        {item('my', '마이', '/my', 146)}
      </div>
    </nav>
  )
}

/** 탭바 높이만큼 아래 여백 */
export function TabBarSpacer() {
  return <div aria-hidden style={{ height: 'calc(50px + var(--tabpad))' }} />
}

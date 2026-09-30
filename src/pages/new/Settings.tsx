import { useState, type ReactNode } from 'react'
import { meApi, type SettingKey, type Settings as SettingsData } from '../../api/me'
import { useApi } from '../../api/useApi'
import { ToggleTrack } from '../../components/Toggle'
import { Screen } from '../../components/Screen'
import { StateView } from '../../components/StateView'
import { soon } from '../../components/toast'
import { TopBar } from '../../components/TopBar'

/** J · 설정 (피그마 30:156) */
export default function Settings() {
  const { data, status } = useApi(meApi.settings)
  // 이 화면에서 바꾼 값 (서버 응답 위에 덧씌움)
  const [changed, setChanged] = useState<Partial<Record<SettingKey, boolean>>>({})
  const s: SettingsData | undefined = data && { ...data, ...changed }

  const flip = (key: SettingKey) => {
    if (!s) return
    const next = !s[key]
    setChanged((c) => ({ ...c, [key]: next }))
    void meApi.updateSetting(key, next)
  }
  const sw = (key: SettingKey, label: string) => s && <SwitchRow label={label} on={s[key]} onClick={() => flip(key)} />

  return (
    <Screen title="설정">
      <div className="px-6">
        <TopBar title="설정" fallback="/my" />
        <StateView status={status} what="설정" />
        {s && (
          <>
            <Group title="알림" first>
              {sw('depart', '출발 알림')}
              {sw('coaching', '준비 코칭')}
              {sw('throne', '왕좌 변동 알림')}
              {sw('tug', '줄다리기 시작 알림')}
            </Group>
            <Group title="위치 · 개인정보">
              <LinkRow label="약속 당일 위치 공유" value={s.locationShare} />
              {sw('publicRanking', '랭킹에 모임 공개')}
              <LinkRow label="모임 대표사진 변경" />
            </Group>
            <Group title="계정">
              <LinkRow label="연결된 지도" value={s.map} />
              <Row onClick={soon}><span className="-mt-[3px] text-[14px] font-medium leading-[1.35] text-live">로그아웃</span></Row>
            </Group>
          </>
        )}
      </div>
      <div className="h-[32px]" style={{ paddingBottom: 'var(--sab)' }} />
    </Screen>
  )
}

/** 설정 묶음: 회색 제목 + 둥근 카드 (줄 사이 구분선) */
function Group({ title, first = false, children }: { title: string; first?: boolean; children: ReactNode }) {
  return (
    <section aria-label={title} className={first ? 'mt-[16px]' : 'mt-[20px]'}>
      <h2 className="px-[4px] text-[13px] font-bold leading-[1.35] text-night-muted">{title}</h2>
      <ul className="mt-[6.45px] overflow-hidden rounded-[20px] bg-night-1 [&>li+li]:before:absolute [&>li+li]:before:inset-x-[16px] [&>li+li]:before:top-0 [&>li+li]:before:h-px [&>li+li]:before:bg-night-line">
        {children}
      </ul>
    </section>
  )
}

/** 한 줄 52px 버튼 (카드 안 둥근 모서리에 맞춰 포커스 테두리는 안쪽으로) */
function Row({ children, onClick, ...aria }: { children: ReactNode; onClick: () => void; role?: string; 'aria-checked'?: boolean }) {
  return (
    <li className="relative">
      <button type="button" onClick={onClick} {...aria}
        className="flex h-[52px] w-full items-center justify-between pl-[18px] pr-[16px] text-left focus-visible:outline-offset-[-2px]">
        {children}
      </button>
    </li>
  )
}

/** 켜고 끄는 줄 — 줄 전체가 스위치 */
function SwitchRow({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <Row onClick={onClick} role="switch" aria-checked={on}>
      <span className="-mt-[3px] text-[14px] font-medium leading-[1.35] text-white">{label}</span>
      <ToggleTrack on={on} />
    </Row>
  )
}

/** 다른 화면으로 가는 줄 (아직 준비 중) */
function LinkRow({ label, value }: { label: string; value?: string }) {
  return (
    <Row onClick={soon}>
      <span className="-mt-[3px] text-[14px] font-medium leading-[1.35] text-white">{label}</span>
      {value
        ? <span className="ml-3 shrink-0 whitespace-pre text-[12px] font-medium leading-[1.35] text-night-muted">{value}<span aria-hidden>{'  →'}</span></span>
        : <span aria-hidden className="ml-3 -mt-[3px] shrink-0 text-[14px] font-bold leading-[1.35] text-night-muted">→</span>}
    </Row>
  )
}

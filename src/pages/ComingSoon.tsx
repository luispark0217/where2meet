import { useBack } from '../components/useBack'
import { IconButton } from '../components/IconButton'
import { Screen } from '../components/Screen'
import { TabBar, TabBarSpacer } from '../components/TabBar'

/** 아직 디자인이 없는 화면 (알림 · 마이 · 새 약속) */
export default function ComingSoon({ title, tab }: { title: string; tab?: 'alerts' | 'my' }) {
  const back = useBack()
  return (
    <Screen title={title}>
      <div className="px-6">
        {!tab && <div className="mt-[8px]"><IconButton label="뒤로" onClick={back}>←</IconButton></div>}
        <h1 className="mt-[20px] text-[34px] font-black leading-[1.15]">{title}</h1>
        <p className="mt-4 rounded-[22px] bg-night-1 px-5 py-6 text-[14px] leading-[1.6] text-night-muted">디자인이 준비되면 여기에 들어가요.</p>
      </div>
      <TabBarSpacer />
      {tab && <TabBar active={tab} />}
    </Screen>
  )
}

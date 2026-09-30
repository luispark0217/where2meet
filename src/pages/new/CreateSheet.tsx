import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api'
import { socialApi } from '../../api/social'
import { useApi } from '../../api/useApi'
import { AvatarStack } from '../../components/Avatar'
import { Chip, ChipRow } from '../../components/Chip'
import { BottomSheet } from '../../components/BottomSheet'
import { toast } from '../../components/toast'
import { useBack } from '../../components/useBack'
import MyGroups from '../MyGroups'

/** K · 만들기 (+) — 무엇을 만들까요? 시트 (피그마 31:2). 뒤에는 내 모임 화면을 어둡게 깔아요. */
export default function CreateSheet() {
  const close = useBack('/')
  const nav = useNavigate()
  const { data: groups } = useApi(api.myGroups)
  const { data: me } = useApi(api.me)
  // ?group=g-film (모임 상세의 '+ 새 약속') · ?place=p-wine (왕좌 도전의 '여기서 약속 잡기')
  const [params] = useSearchParams()
  const placeId = params.get('place') ?? undefined
  const { data: place } = useApi(() => (placeId ? api.placeKing(placeId) : Promise.resolve(undefined)), [placeId])
  const [groupId, setGroupId] = useState<string | undefined>(params.get('group') ?? undefined)
  const picked = groups?.some((g) => g.id === groupId) ? groupId : groups?.[0]?.id
  const friends = (groups?.[0]?.members ?? []).filter((m) => m.id !== me?.id).slice(0, 3)
  const [busy, setBusy] = useState(false)

  const start = async () => {
    if (!picked || busy) return
    setBusy(true)
    try {
      const m = await socialApi.createMeeting({ groupId: picked, placeId: place?.place.id })
      if (!m) throw new Error('no meeting')
      toast('새 약속을 만들었어요. 가능한 시간을 모아볼게요')
      // 시트는 기록에서 빼요 → 약속에서 뒤로 가면 시트를 연 화면으로
      nav(`/meet/${m.id}`, { replace: true })
    } catch {
      toast('만들지 못했어요. 잠시 뒤 다시 시도해주세요')
      setBusy(false)
    }
  }

  return (
    <BottomSheet title="무엇을 만들까요?" onClose={close} background={<MyGroups />}>
      {/* 새 약속 잡기 — 누르면 바로 시작 (아래 버튼과 같아요) */}
      <button type="button" onClick={() => void start()} disabled={!picked || busy}
        className="relative mt-[21px] block h-[108px] w-full overflow-hidden rounded-[24px] bg-lime text-left text-ink">
        {/* 시간표 아이콘 (3×3 칸) */}
        <span aria-hidden className="absolute left-[20px] top-[24px] grid grid-cols-3 gap-[4px]">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="size-[12px] rounded-[3px]" style={{ background: (Math.floor(i / 3) + (i % 3)) % 2 === 0 ? 'rgba(17,20,18,.8)' : 'rgba(17,20,18,.25)' }} />
          ))}
        </span>
        <span className="absolute left-[84px] right-[60px] top-[24px] truncate text-[18px] font-black leading-[1.35]">새 약속 잡기</span>
        <span className="absolute left-[84px] right-[60px] top-[52px] truncate text-[12px] font-medium leading-[1.35] text-ink/70">시간 맞추기 + 중간 장소 추천</span>
        <Arrow top={36} />
      </button>

      {/* 새 모임 만들기 → Q */}
      <button type="button" onClick={() => nav('/group/new', { replace: true })}
        className="relative mt-[12px] block h-[92px] w-full overflow-hidden rounded-[24px] bg-cream text-left text-ink">
        <span className="absolute left-[16px] top-[33px]"><AvatarStack members={friends} size={26} step={16} ringColor="var(--color-cream)" /></span>
        <span className="absolute left-[84px] right-[60px] top-[20px] truncate text-[17px] font-black leading-[1.35]">새 모임 만들기</span>
        <span className="absolute left-[84px] right-[60px] top-[46px] truncate text-[12px] font-medium leading-[1.35] text-ink/70">멤버 초대 · 대표사진 · 랭킹 참가</span>
        <Arrow top={28} />
      </button>

      <h3 id="k-groups-h" className="mt-[24px] text-[14px] font-bold leading-[1.35]">어느 모임의 약속인가요?</h3>
      {place && <p className="mt-[4px] truncate text-[12px] font-medium leading-[1.35] text-lime">장소: {place.place.name}에서 만나요</p>}
      <div id="k-groups" tabIndex={-1} role="group" aria-labelledby="k-groups-h" className="-mx-6 mt-[9px] outline-none">
        <ChipRow gap={6} className="h-[32px] px-6">
          {(groups ?? []).map((g) => (
            <Chip key={g.id} size="smTall" on={picked === g.id} onClick={() => setGroupId(g.id)}>{g.name}</Chip>
          ))}
        </ChipRow>
      </div>

      <button type="button" onClick={() => void start()} disabled={!picked || busy} aria-busy={busy}
        className="mt-[28px] flex h-[56px] w-full items-center justify-center rounded-full bg-lime text-[16px] font-bold leading-[1.35] text-ink">
        약속 만들기 시작
      </button>
    </BottomSheet>
  )
}

/** 오른쪽 검은 동그라미 화살표 (36px) */
function Arrow({ top }: { top: number }) {
  return (
    <span aria-hidden className="absolute right-[16px] flex size-[36px] items-center justify-center rounded-full bg-ink text-[15px] font-bold leading-none text-white" style={{ top }}>→</span>
  )
}

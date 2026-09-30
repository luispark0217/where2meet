import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../api/useApi'
import { socialApi, type NewGroupDraft } from '../../api/social'
import { Avatar } from '../../components/Avatar'
import { Chip, ChipRow } from '../../components/Chip'
import { Crown } from '../../components/Crown'
import { Screen } from '../../components/Screen'
import { copyLink } from '../../components/copyLink'
import { soon, toast } from '../../components/toast'
import { ToggleTrack } from '../../components/Toggle'
import { TopBar } from '../../components/TopBar'

/** Q · 새 모임 만들기 (피그마 35:119) */
export default function NewGroup() {
  const nav = useNavigate()
  const { data: draft } = useApi(socialApi.newGroupDraft)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<NewGroupDraft['categories'][number]>('친구')
  const [joinRanking, setJoinRanking] = useState(true)
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [nameError, setNameError] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  // 미리보기 주소 정리
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url) }, [photo])

  const create = async () => {
    if (busy) return
    if (!draft) { toast('아직 불러오는 중이에요. 잠시 뒤 다시 눌러주세요'); return }
    if (!name.trim()) { setNameError(true); toast('모임 이름을 적어주세요'); nameRef.current?.focus(); return }
    setBusy(true)
    try {
      const g = await socialApi.createGroup({ name: name.trim(), category, memberIds: draft.invitees.map((m) => m.id), joinRanking, photo: photo?.file })
      toast('모임을 만들었어요')
      nav(`/group/${g.id}`, { replace: true })
    } catch {
      toast('만들지 못했어요. 잠시 뒤 다시 시도해주세요')
      setBusy(false)
    }
  }

  return (
    <Screen title="새 모임">
      <div className="flex flex-col px-6" style={{ minHeight: 'calc(100dvh - var(--sat))' }}>
        <TopBar title="새 모임" />

        {/* 대표사진 업로드 */}
        <button type="button" onClick={() => fileRef.current?.click()} aria-label={photo ? '대표사진 바꾸기' : '대표사진 올리기'}
          className="mx-auto mt-[16px] flex size-[120px] flex-col items-center justify-center gap-[4px] overflow-hidden rounded-full border-2 border-dashed border-lime bg-night-1"
          style={photo ? { background: `center/cover url("${photo.url}")` } : undefined}>
          {!photo && <>
            <span aria-hidden className="text-[30px] font-black leading-none text-lime">+</span>
            <span className="text-[12px] font-bold leading-[1.35] text-white">대표사진</span>
          </>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" tabIndex={-1} aria-hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto({ file: f, url: URL.createObjectURL(f) }) }} />
        <p className="mt-[12px] text-center text-[12px] font-medium leading-[1.35] text-lime">이 사진이 서울 왕좌 지도에 왕 아이콘으로 떠요</p>

        <label htmlFor="q-name" className="mt-[25.8px] text-[13px] font-bold leading-[1.35] text-night-muted">모임 이름</label>
        <input id="q-name" ref={nameRef} value={name} onChange={(e) => { setName(e.target.value); if (e.target.value.trim()) setNameError(false) }} maxLength={20} enterKeyHint="done"
          placeholder="예) 대학 동기 모임" autoComplete="off" aria-invalid={nameError || undefined} aria-describedby={nameError ? 'q-name-err' : undefined}
          className="mt-[6.45px] h-[54px] w-full rounded-[18px] bg-night-1 px-[20px] text-[15px] font-medium leading-[1.35] text-white placeholder:text-night-muted focus:outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime aria-invalid:outline-solid aria-invalid:outline-2 aria-invalid:outline-live" />
        {nameError && <p id="q-name-err" className="mt-[6px] text-[12px] font-medium leading-[1.35] text-live">모임 이름을 적어주세요</p>}

        <h2 id="q-cat" className="mt-[18px] text-[13px] font-bold leading-[1.35] text-night-muted">모임 종류</h2>
        <div role="group" aria-labelledby="q-cat" className="-mx-6 mt-[6.45px]">
          <ChipRow gap={6} className="h-[36px] px-6">
            {(draft?.categories ?? []).map((c) => <Chip key={c} on={category === c} onClick={() => setCategory(c)}>{c}</Chip>)}
          </ChipRow>
        </div>

        <h2 className="mt-[28px] text-[13px] font-bold leading-[1.35] text-night-muted">멤버 초대</h2>
        <ul className="mt-[8.45px] flex items-center gap-[8px]" aria-label="초대한 멤버">
          {draft?.invitees.map((m) => <li key={m.id}><Avatar member={m} size={44} ring={3} ringColor="var(--color-night)" fontSize={18} /></li>)}
          <li>
            <button type="button" aria-label="멤버 더 초대하기" onClick={soon}
              className="flex size-[44px] items-center justify-center rounded-full border-[1.5px] border-dashed border-white/35 text-[20px] font-bold leading-none text-white">+</button>
          </li>
        </ul>
        <div className="mt-[14px] flex gap-[8px]">
          <button type="button" onClick={soon} className="h-[40px] w-[120px] rounded-full border border-white/30 text-[13px] font-bold leading-[1.35]">카톡 초대</button>
          <button type="button" onClick={() => draft && copyLink(draft.inviteUrl, '초대 링크를 복사했어요')} className="h-[40px] w-[120px] rounded-full border border-white/30 text-[13px] font-bold leading-[1.35]">링크 복사</button>
        </div>

        {/* 서울 왕좌 랭킹 참가 토글 */}
        {/* 카드 전체가 스위치예요 (J 설정과 같이) — 누를 자리가 72px 로 넓어요 */}
        <button type="button" role="switch" aria-checked={joinRanking} aria-labelledby="q-rank" aria-describedby="q-rank-d" onClick={() => setJoinRanking((v) => !v)}
          className="relative mt-[26px] flex h-[72px] w-full items-center rounded-[20px] bg-night-1 pl-[18px] pr-[16px] text-left">
          <Crown width={22} className="mb-[6px]" />
          <span className="mb-[3px] ml-[12px] min-w-0 flex-1">
            <span id="q-rank" className="block truncate text-[14px] font-bold leading-[1.35]">서울 왕좌 랭킹 참가</span>
            <span id="q-rank-d" className="mt-[5.1px] block truncate text-[11px] font-medium leading-[1.35] text-night-muted">방문 기록으로 장소의 왕 자리에 도전해요</span>
          </span>
          <span className="ml-[8px]"><ToggleTrack on={joinRanking} /></span>
        </button>

        {/* 아래 버튼 — 내용이 길면 화면 아래에 붙어 있어요 */}
        <div className="sticky bottom-0 -mx-6 mt-auto bg-gradient-to-t from-night from-70% to-transparent px-6 pt-[24px]"
          style={{ paddingBottom: 'max(16px, calc(var(--sab) - 10px))' }}>
          <button type="button" onClick={create} disabled={busy} aria-busy={busy}
            className="flex h-[56px] w-full items-center justify-center rounded-full bg-lime text-[16px] font-bold leading-[1.35] text-ink disabled:opacity-60">
            모임 만들기
          </button>
        </div>
      </div>
    </Screen>
  )
}

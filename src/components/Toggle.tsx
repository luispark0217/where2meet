/**
 * 켜고 끄는 스위치 모양 (46×28, 손잡이 22px · 안쪽 여백 3px)
 * 켜짐 = 라임 바탕 + 검은 손잡이 오른쪽 / 꺼짐 = 진한 회색 바탕 + 회색 손잡이 왼쪽
 * 모양만 그려요. 누르는 역할(role="switch")은 감싸는 줄 버튼(SwitchRow)이 맡아요.
 */
export function ToggleTrack({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={`relative block h-[28px] w-[46px] shrink-0 rounded-[14px] transition-colors ${on ? 'bg-lime' : 'bg-night-line'}`}>
      <span className={`absolute top-[3px] block size-[22px] rounded-full transition-[left] motion-reduce:transition-none ${on ? 'left-[21px] bg-ink' : 'left-[3px] bg-night-muted'}`} />
    </span>
  )
}

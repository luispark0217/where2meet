import type { AvatarColor, Member } from '../data/types'

const BG: Record<AvatarColor, string> = {
  lime: 'var(--color-lime)',
  yellow: 'var(--color-av-yellow)',
  blue: 'var(--color-av-blue)',
  pink: 'var(--color-av-pink)',
  purple: 'var(--color-av-purple)',
}

type AvatarMember = Pick<Member, 'name' | 'color' | 'photoUrl'>

/** 이름 첫 글자 아바타 (사진이 있으면 사진) */
export function Avatar({ member, size = 24, ring = 2, ringColor = 'transparent', fontSize = 10, className = '', style }: {
  member: AvatarMember
  size?: number; ring?: number; ringColor?: string; fontSize?: number; className?: string; style?: React.CSSProperties
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold leading-none text-ink ${className}`}
      style={{
        width: size, height: size, fontSize,
        background: member.photoUrl ? `center/cover url("${member.photoUrl}")` : BG[member.color],
        border: `${ring}px solid ${ringColor}`,
        ...style,
      }}
      role="img"
      aria-label={member.name}
    >
      {member.photoUrl ? null : member.name.slice(0, 1)}
    </span>
  )
}

/** 겹쳐 놓은 아바타 줄. step = 다음 아바타 왼쪽까지의 거리 */
export function AvatarStack({ members, size = 24, step = 16, ring = 2, ringColor, fontSize = 10 }: {
  members: (AvatarMember & { id: string })[]; size?: number; step?: number; ring?: number; ringColor: string; fontSize?: number
}) {
  return (
    <span className="flex">
      {members.map((m, i) => (
        <Avatar key={m.id} member={m} size={size} ring={ring} ringColor={ringColor} fontSize={fontSize}
          className="relative" style={{ marginLeft: i === 0 ? 0 : step - size, zIndex: i }} />
      ))}
    </span>
  )
}

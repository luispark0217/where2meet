/*
 * 짧은 알림 (toast) + 화면 읽기 프로그램 안내
 * - 눈에 보이는 알약은 aria-hidden, 읽어주는 건 처음부터 문서에 있는 숨은 live 영역 하나가 맡아요.
 *   (live 영역을 글자와 함께 새로 만들면 VoiceOver·TalkBack 이 자주 놓쳐요)
 */
let timer: number | undefined
let region: HTMLElement | null = null

/** 화면에는 안 보이고 읽어주기만 (예: '모두 읽었어요') */
export function announce(msg: string) {
  if (!region || !region.isConnected) {
    region = document.createElement('div')
    region.setAttribute('role', 'status')
    region.setAttribute('aria-live', 'polite')
    region.className = 'sr-only'
    document.body.appendChild(region)
  }
  const r = region
  r.textContent = ''
  // 같은 문구를 연달아 보내도 다시 읽도록 비웠다가 다음 프레임에 채워요
  window.requestAnimationFrame(() => { r.textContent = msg })
}

export function toast(msg: string) {
  document.querySelector('.w2m-toast')?.remove()
  const el = document.createElement('div')
  el.className = 'w2m-toast'
  el.setAttribute('aria-hidden', 'true')
  el.textContent = msg
  document.body.appendChild(el)
  announce(msg)
  window.clearTimeout(timer)
  timer = window.setTimeout(() => el.remove(), 2000)
}
export const soon = () => toast('아직 준비 중인 기능이에요')

// 앱이 뜰 때 live 영역을 미리 만들어 둬요 (처음 알림도 놓치지 않게)
if (typeof document !== 'undefined') {
  const init = () => { if (!region) { announce('') } }
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init)
}

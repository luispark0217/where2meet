/** 짧은 알림 (아직 기능이 연결되지 않은 버튼 등) */
let timer: number | undefined
export function toast(msg: string) {
  document.querySelector('.w2m-toast')?.remove()
  const el = document.createElement('div')
  el.className = 'w2m-toast'
  el.setAttribute('role', 'status')
  el.textContent = msg
  document.body.appendChild(el)
  window.clearTimeout(timer)
  timer = window.setTimeout(() => el.remove(), 2000)
}
export const soon = () => toast('아직 준비 중인 기능이에요')

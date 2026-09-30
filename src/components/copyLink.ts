import { toast } from './toast'

/** 링크 복사. 클립보드를 못 쓰는 환경(권한 없음·http)이면 링크를 알림으로 보여줘요. */
export async function copyLink(url: string, done = '링크를 복사했어요') {
  try {
    if (!navigator.clipboard) throw new Error('no clipboard')
    await navigator.clipboard.writeText(url)
    toast(done)
  } catch {
    toast(url.replace(/^https?:\/\//, ''))
  }
}

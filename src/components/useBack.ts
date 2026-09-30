import { useLocation, useNavigate } from 'react-router-dom'

/** 뒤로가기. 공유 링크로 바로 들어와 이전 화면이 없으면 홈(또는 fallback)으로 가요. */
export function useBack(fallback = '/') {
  const nav = useNavigate()
  const loc = useLocation()
  return () => (loc.key === 'default' ? nav(fallback, { replace: true }) : nav(-1))
}

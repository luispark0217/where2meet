import { useEffect, useState } from 'react'

export type ApiStatus = 'loading' | 'ok' | 'notfound' | 'error'

/**
 * 화면에서 데이터를 불러올 때 쓰는 도우미.
 * - 주소(deps)가 바뀌면 이전 데이터를 지우고 다시 불러와요.
 * - 결과가 undefined 면 '없음(notfound)', 실패하면 'error'.
 */
export function useApi<T>(load: () => Promise<T | undefined>, deps: unknown[] = []) {
  const [state, setState] = useState<{ data?: T; status: ApiStatus; error?: unknown }>({ status: 'loading' })
  useEffect(() => {
    let alive = true
    setState({ status: 'loading' })
    load()
      .then((d) => alive && setState(d === undefined ? { status: 'notfound' } : { data: d, status: 'ok' }))
      .catch((e) => alive && setState({ status: 'error', error: e }))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return { ...state, loading: state.status === 'loading' }
}

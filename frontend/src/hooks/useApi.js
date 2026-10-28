import { useEffect, useState } from 'react'
export default function useApi(fn, deps = []) {
  const [state, set] = useState({ data: null, error: null, loading: true })
  useEffect(() => { let on = true; set(s => ({ ...s, loading: true }))
    fn().then(d => on && set({ data: d, error: null, loading: false })).catch(e => on && set({ data: null, error: e.message, loading: false }))
    return () => { on = false } }, deps)
  return state
}

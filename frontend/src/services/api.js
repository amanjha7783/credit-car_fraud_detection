async function req(url, opts) {
  let r
  try { r = await fetch(url, opts) } catch { throw new Error('Cannot reach the backend. Start FastAPI on port 8000.') }
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || `Request failed (${r.status})`) }
  return r.json()
}
export const api = {
  summary: () => req('/api/summary'), transactions: () => req('/api/transactions'), alerts: () => req('/api/alerts'),
  quality: () => req('/api/data-quality'), customers: () => req('/api/customers'), customer: id => req(`/api/customers/${id}`),
  upload: f => { const fd = new FormData(); fd.append('file', f); return req('/api/upload', { method: 'POST', body: fd }) },
  analyze: cfg => req('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) }),
}

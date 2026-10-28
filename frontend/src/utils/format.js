export const usd = v => v == null ? '—' : v.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
export const when = t => t ? String(t).replace('T', ' ').slice(0, 16) : '—'
export const RISK = { High: 'bg-red-100 text-red-700', Medium: 'bg-orange-100 text-orange-700', Low: 'bg-yellow-100 text-yellow-800', None: 'bg-slate-100 text-slate-600' }
export function toCsv(rows) {
  const cols = ['txn_id','user','account','ts','ip','value','units','category','address','risk','reasons']
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [cols.join(','), ...rows.map(r => cols.map(c => q(c === 'reasons' ? (r.reasons || []).map(x => x[0]).join('; ') : r[c])).join(','))].join('\n')
}

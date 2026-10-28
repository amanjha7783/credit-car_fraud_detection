import useApi from '../hooks/useApi'; import { api } from '../services/api'
import { Card, State, Badge } from '../components/UI'; import { usd, when } from '../utils/format'
export default function Alerts() {
  const { data, loading, error } = useApi(api.alerts)
  if (!data) return <State loading={loading} error={error} />
  return <div className="space-y-3">
    <p className="text-sm text-slate-600">Each alert is a signal that needs further verification. It does not mean fraud has been confirmed.</p>
    {!data.items.length && <p className="text-slate-500">No transactions were flagged with the current thresholds.</p>}
    {data.items.map(a => <Card key={a.txn_id}><div className="flex flex-wrap justify-between gap-2"><b>{a.txn_id} · {a.user} · {when(a.ts)}</b><span className="flex gap-2 items-center">{usd(a.value)} <Badge risk={a.risk} /></span></div>
      <p className="text-xs text-slate-500 mt-1">{a.units ?? '—'} units · {a.category} · {a.address} · IP {a.ip ?? 'missing'} · compared with {a.history_size} earlier normal transaction(s){a.history_size < 3 ? ' (limited history)' : ''}</p>
      <ul className="mt-2 text-sm list-disc pl-5">{a.reasons.map((r, i) => <li key={i}><b>{r[0]}:</b> {r[1]}</li>)}</ul>
      <p className="mt-2 text-sm text-blue-900"><b>Recommended next step:</b> {a.next_step}</p></Card>)}</div>
}

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import useApi from '../hooks/useApi'; import { api } from '../services/api'
import { Card, Stat, State } from '../components/UI'; import { usd } from '../utils/format'
export default function Customer() {
  const list = useApi(api.customers); const [id, setId] = useState('')
  const sel = id || list.data?.[0]
  const { data: c, loading, error } = useApi(() => sel ? api.customer(sel) : Promise.resolve(null), [sel])
  if (!list.data) return <State loading={list.loading} error={list.error} />
  const dot = ({ cx, cy, payload }) => cx == null || cy == null ? null : <circle cx={cx} cy={cy} r={5} fill={payload.risk === 'None' ? '#1e3a8a' : '#dc2626'} />
  return <div className="space-y-4">
    <select value={sel} onChange={e => setId(e.target.value)} className="border rounded px-2 py-1">{list.data.map(u => <option key={u}>{u}</option>)}</select>
    <State loading={loading} error={error} />
    {c && <><div className="grid grid-cols-2 md:grid-cols-5 gap-3"><Stat label="Transactions" value={c.n} /><Stat label="Total spend" value={usd(c.total)} /><Stat label="Average" value={usd(c.avg)} /><Stat label="Highest" value={usd(c.max)} /><Stat label="Flagged" value={c.flagged} warn /></div>
      {!c.enough_history && <p className="p-3 rounded bg-yellow-50 text-yellow-800 text-sm">Only {c.n} transactions: normal behaviour cannot be established reliably.</p>}
      <Card title="Transaction history (red = flagged)"><ResponsiveContainer width="100%" height={260}><LineChart data={c.series.map(s => ({ ...s, label: String(s.ts).slice(0, 10) }))}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="label" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Line dataKey="value" stroke="#94a3b8" dot={dot} connectNulls /></LineChart></ResponsiveContainer></Card>
      <Card title="Behaviour"><dl className="text-sm space-y-1"><div><b>Frequency:</b> {c.n} transactions over {c.span_days} days</div><div><b>Usual shipping address:</b> {c.usual_address ?? 'unknown'}</div>
        <div><b>IP addresses:</b> {Object.entries(c.ips).map(([k, v]) => `${k} (${v})`).join(', ') || 'none recorded'}</div><div><b>Categories:</b> {Object.entries(c.categories).map(([k, v]) => `${k} (${v})`).join(', ')}</div></dl></Card></>}
  </div>
}

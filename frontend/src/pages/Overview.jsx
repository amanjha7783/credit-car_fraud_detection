import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import useApi from '../hooks/useApi'; import { api } from '../services/api'
import { Card, Stat, State, Badge } from '../components/UI'; import { usd, when } from '../utils/format'
const Bars = ({ data, color = '#1e3a8a' }) => <ResponsiveContainer width="100%" height={220}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Bar dataKey="value" fill={color} radius={[3,3,0,0]} /></BarChart></ResponsiveContainer>
export default function Overview() {
  const { data: s, loading, error } = useApi(api.summary)
  if (!s) return <State loading={loading} error={error} />
  return <div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <Stat label="Transactions" value={s.total} /><Stat label="Total value" value={usd(s.total_value)} /><Stat label="Customers" value={s.customers} />
      <Stat label="Flagged" value={s.flagged} warn /><Stat label="% flagged" value={`${s.flagged_pct}%`} warn /><Stat label="High priority" value={s.high} warn /></div>
    <div className="grid lg:grid-cols-2 gap-4">
      <Card title="Transaction value by date"><ResponsiveContainer width="100%" height={220}><LineChart data={s.over_time}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Line dataKey="value" stroke="#1e3a8a" dot /></LineChart></ResponsiveContainer></Card>
      <Card title="Transaction count by customer"><Bars data={s.count_by_customer} /></Card>
      <Card title="Transaction value by customer"><Bars data={s.value_by_customer} /></Card>
      <Card title="Transactions by product category"><Bars data={s.by_category} /></Card>
      <Card title="Flagged transactions by detection reason"><Bars data={s.by_reason} color="#ea580c" /></Card>
      <Card title="Normal vs flagged"><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={s.normal_vs_flagged} dataKey="value" nameKey="name" label>{s.normal_vs_flagged.map((d, i) => <Cell key={i} fill={d.name === 'Flagged' ? '#ea580c' : '#1e3a8a'} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Card></div>
    <Card title="Recent suspicious activity"><ul className="divide-y text-sm">{s.recent.map(r => <li key={r.txn_id} className="py-2 flex justify-between gap-2"><span>{r.txn_id} · {r.user} · {when(r.ts)}</span><span className="flex gap-2">{usd(r.value)} <Badge risk={r.risk} /></span></li>)}{!s.recent.length && <li className="py-2 text-slate-500">No flagged transactions.</li>}</ul>
      <p className="text-xs text-slate-500 mt-3">Flags are signals for review, not confirmed fraud.</p></Card></div>
}

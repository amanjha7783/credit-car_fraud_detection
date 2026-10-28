import { useMemo, useState } from 'react'
import useApi from '../hooks/useApi'; import { api } from '../services/api'
import { Card, State, Badge } from '../components/UI'; import { usd, when, toCsv } from '../utils/format'
export default function Explorer() {
  const { data, loading, error } = useApi(api.transactions)
  const [f, setF] = useState({ user: '', risk: '', flagged: '', min: '', cat: '' }); const [sort, setSort] = useState(['ts', 1]); const [open, setOpen] = useState(null)
  const rows = useMemo(() => {
    if (!data) return []
    const r = data.items.filter(t => (!f.user || t.user.includes(f.user)) && (!f.risk || t.risk === f.risk) && (!f.cat || (t.category || '').toLowerCase().includes(f.cat.toLowerCase()))
      && (f.flagged === '' || String(t.flagged) === f.flagged) && (f.min === '' || (t.value ?? 0) >= +f.min))
    return r.sort((a, b) => ((a[sort[0]] ?? '') > (b[sort[0]] ?? '') ? 1 : -1) * sort[1])
  }, [data, f, sort])
  if (!data) return <State loading={loading} error={error} />
  const download = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv' })); a.download = 'filtered_transactions.csv'; a.click() }
  const H = ({ k, children }) => <th onClick={() => setSort([k, sort[0] === k ? -sort[1] : 1])} className="text-left p-2 cursor-pointer whitespace-nowrap">{children}{sort[0] === k ? (sort[1] > 0 ? ' ▲' : ' ▼') : ''}</th>
  const inp = 'border rounded px-2 py-1 text-sm'
  return <Card><div className="flex flex-wrap gap-2 mb-3">
    <input placeholder="Customer" className={inp} onChange={e => setF({ ...f, user: e.target.value })} />
    <input placeholder="Category" className={inp} onChange={e => setF({ ...f, cat: e.target.value })} />
    <input placeholder="Min amount" type="number" className={`${inp} w-28`} onChange={e => setF({ ...f, min: e.target.value })} />
    <select className={inp} onChange={e => setF({ ...f, risk: e.target.value })}><option value="">All risk</option>{['High', 'Medium', 'Low', 'None'].map(r => <option key={r}>{r}</option>)}</select>
    <select className={inp} onChange={e => setF({ ...f, flagged: e.target.value })}><option value="">Flagged or not</option><option value="true">Flagged</option><option value="false">Not flagged</option></select>
    <button onClick={download} className="ml-auto bg-blue-900 text-white text-sm px-3 rounded">Download CSV ({rows.length})</button></div>
    {!rows.length ? <p className="text-slate-500 text-sm">No transactions match these filters.</p> :
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-100"><tr><H k="ts">Date/time</H><H k="user">Customer</H><th className="p-2 text-left">Account</th><th className="p-2 text-left">IP</th><H k="value">Value</H><H k="category">Category</H><H k="units">Units</H><th className="p-2 text-left">Shipping</th><H k="risk">Risk</H></tr></thead>
      <tbody>{rows.flatMap(t => [<tr key={t.txn_id} onClick={() => setOpen(open === t.txn_id ? null : t.txn_id)} className="border-t hover:bg-slate-50 cursor-pointer">
        <td className="p-2 whitespace-nowrap">{when(t.ts)}</td><td className="p-2">{t.user}</td><td className="p-2">{t.account}</td><td className="p-2">{t.ip ?? '—'}</td><td className="p-2">{usd(t.value)}</td><td className="p-2">{t.category}</td><td className="p-2">{t.units ?? '—'}</td><td className="p-2">{t.address}</td><td className="p-2"><Badge risk={t.risk} /></td></tr>,
        open === t.txn_id && <tr key={t.txn_id + 'd'} className="bg-slate-50"><td colSpan={9} className="p-3 text-xs space-y-1">{t.reasons.length ? t.reasons.map((r, i) => <div key={i}><b>{r[0]}:</b> {r[1]}</div>) : 'No rules triggered.'}{t.next_step && <div className="text-blue-900"><b>Next step:</b> {t.next_step}</div>}<div className="text-slate-500">History used: {t.history_size} earlier normal transactions.</div></td></tr>])}</tbody></table></div>}
  </Card>
}

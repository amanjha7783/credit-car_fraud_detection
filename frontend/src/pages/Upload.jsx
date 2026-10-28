import { useState } from 'react'
import { api } from '../services/api'; import { Card, State } from '../components/UI'
const DEF = { value_multiplier: 5, rapid_minutes: 10, bulk_multiplier: 3, bulk_min_units: 5, min_history: 1 }
export default function Upload() {
  const [res, setRes] = useState(null); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false)
  const [cfg, setCfg] = useState(DEF); const [msg, setMsg] = useState('')
  const send = async f => { if (!f) return; setBusy(true); setErr(null); setMsg('')
    try { setRes(await api.upload(f)) } catch (e) { setErr(e.message); setRes(null) } setBusy(false) }
  const rerun = async () => { try { const r = await api.analyze(cfg); setMsg(`Re-analysed with new thresholds: ${r.flagged} transactions flagged.`) } catch (e) { setErr(e.message) } }
  const q = res?.report?.issues
  return <div className="space-y-4">
    <Card title="Upload transactions (CSV, max 5 MB)">
      <input type="file" accept=".csv" onChange={e => send(e.target.files[0])} className="text-sm" />
      <a href="/api/sample" className="ml-4 text-sm text-blue-800 underline">Download sample CSV</a>
      <p className="text-xs text-slate-500 mt-2">Required columns: IP Address, User ID, Account Number, Age, Shipping Address, Transaction Date, Transaction Time, Transaction Value, Product Category, Units Purchased. The original file is kept; a cleaned copy is saved separately.</p>
      {busy && <State loading />}{err && <State error={err} />}</Card>
    <Card title="Detection thresholds"><div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
      {Object.keys(DEF).map(k => <label key={k} className="block"><span className="text-xs text-slate-500">{k}</span><input type="number" step="any" value={cfg[k]} onChange={e => setCfg({ ...cfg, [k]: +e.target.value })} className="w-full border rounded px-2 py-1" /></label>)}</div>
      <button onClick={rerun} className="mt-3 bg-blue-900 text-white text-sm px-3 py-1.5 rounded">Re-run analysis</button> <span className="text-sm text-green-700 ml-2">{msg}</span></Card>
    {res && <><Card title="Processing summary"><p className="text-sm">Uploaded {res.report.rows_uploaded} · cleaned {res.report.rows_clean} · rejected {res.report.rows_rejected} · duplicates removed {res.report.duplicates_removed}</p>
      {res.report.rejected.map((r, i) => <p key={i} className="text-sm text-red-700">Row {r.row}: {r.reason}</p>)}</Card>
      <Card title="Data quality findings"><ul className="grid sm:grid-cols-2 gap-x-6 text-sm">{Object.entries(q).map(([k, v]) => <li key={k} className="flex justify-between border-b py-1"><span>{k.replace(/_/g, ' ')}</span><b className={v ? 'text-orange-600' : ''}>{v}</b></li>)}</ul>
        {res.report.notes.map((n, i) => <p key={i} className="text-xs text-slate-500 mt-2">{n}</p>)}</Card>
      <Card title="Preview (first 10 rows)"><div className="overflow-x-auto"><table className="text-xs w-full"><thead><tr>{res.columns.map(c => <th key={c} className="text-left p-1 whitespace-nowrap">{c}</th>)}</tr></thead>
        <tbody>{res.preview.map((r, i) => <tr key={i} className="border-t">{res.columns.map(c => <td key={c} className="p-1 whitespace-nowrap">{r[c] ?? <i className="text-slate-400">empty</i>}</td>)}</tr>)}</tbody></table></div></Card></>}
  </div>
}

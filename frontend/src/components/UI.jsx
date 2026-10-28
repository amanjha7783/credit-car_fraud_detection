import { RISK } from '../utils/format'
export const Card = ({ title, children }) => <section className="bg-white border border-slate-200 rounded-lg p-4">{title && <h3 className="text-sm font-semibold text-slate-600 mb-3">{title}</h3>}{children}</section>
export const Stat = ({ label, value, warn }) => <div className="bg-white border border-slate-200 rounded-lg p-4"><div className="text-xs text-slate-500">{label}</div><div className={`text-2xl font-semibold ${warn ? 'text-orange-600' : 'text-blue-900'}`}>{value}</div></div>
export const Badge = ({ risk }) => <span className={`px-2 py-0.5 rounded text-xs font-medium ${RISK[risk]}`}>{risk}</span>
export const State = ({ loading, error }) => loading ? <p className="text-slate-500 animate-pulse">Loading…</p> : error ? <p className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</p> : null

import { useState } from 'react'
import { LayoutDashboard, Upload as Up, Table2, ShieldAlert, User } from 'lucide-react'
import Overview from './pages/Overview'; import Upload from './pages/Upload'; import Explorer from './pages/Explorer'; import Alerts from './pages/Alerts'; import Customer from './pages/Customer'
const NAV = [['Overview', LayoutDashboard, Overview], ['Upload & Quality', Up, Upload], ['Explorer', Table2, Explorer], ['Alerts', ShieldAlert, Alerts], ['Customer', User, Customer]]
export default function App() {
  const [i, setI] = useState(0); const Page = NAV[i][2]
  return <div className="min-h-screen md:flex">
    <nav className="md:w-56 bg-blue-950 text-white p-3 flex md:block gap-1 overflow-x-auto"><div className="hidden md:block font-semibold px-2 py-3">Fraud Review</div>
      {NAV.map(([n, Icon], k) => <button key={n} onClick={() => setI(k)} className={`flex items-center gap-2 px-3 py-2 rounded text-sm whitespace-nowrap md:w-full ${k === i ? 'bg-blue-800' : 'hover:bg-blue-900'}`}><Icon size={16} />{n}</button>)}</nav>
    <main className="flex-1 p-4 md:p-6"><h1 className="text-xl font-semibold text-blue-950 mb-4">{NAV[i][0]}</h1><Page key={i} /></main></div>
}

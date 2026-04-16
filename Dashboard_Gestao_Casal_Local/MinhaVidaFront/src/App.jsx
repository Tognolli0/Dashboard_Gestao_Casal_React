import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { Heart, LayoutDashboard, PieChart, User } from 'lucide-react'
import { QueryClientProvider } from '@tanstack/react-query'
import { getDashboardResumo, warmUpAPI } from './services/api'
import { queryClient, DASHBOARD_QUERY_KEY } from './lib/queryClient'
import { SkeletonDashboard } from './components/ui'

const Home = lazy(() => import('./pages/Home'))
const MeuEspaco = lazy(() => import('./pages/MeuEspacoPage'))
const EspacoDela = lazy(() => import('./pages/EspacoDelaPage'))
const Categorias = lazy(() => import('./pages/Categorias'))

function AppShell() {
  useEffect(() => {
    warmUpAPI()

    queryClient.prefetchQuery({
      queryKey: DASHBOARD_QUERY_KEY,
      queryFn: getDashboardResumo,
    })
  }, [])

  const menuItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/meu-espaco', label: 'Meu Espaco', icon: User },
    { to: '/espaco-dela', label: 'Espaco Dela', icon: Heart },
    { to: '/categorias', label: 'Categorias', icon: PieChart },
  ]

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900 md:flex-row">
        <aside className="sticky top-0 z-20 flex w-full flex-col border-b border-white/5 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_30%),linear-gradient(180deg,#020617_0%,#111827_100%)] p-5 md:h-screen md:w-64 md:border-b-0 md:border-r">
          <div className="mb-8 flex flex-col items-center space-y-4">
            <div className="relative">
              <img
                src="/img/eu&ela.png"
                alt="Diogo e Bia"
                className="h-24 w-24 rounded-3xl border-2 border-white/15 object-cover shadow-xl shadow-black/30"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-pink-500 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white shadow">
                Diogo & Bia
              </span>
            </div>
            <div className="text-center">
              <h1 className="text-lg font-black italic tracking-tighter text-white">
                Nossa <span className="text-indigo-400">Vida</span>
              </h1>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                Gestao Financeira
              </p>
            </div>
          </div>

          <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Modo local</p>
            <p className="mt-1 text-xs font-black text-white">Rápido e sempre disponível</p>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest transition-all ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-lg'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/5 pt-4 text-center">
            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600">D & B • 2026</p>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 xl:p-10">
            <Suspense fallback={<SkeletonDashboard />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/meu-espaco" element={<MeuEspaco />} />
                <Route path="/espaco-dela" element={<EspacoDela />} />
                <Route path="/categorias" element={<Categorias />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  )
}

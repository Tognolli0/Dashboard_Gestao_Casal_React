import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { Heart, LayoutDashboard, PieChart, User } from 'lucide-react'
import { QueryClientProvider } from '@tanstack/react-query'
import { getDashboardResumo, warmUpAPI } from './services/api'
import { queryClient, DASHBOARD_QUERY_KEY } from './lib/queryClient'
import { SkeletonDashboard } from './components/ui'

const Home = lazy(() => import('./pages/Home'))
const MeuEspaco = lazy(() => import('./pages/MeuEspaco'))
const EspacoDela = lazy(() => import('./pages/EspacoDela'))
const Categorias = lazy(() => import('./pages/Categorias'))

function Inicial({ nome }) {
  return (
    <div className="relative">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white/20 bg-indigo-700 text-sm font-black text-white shadow-md">
        {nome[0].toUpperCase()}
      </div>
      <span className="absolute -bottom-1 -right-1 rounded bg-indigo-500 px-1 py-0.5 text-[7px] font-black uppercase text-white shadow">
        {nome}
      </span>
    </div>
  )
}

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
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 md:flex-row">
        <aside className="sticky top-0 z-20 flex w-full flex-col border-b border-white/5 bg-slate-950 p-6 md:h-screen md:w-64 md:border-b-0 md:border-r">
          <div className="mb-10 flex flex-col items-center space-y-4">
            <div className="flex -space-x-2">
              <Inicial nome="Diogo" />
              <Inicial nome="Bia" />
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

          <nav className="flex-1 space-y-1.5">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
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
          <div className="p-4 md:p-10">
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


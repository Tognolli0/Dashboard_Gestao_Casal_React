import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  User,
  Heart,
  PieChart,
  TrendingUp,
  Menu,
  X
} from 'lucide-react'

// Foto do casal (Coloque uma foto em public/img/casal.jpg)
const FOTO_CASAL = '/img/casal.jpg'

const NAV_LINKS = [
  { to: '/',            label: 'Visão Geral',    icon: LayoutDashboard },
  { to: '/meu-espaco',  label: 'Meu Espaço',     icon: User },
  { to: '/espaco-dela', label: 'Espaço Dela',    icon: Heart },
  { to: '/categorias',  label: 'Categorias',     icon: PieChart },
  { to: '/evolucao',    label: 'Evolução',        icon: TrendingUp },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-100 w-64 p-6 shadow-sm">
      {/* Perfil do Casal - Estilo Clean */}
      <div className="flex flex-col items-center mb-10 space-y-3">
        <div className="relative group">
          <img 
            src={FOTO_CASAL} 
            alt="Casal" 
            className="w-20 h-20 rounded-3xl object-cover shadow-xl border-4 border-slate-50 transition-transform group-hover:scale-105"
            onError={(e) => { (e.target as any).src = 'https://ui-avatars.com/api/?name=D+B&background=3b82f6&color=fff' }}
          />
          <div className="absolute -bottom-2 -right-2 bg-primary text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
            D & B
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-lg font-black text-slate-900 tracking-tighter italic">Nossa <span className="text-primary">Vida</span></h1>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Gestão Consolidada</p>
        </div>
      </div>

      {/* Menu de Navegação */}
      <nav className="flex-1 space-y-1">
        <p className="text-[10px] font-black uppercase text-slate-300 ml-4 mb-4 tracking-widest">Menu Principal</p>
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-tight transition-all
              ${isActive 
                ? 'bg-primary/10 text-primary border border-primary/10 shadow-sm' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }
            `}
          >
            <link.icon size={18} />
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Rodapé da Sidebar */}
      <div className="mt-auto pt-6 border-t border-slate-50">
        <p className="text-[8px] font-bold text-slate-300 uppercase text-center tracking-widest italic">Diogo & Beatriz • 2026</p>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar para Desktop */}
      <aside className="hidden md:flex fixed inset-y-0 z-20">
        <SidebarContent />
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 md:ml-64 min-w-0 p-4 md:p-8">
        {/* Header Mobile */}
        <div className="md:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <button onClick={() => setIsMobileOpen(true)} className="text-slate-900"><Menu size={24} /></button>
          <span className="font-black italic text-primary uppercase text-sm tracking-tighter">Nossa Vida</span>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-primary">DB</div>
        </div>

        {/* Aqui renderiza as páginas (Home, MeuEspaco, etc) */}
        {children}
      </main>

      {/* Menu Mobile (Gaveta) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </div>
        </div>
      )}
    </div>
  )
}
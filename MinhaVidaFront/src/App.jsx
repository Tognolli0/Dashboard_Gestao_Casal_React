import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, User, Heart, PieChart } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { warmUpAPI } from './services/api';

import Home from './pages/Home';
import MeuEspaco from './pages/MeuEspaco';
import EspacoDela from './pages/EspacoDela';
import Categorias from './pages/Categorias';

// ── React Query — cache global ────────────────────────────────────────────────
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,   // 5min
            gcTime: 1000 * 60 * 30,  // 30min
            retry: 2,
            retryDelay: i => Math.min(2000 * (i + 1), 10000),
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
    },
});

// Acorda o Render imediatamente ao carregar o app
warmUpAPI();

// ── Componentes ───────────────────────────────────────────────────────────────
const Inicial = ({ nome }: { nome: string }) => (
    <div className="relative">
        <div className="w-11 h-11 rounded-xl border-2 border-white/20 bg-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-md">
            {nome[0].toUpperCase()}
        </div>
        <span className="absolute -bottom-1 -right-1 bg-indigo-500 text-white text-[7px] px-1 py-0.5 rounded font-black uppercase shadow">
            {nome}
        </span>
    </div>
)

function App() {
    const menuItems = [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/meu-espaco', label: 'Meu Espaço', icon: User },
        { to: '/espaco-dela', label: 'Espaço Dela', icon: Heart },
        { to: '/categorias', label: 'Categorias', icon: PieChart },
    ];

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row text-slate-900">

                    {/* SIDEBAR */}
                    <aside className="w-full md:w-64 bg-[#0f172a] border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col md:h-screen md:sticky top-0 z-20">

                        <div className="flex flex-col items-center mb-10 space-y-4">
                            <div className="flex -space-x-2">
                                <Inicial nome="Diogo" />
                                <Inicial nome="Bia" />
                            </div>
                            <div className="text-center">
                                <h1 className="text-lg font-black text-white italic tracking-tighter">
                                    Nossa <span className="text-indigo-400">Vida</span>
                                </h1>
                                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">
                                    Gestão Financeira
                                </p>
                            </div>
                        </div>

                        <nav className="space-y-1.5 flex-1">
                            {menuItems.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    // "end" garante que "/" só fica ativo na rota exata
                                    end={item.to === '/'}
                                    className={({ isActive }) =>
                                        `w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${isActive
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

                        <div className="mt-auto pt-4 border-t border-white/5 text-center">
                            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">D & B • 2026</p>
                        </div>
                    </aside>

                    {/* CONTEÚDO */}
                    <main className="flex-1 overflow-y-auto">
                        <div className="p-4 md:p-10">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/meu-espaco" element={<MeuEspaco />} />
                                <Route path="/espaco-dela" element={<EspacoDela />} />
                                <Route path="/categorias" element={<Categorias />} />
                            </Routes>
                        </div>
                    </main>

                </div>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
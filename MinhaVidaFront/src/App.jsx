import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, User, Heart, PieChart } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { warmUpAPI } from './services/api';

// Páginas
import Home from './pages/Home';
import MeuEspaco from './pages/MeuEspaco';
import EspacoDela from './pages/EspacoDela';
import Categorias from './pages/Categorias';

// ── REACT QUERY: configuração global ────────────────────────────────────────
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // 5min de cache — evita re-fetches desnecessários ao trocar de página
            staleTime: 1000 * 60 * 5,
            // 30min no cache após a query ser desmontada
            gcTime: 1000 * 60 * 30,
            // Render pode precisar de 2 tentativas (cold start)
            retry: 2,
            retryDelay: attemptIndex => Math.min(2000 * (attemptIndex + 1), 10000),
            // Não refaz fetch ao voltar para a aba — evita loading desnecessário
            refetchOnWindowFocus: false,
            // Não refaz ao reconectar (evita spam de requests)
            refetchOnReconnect: false,
        },
    },
});

// ── PRÉ-CARREGAMENTO: acorda o Render antes do usuário clicar ────────────────
// Assim que o JS carrega, já faz o warm-up. Quando o usuário clicar em algo,
// o servidor já está acordado.
warmUpAPI();

// ── COMPONENTES ──────────────────────────────────────────────────────────────
const FotoPerfil = ({ nome }) => (
    <div className="relative group">
        <div className="w-12 h-12 rounded-2xl border-2 border-white/20 shadow-lg bg-indigo-700 flex items-center justify-center text-white font-black text-sm">
            {nome[0]}
        </div>
        <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[7px] px-1.5 py-0.5 rounded-md font-black uppercase shadow-lg">
            {nome}
        </span>
    </div>
);

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
                            <div className="flex -space-x-3">
                                <FotoPerfil nome="Diogo" />
                                <FotoPerfil nome="Bia" />
                            </div>
                            <div className="text-center">
                                <h1 className="text-lg font-black text-white italic tracking-tighter">
                                    Nossa <span className="text-indigo-400">Vida</span>
                                </h1>
                                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Gestão Financeira</p>
                            </div>
                        </div>

                        <nav className="space-y-1.5 flex-1">
                            {menuItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/'}
                                    className={({ isActive }) => `
                    w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3
                    ${isActive
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                        }
                  `}
                                >
                                    <item.icon size={16} />
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>

                        <div className="mt-auto pt-4 border-t border-white/5 text-center">
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">D & B • 2026</p>
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
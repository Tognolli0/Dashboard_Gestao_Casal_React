import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Heart, 
  PieChart
} from 'lucide-react';

// Importação das páginas
import Home from './pages/Home';
import MeuEspaco from './pages/MeuEspaco';
import EspacoDela from './pages/EspacoDela';
import Categorias from './pages/Categorias';

const FotoPerfil = ({ url, nome }) => (
  <div className="relative group">
    <img 
      src={url} 
      alt={nome} 
      // Ajustado para garantir que a borda e o tamanho apareçam corretamente
      className="w-14 h-14 rounded-2xl border-2 border-white/20 shadow-lg group-hover:border-indigo-400 transition-all object-cover bg-slate-800"
      onError={(e) => { 
        // Se a imagem falhar, ele gera um avatar colorido
        e.target.src = `https://ui-avatars.com/api/?name=${nome}&background=6366f1&color=fff&bold=true`; 
      }}
    />
    <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[7px] px-1.5 py-0.5 rounded-md font-black uppercase shadow-lg">
      {nome}
    </span>
  </div>
);

function App() {
  const menuItems = [
    { to: '/',            label: 'Dashboard',    icon: LayoutDashboard },
    { to: '/meu-espaco',  label: 'Meu Espaço',     icon: User },
    { to: '/espaco-dela', label: 'Espaço Dela',    icon: Heart },
    { to: '/categorias',  label: 'Categorias',     icon: PieChart },
  ];

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row text-slate-900">
        
        {/* SIDEBAR - VOLTANDO AO TEMA ESCURO/AZULADO */}
        <aside className="w-full md:w-64 bg-[#0f172a] border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col md:h-screen sticky top-0 z-20">
          
          {/* Perfil do Casal */}
          <div className="flex flex-col items-center mb-10 space-y-4">
            <div className="flex -space-x-3">
              <FotoPerfil url="/img/eu&ela.png" nome="Diogo" />
              <FotoPerfil url="/img/eu&ela.png" nome="Beatriz" />
            </div>
            <div className="text-center">
              <h1 className="text-lg font-black text-white italic tracking-tighter">
                Nossa <span className="text-indigo-400">Vida</span>
              </h1>
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Gestão Financeira</p>
            </div>
          </div>

          {/* Menu de Navegação */}
          <nav className="space-y-1.5 flex-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
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

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto">
          {/* HEADER SUPERIOR (DASHBOARD CASAL) - COM COR AGORA */}
          <div className="bg-[#0f172a] md:bg-transparent p-4 md:p-0">
             {/* Este bloco aparece colorido no mobile e limpo no desktop, 
                 ajustando conforme o estilo da Home.tsx */}
          </div>

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
  );
}

export default App;
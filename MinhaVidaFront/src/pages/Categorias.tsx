import { useState, useEffect } from 'react'
import { 
  PieChart, BarChart, TrendingUp, Search, 
  Users, ArrowUpCircle, ArrowDownCircle,
  Calendar, Briefcase, Home as HomeIcon
} from 'lucide-react'
import { getDashboardResumo } from '../services/api'
import { Card, Badge, Spinner, fmt } from '../components/ui'
import type { DashboardResumo, Transacao } from '../types/models'

export default function Categorias() {
  const [resumo, setResumo] = useState<DashboardResumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1)
  const [pessoaSelecionada, setPessoaSelecionada] = useState<'Todos' | 'Eu' | 'Namorada'>('Todos')
  const [filtroTexto, setFiltroTexto] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setLoading(true)
    try {
      const res = await getDashboardResumo()
      setResumo(res)
    } catch (err) {
      console.error("Erro ao carregar categorias:", err)
    } finally {
      setLoading(false)
    }
  }

  // --- Lógica de Filtros ---
  const todasTransacoes = [...(resumo?.transacoesEu || []), ...(resumo?.transacoesDela || [])]
  
  const transacoesMes = todasTransacoes.filter(t => {
    const data = new Date(t.data)
    const mesBate = (data.getMonth() + 1) === mesSelecionado
    const pessoaBate = pessoaSelecionada === 'Todos' || t.responsavel === (pessoaSelecionada === 'Eu' ? 'Eu' : 'Namorada')
    return mesBate && pessoaBate
  })

  const transacoesFiltradas = transacoesMes.filter(t => 
    t.descricao.toLowerCase().includes(filtroTexto.toLowerCase()) ||
    t.categoria.toLowerCase().includes(filtroTexto.toLowerCase())
  ).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  // --- KPIs ---
  const totalSaidas = transacoesMes.filter(t => t.tipo === 'Saída').reduce((acc, t) => acc + Math.abs(t.valor), 0)
  const totalEntradas = transacoesMes.filter(t => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0)
  const saldoLiquido = totalEntradas - totalSaidas

  const gastosPessoais = transacoesMes.filter(t => t.tipo === 'Saída' && t.ehPessoal).reduce((acc, t) => acc + Math.abs(t.valor), 0)
  const gastosBusiness = transacoesMes.filter(t => t.tipo === 'Saída' && !t.ehPessoal).reduce((acc, t) => acc + Math.abs(t.valor), 0)

  // --- Agrupamento por Categoria ---
  const resumoCategorias = Array.from(
    transacoesMes.filter(t => t.tipo === 'Saída')
      .reduce((acc, t) => {
        const curr = acc.get(t.categoria) || { total: 0, qtd: 0 }
        acc.set(t.categoria, { total: curr.total + Math.abs(t.valor), qtd: curr.qtd + 1 })
        return acc
      }, new Map<string, { total: number, qtd: number }>())
  ).map(([nome, dados]) => ({ nome, ...dados }))
   .sort((a, b) => b.total - a.total)

  const top5Gastos = transacoesMes
    .filter(t => t.tipo === 'Saída')
    .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor))
    .slice(0, 5)

  if (loading) return <Spinner />

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up pb-10 tracking-tight">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">
            Categorias <span className="text-primary font-black">Análise</span>
          </h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest italic">Mapeamento Inteligente de Gastos</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit shadow-inner gap-2">
          <select 
            value={mesSelecionado} 
            onChange={(e) => setMesSelecionado(Number(e.target.value))}
            className="bg-white border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase shadow-sm focus:ring-2 ring-primary/20 cursor-pointer"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' }).toUpperCase()}
              </option>
            ))}
          </select>

          <select 
            value={pessoaSelecionada} 
            onChange={(e) => setPessoaSelecionada(e.target.value as any)}
            className="bg-white border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase shadow-sm focus:ring-2 ring-primary/20 cursor-pointer"
          >
            <option value="Todos">👫 AMBOS</option>
            <option value="Eu">👤 DIOGO</option>
            <option value="Namorada">💖 BIA</option>
          </select>
        </div>
      </header>

      {/* CARDS DE KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 border-l-4 border-l-rose-500 rounded-2xl p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase text-rose-500 mb-1 tracking-widest">Saídas do Mês</p>
          <p className="text-3xl font-black text-slate-950 tracking-tighter italic">{fmt(totalSaidas)}</p>
        </div>
        <div className="bg-white border border-slate-200 border-l-4 border-l-emerald-500 rounded-2xl p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase text-emerald-500 mb-1 tracking-widest">Entradas do Mês</p>
          <p className="text-3xl font-black text-slate-950 tracking-tighter italic">{fmt(totalEntradas)}</p>
        </div>
        <div className={`bg-white border border-slate-200 border-l-4 rounded-2xl p-6 shadow-sm ${saldoLiquido >= 0 ? 'border-l-indigo-500' : 'border-l-amber-500'}`}>
          <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Saldo Líquido</p>
          <p className={`text-3xl font-black tracking-tighter italic ${saldoLiquido >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
            {fmt(saldoLiquido)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* GRÁFICO DE CATEGORIAS */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-[24px] p-8 shadow-xl">
          <h3 className="text-lg font-black text-slate-900 uppercase italic flex items-center gap-3 mb-8">
            <BarChart className="text-primary" /> Gastos por Categoria
          </h3>
          <div className="space-y-6">
            {resumoCategorias.map((item) => {
              const porcentagem = totalSaidas > 0 ? (item.total / totalSaidas) * 100 : 0;
              const cor = getCor(item.nome);
              return (
                <div key={item.nome} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl" style={{ backgroundColor: `${cor}15` }}>
                        <PieChart size={16} style={{ color: cor }} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase">{item.nome}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{item.qtd} lançamentos</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-slate-900 italic">{fmt(item.total)}</p>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 shadow-sm"
                      style={{ width: `${porcentagem}%`, backgroundColor: cor }}
                    />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 text-right mt-1 uppercase">
                    {porcentagem.toFixed(1)}% da fatia
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* TOP 5 E DISTRIBUIÇÃO */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white border border-slate-200 rounded-[24px] p-8 shadow-xl">
            <h3 className="text-sm font-black text-rose-500 uppercase italic flex items-center gap-3 mb-6">
              <TrendingUp /> Top 5 Críticos
            </h3>
            <div className="space-y-5">
              {top5Gastos.map((t, i) => (
                <div key={t.id} className="flex items-center gap-4">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-[10px] rotate-[-10deg] shadow-lg"
                    style={{ backgroundColor: getCorRanking(i + 1) }}
                  >
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900 uppercase truncate leading-tight">{t.descricao}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase italic">{t.categoria}</p>
                  </div>
                  <p className="text-sm font-black text-rose-600 italic">{fmt(Math.abs(t.valor))}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[24px] p-8 shadow-xl">
            <h3 className="text-sm font-black text-slate-900 uppercase italic flex items-center gap-3 mb-6">
              <Briefcase className="text-indigo-500" /> Fluxo de Saída
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-center">
                <HomeIcon size={16} className="text-indigo-600 mx-auto mb-2" />
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Pessoal</p>
                <p className="text-xl font-black text-indigo-950 my-1">{fmt(gastosPessoais)}</p>
              </div>
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-center">
                <Briefcase size={16} className="text-emerald-600 mx-auto mb-2" />
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Business</p>
                <p className="text-xl font-black text-emerald-950 my-1">{fmt(gastosBusiness)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white border border-slate-200 rounded-[24px] p-8 shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h3 className="text-lg font-black text-slate-900 uppercase italic flex items-center gap-3">
            <Calendar className="text-indigo-500" /> Lançamentos
          </h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="BUSCAR..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2 text-[10px] font-black uppercase shadow-inner"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="pb-4 px-4">Data</th>
                <th className="pb-4 px-4">Descrição</th>
                <th className="pb-4 px-4">Categoria</th>
                <th className="pb-4 px-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transacoesFiltradas.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 text-[11px] font-bold text-slate-500">
                    {new Date(t.data).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-4 px-4 text-xs font-black text-slate-900 uppercase">
                    {t.descricao}
                  </td>
                  <td className="py-4 px-4">
                    <Badge label={t.categoria} color={getBadgeColor(t.categoria)} />
                  </td>
                  <td className={`py-4 px-4 text-right text-xs font-black italic ${t.tipo === 'Entrada' ? 'text-emerald-600' : 'text-slate-950'}`}>
                    {t.tipo === 'Saída' ? `- ${fmt(Math.abs(t.valor))}` : fmt(t.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// --- Helpers Visuais ---
function getCor(cat: string) {
  const cores: Record<string, string> = {
    "Alimentação": "#e65100", "Transporte": "#1565c0", "Moradia": "#2e7d32",
    "Saúde": "#c62828", "Educação": "#6a1b9a", "Lazer": "#f57f17",
    "Vestuário": "#ad1457", "Investimento": "#00695c"
  }
  return cores[cat] || "#455a64"
}

function getBadgeColor(cat: string): any {
  const cores: Record<string, string> = {
    "Alimentação": "amber", "Transporte": "indigo", "Moradia": "green",
    "Saúde": "red", "Educação": "gray", "Lazer": "pink"
  }
  return cores[cat] || "gray"
}

function getCorRanking(pos: number) {
  return ["#f44336", "#ff7043", "#ffa726", "#78909c", "#b0bec5"][pos-1] || "#b0bec5"
}
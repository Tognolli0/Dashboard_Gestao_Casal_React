import { useState } from 'react'
import { BarChart, Briefcase, Calendar, Home as HomeIcon, PieChart, Search, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getCachedTransacoesGeraisPorPeriodo, getTransacoesGeraisPorPeriodo } from '../services/api'
import { sortTransactionsByDateDesc } from '../lib/dashboard'
import { Badge, Spinner, fmt } from '../components/ui'
import type { Transacao } from '../types/models'

export default function Categorias() {
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1)
  const [pessoaSelecionada, setPessoaSelecionada] = useState<'Todos' | 'Eu' | 'Namorada'>('Todos')
  const [filtroTexto, setFiltroTexto] = useState('')
  const anoAtual = new Date().getFullYear()

  const { data: transacoesMes = [], isLoading, isFetching } = useQuery<Transacao[]>({
    queryKey: ['categorias-transacoes', anoAtual, mesSelecionado, pessoaSelecionada],
    queryFn: () => getTransacoesGeraisPorPeriodo(mesSelecionado, anoAtual, pessoaSelecionada),
    initialData: () => getCachedTransacoesGeraisPorPeriodo(mesSelecionado, anoAtual, pessoaSelecionada)?.data,
    initialDataUpdatedAt: () => getCachedTransacoesGeraisPorPeriodo(mesSelecionado, anoAtual, pessoaSelecionada)?.savedAt,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  const termoBusca = filtroTexto.trim().toLowerCase()
  const transacoesFiltradas = sortTransactionsByDateDesc(
    transacoesMes.filter((transaction) =>
      transaction.descricao.toLowerCase().includes(termoBusca) ||
      transaction.categoria.toLowerCase().includes(termoBusca),
    ),
  )

  const totalSaidas = transacoesMes.filter((transaction) => transaction.tipo === 'Saída').reduce((acc, transaction) => acc + Math.abs(transaction.valor), 0)
  const totalEntradas = transacoesMes.filter((transaction) => transaction.tipo === 'Entrada').reduce((acc, transaction) => acc + transaction.valor, 0)
  const saldoLiquido = totalEntradas - totalSaidas

  const gastosPessoais = transacoesMes.filter((transaction) => transaction.tipo === 'Saída' && transaction.ehPessoal).reduce((acc, transaction) => acc + Math.abs(transaction.valor), 0)
  const gastosBusiness = transacoesMes.filter((transaction) => transaction.tipo === 'Saída' && !transaction.ehPessoal).reduce((acc, transaction) => acc + Math.abs(transaction.valor), 0)

  const resumoCategorias = Array.from(
    transacoesMes
      .filter((transaction) => transaction.tipo === 'Saída')
      .reduce((acc, transaction) => {
        const atual = acc.get(transaction.categoria) || { total: 0, qtd: 0 }
        acc.set(transaction.categoria, { total: atual.total + Math.abs(transaction.valor), qtd: atual.qtd + 1 })
        return acc
      }, new Map<string, { total: number; qtd: number }>()),
  )
    .map(([nome, dados]) => ({ nome, ...dados }))
    .sort((a, b) => b.total - a.total)

  const top5Gastos = transacoesMes
    .filter((transaction) => transaction.tipo === 'Saída')
    .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor))
    .slice(0, 5)

  if (isLoading && transacoesMes.length === 0) return <Spinner />

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10 tracking-tight animate-fade-up">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
            Categorias <span className="font-black text-indigo-600">Analise</span>
          </h2>
          <p className="text-[10px] font-bold uppercase italic tracking-widest text-slate-500">Mapeamento Inteligente de Gastos</p>
          {isFetching && (
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Atualizando dados...
            </p>
          )}
        </div>

        <div className="flex w-fit gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1.5 shadow-inner">
          <select
            value={mesSelecionado}
            onChange={(event) => setMesSelecionado(Number(event.target.value))}
            className="cursor-pointer rounded-xl border-none bg-white px-4 py-2 text-[10px] font-black uppercase shadow-sm"
          >
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {new Date(2000, index, 1).toLocaleString('pt-BR', { month: 'long' }).toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={pessoaSelecionada}
            onChange={(event) => setPessoaSelecionada(event.target.value as 'Todos' | 'Eu' | 'Namorada')}
            className="cursor-pointer rounded-xl border-none bg-white px-4 py-2 text-[10px] font-black uppercase shadow-sm"
          >
            <option value="Todos">AMBOS</option>
            <option value="Eu">DIOGO</option>
            <option value="Namorada">BIA</option>
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 border-l-4 border-l-rose-500 bg-white p-6 shadow-sm">
          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-rose-500">Saidas do Mes</p>
          <p className="text-3xl font-black italic tracking-tighter text-slate-950">{fmt(totalSaidas)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-6 shadow-sm">
          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-emerald-500">Entradas do Mes</p>
          <p className="text-3xl font-black italic tracking-tighter text-slate-950">{fmt(totalEntradas)}</p>
        </div>
        <div className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-6 shadow-sm ${saldoLiquido >= 0 ? 'border-l-indigo-500' : 'border-l-amber-500'}`}>
          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Saldo Liquido</p>
          <p className={`text-3xl font-black italic tracking-tighter ${saldoLiquido >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
            {fmt(saldoLiquido)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-xl lg:col-span-7">
          <h3 className="mb-8 flex items-center gap-3 text-lg font-black uppercase italic text-slate-900">
            <BarChart className="text-indigo-600" /> Gastos por Categoria
          </h3>
          <div className="space-y-6">
            {resumoCategorias.map((item) => {
              const porcentagem = totalSaidas > 0 ? (item.total / totalSaidas) * 100 : 0
              const cor = getCor(item.nome)
              return (
                <div key={item.nome} className="group">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl p-2" style={{ backgroundColor: `${cor}15` }}>
                        <PieChart size={16} style={{ color: cor }} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-slate-900">{item.nome}</p>
                        <p className="text-[10px] font-bold uppercase text-slate-400">{item.qtd} lancamentos</p>
                      </div>
                    </div>
                    <p className="text-sm font-black italic text-slate-900">{fmt(item.total)}</p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full border border-slate-200/50 bg-slate-100">
                    <div className="h-full rounded-full shadow-sm transition-all duration-1000" style={{ width: `${porcentagem}%`, backgroundColor: cor }} />
                  </div>
                  <p className="mt-1 text-right text-[10px] font-black uppercase text-slate-400">{porcentagem.toFixed(1)}% da fatia</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-8 lg:col-span-5">
          <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-xl">
            <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase italic text-rose-500">
              <TrendingUp /> Top 5 Criticos
            </h3>
            <div className="space-y-5">
              {top5Gastos.map((transaction, index) => (
                <div key={transaction.id} className="flex items-center gap-4">
                  <div className="flex h-8 w-8 rotate-[-10deg] items-center justify-center rounded-xl text-[10px] font-black text-white shadow-lg" style={{ backgroundColor: getCorRanking(index + 1) }}>
                    #{index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black uppercase leading-tight text-slate-900">{transaction.descricao}</p>
                    <p className="text-[10px] font-bold uppercase italic text-slate-400">{transaction.categoria}</p>
                  </div>
                  <p className="text-sm font-black italic text-rose-600">{fmt(Math.abs(transaction.valor))}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-xl">
            <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase italic text-slate-900">
              <Briefcase className="text-indigo-500" /> Fluxo de Saida
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-center">
                <HomeIcon size={16} className="mx-auto mb-2 text-indigo-600" />
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Pessoal</p>
                <p className="my-1 text-xl font-black text-indigo-950">{fmt(gastosPessoais)}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
                <Briefcase size={16} className="mx-auto mb-2 text-emerald-600" />
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Business</p>
                <p className="my-1 text-xl font-black text-emerald-950">{fmt(gastosBusiness)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h3 className="flex items-center gap-3 text-lg font-black uppercase italic text-slate-900">
            <Calendar className="text-indigo-500" /> Lancamentos
          </h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="BUSCAR..."
              value={filtroTexto}
              onChange={(event) => setFiltroTexto(event.target.value)}
              className="w-full rounded-xl border-none bg-slate-100 py-2 pl-10 pr-4 text-[10px] font-black uppercase shadow-inner"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-4 pb-4">Data</th>
                <th className="px-4 pb-4">Descricao</th>
                <th className="px-4 pb-4">Categoria</th>
                <th className="px-4 pb-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transacoesFiltradas.map((transaction) => (
                <tr key={transaction.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-4 text-[11px] font-bold text-slate-500">{new Date(transaction.data).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-4 text-xs font-black uppercase text-slate-900">{transaction.descricao}</td>
                  <td className="px-4 py-4"><Badge label={transaction.categoria} color={getBadgeColor(transaction.categoria)} /></td>
                  <td className={`px-4 py-4 text-right text-xs font-black italic ${transaction.tipo === 'Entrada' ? 'text-emerald-600' : 'text-slate-950'}`}>
                    {transaction.tipo === 'Saída' ? `- ${fmt(Math.abs(transaction.valor))}` : fmt(transaction.valor)}
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

function getCor(categoria: string) {
  const cores: Record<string, string> = {
    Alimentacao: '#e65100', Transporte: '#1565c0', Moradia: '#2e7d32',
    Saude: '#c62828', Educacao: '#6a1b9a', Lazer: '#f57f17',
    Vestuario: '#ad1457', Investimento: '#00695c',
  }
  return cores[categoria] || '#455a64'
}

function getBadgeColor(categoria: string) {
  const cores: Record<string, string> = {
    Alimentacao: 'amber', Transporte: 'indigo', Moradia: 'green',
    Saude: 'red', Educacao: 'gray', Lazer: 'pink',
  }
  return cores[categoria] || 'gray'
}

function getCorRanking(posicao: number) {
  return ['#f44336', '#ff7043', '#ffa726', '#78909c', '#b0bec5'][posicao - 1] || '#b0bec5'
}


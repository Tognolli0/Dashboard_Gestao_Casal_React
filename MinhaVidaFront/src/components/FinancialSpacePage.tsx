import { useMemo, useState } from 'react'
import { Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteTransacao, getTransacoesPorPeriodo, postTransacao } from '../services/api'
import { DASHBOARD_QUERY_KEY } from '../lib/queryClient'
import {
  appendTransaction,
  buildOptimisticTransaction,
  removeTransaction,
  replaceTransaction,
  summarizeTransactions,
  updateDashboardTransactions,
} from '../lib/dashboard'
import { Badge, Btn, Card, Input, Select, Spinner, StatCard, fmt } from './ui'
import type { DashboardResumo, Transacao } from '../types/models'

const MESES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

type AbaConfig = {
  id: string
  label: string
  personal: boolean
}

type Theme = {
  accentText: string
  accentButton: string
  accentButtonHover?: string
  accentBorder: string
  accentSoftBorder: string
  accentSoftBg: string
  accentInputFocus: string
  accentBadge: string
  inactiveTab: string
  rowHover: string
}

type FinancialSpacePageProps = {
  title: string
  accent: string
  subtitle: string
  responsavel: 'Eu' | 'Namorada'
  categorias: string[]
  abas: [AbaConfig, AbaConfig]
  theme: Theme
  saldoLabels: {
    first: string
    second: string
  }
}

export default function FinancialSpacePage({
  title,
  accent,
  subtitle,
  responsavel,
  categorias,
  abas,
  theme,
  saldoLabels,
}: FinancialSpacePageProps) {
  const queryClient = useQueryClient()
  const [mes, setMes] = useState(new Date().getMonth())
  const [aba, setAba] = useState(abas[0].id)
  const [form, setForm] = useState({
    tipo: 'Saída' as const,
    categoria: 'Geral',
    descricao: '',
    valor: '',
  })
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'Todos' | 'Entrada' | 'Saída'>('Todos')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [ordenacao, setOrdenacao] = useState<'recentes' | 'maiores' | 'menores'>('recentes')
  const [erro, setErro] = useState('')
  const anoAtual = new Date().getFullYear()

  const { data: lista = [], isLoading } = useQuery({
    queryKey: ['transacoes', responsavel, anoAtual, mes],
    queryFn: () => getTransacoesPorPeriodo(responsavel, mes + 1, anoAtual),
  })

  const saveMutation = useMutation({
    mutationFn: postTransacao,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['transacoes', responsavel, anoAtual, mes] })
      await queryClient.cancelQueries({ queryKey: DASHBOARD_QUERY_KEY })

      const previousTransactions = queryClient.getQueryData<Transacao[]>(['transacoes', responsavel, anoAtual, mes]) ?? []
      const previousDashboard = queryClient.getQueryData<DashboardResumo>(DASHBOARD_QUERY_KEY)
      const optimisticTransaction = buildOptimisticTransaction(payload)

      queryClient.setQueryData<Transacao[]>(['transacoes', responsavel, anoAtual, mes], (current = []) =>
        appendTransaction(current, optimisticTransaction),
      )

      queryClient.setQueryData<DashboardResumo | undefined>(DASHBOARD_QUERY_KEY, (current) =>
        updateDashboardTransactions(current, responsavel, (transactions) =>
          appendTransaction(transactions, optimisticTransaction),
        ),
      )

      return { previousTransactions, previousDashboard, optimisticId: optimisticTransaction.id }
    },
    onSuccess: (savedTransaction, _payload, context) => {
      queryClient.setQueryData<Transacao[]>(['transacoes', responsavel], (current = []) =>
        replaceTransaction(current, context?.optimisticId ?? savedTransaction.id, savedTransaction),
      )

      queryClient.setQueryData<DashboardResumo | undefined>(DASHBOARD_QUERY_KEY, (current) =>
        updateDashboardTransactions(current, responsavel, (transactions) =>
          replaceTransaction(transactions, context?.optimisticId ?? savedTransaction.id, savedTransaction),
        ),
      )

      setForm({
        tipo: 'Saída',
        categoria: 'Geral',
        descricao: '',
        valor: '',
      })
      setErro('')
    },
    onError: (error: any, _payload, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transacoes', responsavel, anoAtual, mes], context.previousTransactions)
      }
      if (context?.previousDashboard) {
        queryClient.setQueryData(DASHBOARD_QUERY_KEY, context.previousDashboard)
      }
      setErro(error?.response?.data ?? 'Erro ao salvar. Tente novamente.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTransacao,
    onMutate: async (transactionId) => {
      await queryClient.cancelQueries({ queryKey: ['transacoes', responsavel, anoAtual, mes] })
      await queryClient.cancelQueries({ queryKey: DASHBOARD_QUERY_KEY })

      const previousTransactions = queryClient.getQueryData<Transacao[]>(['transacoes', responsavel, anoAtual, mes]) ?? []
      const previousDashboard = queryClient.getQueryData<DashboardResumo>(DASHBOARD_QUERY_KEY)

      queryClient.setQueryData<Transacao[]>(['transacoes', responsavel, anoAtual, mes], (current = []) =>
        removeTransaction(current, transactionId),
      )

      queryClient.setQueryData<DashboardResumo | undefined>(DASHBOARD_QUERY_KEY, (current) =>
        updateDashboardTransactions(current, responsavel, (transactions) =>
          removeTransaction(transactions, transactionId),
        ),
      )

      return { previousTransactions, previousDashboard }
    },
    onError: (_error, _transactionId, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transacoes', responsavel, anoAtual, mes], context.previousTransactions)
      }
      if (context?.previousDashboard) {
        queryClient.setQueryData(DASHBOARD_QUERY_KEY, context.previousDashboard)
      }
    },
  })

  const abaAtual = abas.find((item) => item.id === aba) ?? abas[0]
  const baseFiltradas = useMemo(
    () => lista.filter((transaction) => transaction.ehPessoal === abaAtual.personal),
    [abaAtual.personal, lista],
  )
  const categoriasDisponiveis = useMemo(
    () => ['Todas', ...new Set(baseFiltradas.map((transaction) => transaction.categoria))],
    [baseFiltradas],
  )
  const termoBusca = filtroTexto.trim().toLowerCase()

  const filtradas = useMemo(() => {
    const filtered = baseFiltradas.filter((transaction) => {
      const bateTexto = !termoBusca ||
        transaction.descricao.toLowerCase().includes(termoBusca) ||
        transaction.categoria.toLowerCase().includes(termoBusca)
      const bateTipo = filtroTipo === 'Todos' || transaction.tipo === filtroTipo
      const bateCategoria = filtroCategoria === 'Todas' || transaction.categoria === filtroCategoria

      return bateTexto && bateTipo && bateCategoria
    })

    if (ordenacao === 'maiores') {
      return [...filtered].sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor))
    }

    if (ordenacao === 'menores') {
      return [...filtered].sort((a, b) => Math.abs(a.valor) - Math.abs(b.valor))
    }

    return [...filtered].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  }, [baseFiltradas, termoBusca, filtroTipo, filtroCategoria, ordenacao])

  const { saldo, entradas, saidas } = summarizeTransactions(filtradas)

  const salvar = () => {
    setErro('')

    if (!form.descricao.trim()) {
      setErro('Informe a descricao.')
      return
    }

    if (!form.valor || Number(form.valor) <= 0) {
      setErro('Informe um valor maior que zero.')
      return
    }

    saveMutation.mutate({
      responsavel,
      ehPessoal: abaAtual.personal,
      tipo: form.tipo,
      categoria: form.categoria,
      descricao: form.descricao.trim(),
      valor: Number(form.valor),
      data: new Date().toISOString(),
    })
  }

  const limparFiltros = () => {
    setFiltroTexto('')
    setFiltroTipo('Todos')
    setFiltroCategoria('Todas')
    setOrdenacao('recentes')
  }

  if (isLoading) return <Spinner />

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10 text-slate-900 animate-fade-up">
      <header className={`flex flex-col justify-between gap-6 border-b pb-6 md:flex-row md:items-center ${theme.accentSoftBorder}`}>
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter">
            {title} <span className={theme.accentText}>{accent}</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={mes}
            onChange={(event) => setMes(Number(event.target.value))}
            className={`rounded-xl border bg-slate-50 px-4 py-2 text-sm font-bold outline-none ${theme.accentSoftBorder} ${theme.accentBadge}`}
          >
            {MESES.map((item, index) => <option key={item} value={index}>{item}</option>)}
          </select>

          <div className={`flex rounded-xl border p-1 ${theme.accentSoftBorder} ${theme.accentSoftBg}`}>
            {abas.map((item) => (
              <button
                key={item.id}
                onClick={() => setAba(item.id)}
                className={`rounded-lg px-4 py-2 text-xs font-black uppercase transition-all ${
                  aba === item.id ? 'bg-white shadow-sm' : theme.inactiveTab
                } ${aba === item.id ? theme.accentText : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard label={abaAtual.id === abas[0].id ? saldoLabels.first : saldoLabels.second} value={fmt(saldo)} color={saldo >= 0 ? 'green' : 'red'} />
        <StatCard label="Entradas" value={fmt(entradas)} color="green" />
        <StatCard label="Saidas" value={fmt(saidas)} color="red" />
      </div>

      <Card className={`p-6 ${theme.accentSoftBorder}`}>
        <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">
          Novo Lancamento - {abaAtual.label}
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input label="Descricao" value={form.descricao} onChange={(value) => setForm({ ...form, descricao: value })} placeholder="Ex: Mercado, Receita..." />
          <Input label="Valor (R$)" type="number" value={form.valor} onChange={(value) => setForm({ ...form, valor: value })} placeholder="0,00" />
          <Select
            label="Tipo"
            value={form.tipo}
            onChange={(value) => setForm({ ...form, tipo: value as 'Entrada' | 'Saída' })}
            options={[
              { value: 'Saída', label: 'Saida' },
              { value: 'Entrada', label: 'Entrada' },
            ]}
          />
          <Select
            label="Categoria"
            value={form.categoria}
            onChange={(value) => setForm({ ...form, categoria: value })}
            options={categorias.map((categoria) => ({ value: categoria, label: categoria }))}
          />
          <div className="flex flex-col justify-end">
            <Btn
              onClick={salvar}
              disabled={saveMutation.isPending}
              className={`w-full ${theme.accentButton} ${theme.accentButtonHover ?? ''}`}
            >
              {saveMutation.isPending ? 'Salvando...' : '+ Lancar'}
            </Btn>
          </div>
        </div>

        {erro && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">{erro}</p>}
      </Card>

      <Card className={`p-6 ${theme.accentSoftBorder}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className={theme.accentText} />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Busca & Filtros</h3>
          </div>
          <Btn variant="ghost" onClick={limparFiltros} className="px-3 py-2">
            <X size={14} className="mr-1 inline" /> Limpar
          </Btn>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="ml-1 text-[11px] font-black uppercase tracking-widest text-slate-400">Buscar</span>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filtroTexto}
                onChange={(event) => setFiltroTexto(event.target.value)}
                placeholder="Descrição ou categoria"
                className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition-all ${theme.accentInputFocus}`}
              />
            </div>
          </label>

          <Select
            label="Tipo"
            value={filtroTipo}
            onChange={(value) => setFiltroTipo(value as 'Todos' | 'Entrada' | 'Saída')}
            options={[
              { value: 'Todos', label: 'Todos' },
              { value: 'Entrada', label: 'Entradas' },
              { value: 'Saída', label: 'Saídas' },
            ]}
          />

          <Select
            label="Categoria"
            value={filtroCategoria}
            onChange={setFiltroCategoria}
            options={categoriasDisponiveis.map((categoria) => ({ value: categoria, label: categoria }))}
          />

          <Select
            label="Ordenar"
            value={ordenacao}
            onChange={(value) => setOrdenacao(value as 'recentes' | 'maiores' | 'menores')}
            options={[
              { value: 'recentes', label: 'Mais recentes' },
              { value: 'maiores', label: 'Maiores valores' },
              { value: 'menores', label: 'Menores valores' },
            ]}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            {filtradas.length} lancamentos em {MESES[mes]}
          </p>
          <Badge label={abaAtual.label} color="indigo" />
        </div>

        {filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Plus size={32} className="mb-2 opacity-30" />
            <p className="text-sm font-bold">Nenhum lancamento encontrado</p>
            <p className="text-xs">Ajuste os filtros ou adicione um novo lançamento</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase text-slate-400">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Descricao</th>
                <th className="p-4">Categoria</th>
                <th className="p-4 text-right">Valor</th>
                <th className="w-10 p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtradas.map((transaction) => (
                <tr key={transaction.id} className={`transition-colors ${theme.rowHover}`}>
                  <td className="p-4 text-xs text-slate-400">{new Date(transaction.data).toLocaleDateString('pt-BR')}</td>
                  <td className="p-4 text-sm font-bold text-slate-800">{transaction.descricao}</td>
                  <td className="p-4"><Badge label={transaction.categoria} color="indigo" /></td>
                  <td className={`p-4 text-right text-sm font-black ${transaction.tipo === 'Entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {transaction.tipo === 'Entrada' ? '+' : '-'} {fmt(Math.abs(transaction.valor))}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(transaction.id)}
                      disabled={deleteMutation.isPending}
                      className="text-slate-300 transition-colors hover:text-red-500 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

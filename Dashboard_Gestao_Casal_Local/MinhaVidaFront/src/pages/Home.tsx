import { useMemo, useState } from 'react'
import { AlertTriangle, Briefcase, CheckCheck, ClipboardList, DollarSign, Download, PiggyBank, Plus, RotateCcw, Shield, ShoppingBag, Sparkles, Target, Trash2, TrendingUp, Upload, Wallet } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts'
import { addChecklistItem, baixarBackupLocal, deleteChecklistItem, deleteDesejo, deleteMeta, getChecklistMensal, getDashboardResumo, postDesejo, postMeta, realizarAporte, resetChecklistMensal, restaurarBackupLocal, updateChecklistItem } from '../services/api'
import { DASHBOARD_QUERY_KEY } from '../lib/queryClient'
import { combineTransactions } from '../lib/dashboard'
import { Badge, Btn, Card, Input, Modal, ProgressBar, SkeletonDashboard, StatCard, fmt } from '../components/ui'
import type { ChecklistItem, DashboardResumo, Desejo, Meta, Transacao } from '../types/models'

const FORM_META_VAZIO = { titulo: '', valorObjetivo: '', valorGuardado: '0', responsavel: 'Casal', ehReservaEmergencia: false }
const FORM_DESEJO_VAZIO = { titulo: '', dataAlvo: '', icone: '*' }
const CHECKLIST_QUERY_KEY = ['checklist-mensal']

function mutateResumo(
  current: DashboardResumo | undefined,
  updater: (data: DashboardResumo) => DashboardResumo,
) {
  if (!current) return current
  return updater(current)
}

function getBarHeight(value: number, max: number) {
  if (value <= 0 || max <= 0) return 14
  const normalized = value / max
  return Math.round(14 + normalized * 150)
}

const CHART_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444']
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function buildFluxoData(transacoes: Transacao[]) {
  const entradas = transacoes
    .filter((t) => t.tipo === 'Entrada')
    .reduce((acc, t) => acc + t.valor, 0)

  const saidas = transacoes
    .filter((t) => t.tipo === 'Saída')
    .reduce((acc, t) => acc + Math.abs(t.valor), 0)

  const saldo = entradas - saidas
  const escala = Math.max(entradas, saidas, Math.abs(saldo), 1)

  return {
    entradas,
    saidas,
    saldo,
    escala,
  }
}

function FluxoCard({
  titulo,
  icon,
  iconWrap,
  iconColor,
  transacoes,
}: {
  titulo: string
  icon: React.ReactNode
  iconWrap: string
  iconColor: string
  transacoes: Transacao[]
}) {
  const { entradas, saidas, saldo, escala } = buildFluxoData(transacoes)
  const barras = [
    {
      label: 'Entradas',
      value: entradas,
      color: 'from-emerald-400 to-emerald-600',
      glow: 'shadow-emerald-200',
    },
    {
      label: 'Saídas',
      value: saidas,
      color: 'from-rose-400 to-rose-600',
      glow: 'shadow-rose-200',
    },
    {
      label: 'Saldo',
      value: Math.abs(saldo),
      color: saldo >= 0 ? 'from-sky-400 to-indigo-600' : 'from-amber-300 to-orange-500',
      glow: saldo >= 0 ? 'shadow-indigo-200' : 'shadow-orange-200',
    },
  ]

  const axisValues = [100, 66, 33, 0].map((pct) => ({
    pct,
    value: fmt((escala * pct) / 100),
  }))

  return (
    <Card className="relative overflow-hidden border-slate-200 p-8 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-50 to-transparent" />
      <div className="relative mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 italic">
          <div className={`rounded-2xl border p-3 ${iconWrap}`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-950">{titulo}</h3>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fluxo financeiro</p>
          </div>
        </div>
        <Badge label={saldo >= 0 ? 'Saldo positivo' : 'Saldo apertado'} color={saldo >= 0 ? 'green' : 'amber'} />
      </div>

      <div className="relative rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
        <div className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entradas</p>
            <p className="mt-2 text-sm font-black text-emerald-600">{fmt(entradas)}</p>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saídas</p>
            <p className="mt-2 text-sm font-black text-rose-600">{fmt(saidas)}</p>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saldo</p>
            <p className={`mt-2 text-sm font-black ${saldo >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>{fmt(saldo)}</p>
          </div>
        </div>

        <div className="relative grid grid-cols-[56px_minmax(0,1fr)] gap-4">
          <div className="relative h-56 text-[9px] font-black uppercase tracking-wider text-slate-300">
            {axisValues.map((axis) => (
              <div
                key={axis.pct}
                className="absolute left-0 right-0 -translate-y-1/2"
                style={{ top: `${100 - axis.pct}%` }}
              >
                {axis.value}
              </div>
            ))}
          </div>

          <div className="relative h-56 rounded-[24px] border border-slate-200 bg-white px-6 pb-4 pt-5 shadow-inner">
            {axisValues.map((axis) => (
              <div
                key={axis.pct}
                className="absolute left-4 right-4 border-t border-dashed border-slate-200"
                style={{ top: `${100 - axis.pct}%` }}
              />
            ))}

            <div className="relative flex h-full items-end justify-around gap-4">
              {barras.map((barra) => (
                <div key={barra.label} className="flex h-full flex-1 flex-col items-center justify-end gap-3">
                  <span className="text-[10px] font-black text-slate-600">{fmt(barra.value)}</span>
                  <div
                    className={`w-full max-w-[92px] rounded-t-[22px] bg-gradient-to-t ${barra.color} shadow-lg ${barra.glow} transition-all duration-700`}
                    style={{ height: `${getBarHeight(barra.value, escala)}px` }}
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{barra.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function InsightCard({
  title,
  value,
  detail,
  tone = 'indigo',
  icon,
}: {
  title: string
  value: string
  detail: string
  tone?: 'indigo' | 'green' | 'amber' | 'pink'
  icon: React.ReactNode
}) {
  const tones = {
    indigo: 'border-indigo-200 bg-indigo-50/70 text-indigo-700',
    green: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50/80 text-amber-700',
    pink: 'border-pink-200 bg-pink-50/80 text-pink-700',
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-xs font-bold leading-relaxed text-slate-500">{detail}</p>
        </div>
        <div className={`rounded-2xl border p-3 ${tones[tone]}`}>{icon}</div>
      </div>
    </Card>
  )
}

function AlertCard({
  title,
  message,
  tone,
}: {
  title: string
  message: string
  tone: 'amber' | 'rose' | 'indigo' | 'green'
}) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  return (
    <Card className={`p-5 ${tones[tone]}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-current/10 bg-white/60 p-3">
          <AlertTriangle size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{title}</p>
          <p className="mt-2 text-sm font-bold leading-relaxed">{message}</p>
        </div>
      </div>
    </Card>
  )
}
export default function Home() {
  const queryClient = useQueryClient()
  const [aba, setAba] = useState<'metas' | 'reserva' | 'buckets' | 'evolucao' | 'backup' | 'rotina'>('metas')
  const [modalMeta, setModalMeta] = useState(false)
  const [modalDesejo, setModalDesejo] = useState(false)
  const [modalAporte, setModalAporte] = useState(false)
  const [novaMeta, setNovaMeta] = useState(FORM_META_VAZIO)
  const [novoDesejo, setNovoDesejo] = useState(FORM_DESEJO_VAZIO)
  const [modoMeta, setModoMeta] = useState<'meta' | 'reserva'>('meta')
  const [metaSelecionada, setMetaSelecionada] = useState<Meta | null>(null)
  const [valorAporte, setValorAporte] = useState('')
  const [novoItemChecklist, setNovoItemChecklist] = useState('')
  const [erroMeta, setErroMeta] = useState('')
  const [erroDesejo, setErroDesejo] = useState('')
  const [erroAporte, setErroAporte] = useState('')
  const [erroRotina, setErroRotina] = useState('')
  const [statusRotina, setStatusRotina] = useState('')

  const { data: resumo, isLoading } = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: getDashboardResumo,
  })
  const mesChecklist = new Date().toISOString().slice(0, 7)

  const { data: checklist = [] } = useQuery({
    queryKey: [...CHECKLIST_QUERY_KEY, mesChecklist],
    queryFn: () => getChecklistMensal(mesChecklist),
  })

  const metaMutation = useMutation({
    mutationFn: postMeta,
    onSuccess: (savedMeta) => {
      queryClient.setQueryData<DashboardResumo | undefined>(DASHBOARD_QUERY_KEY, (current) =>
        mutateResumo(current, (data) => ({
          ...data,
          metas: data.metas
            .filter((meta) => meta.id > 0)
            .concat(savedMeta),
        })),
      )
      setModalMeta(false)
      setNovaMeta(FORM_META_VAZIO)
      setModoMeta('meta')
      setErroMeta('')
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY })
      setErroMeta(error?.response?.data ?? 'Erro ao salvar meta.')
    },
  })

  const deleteMetaMutation = useMutation({
    mutationFn: deleteMeta,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_QUERY_KEY })
      const previous = queryClient.getQueryData<DashboardResumo>(DASHBOARD_QUERY_KEY)

      queryClient.setQueryData<DashboardResumo | undefined>(DASHBOARD_QUERY_KEY, (current) =>
        mutateResumo(current, (data) => ({
          ...data,
          metas: data.metas.filter((meta) => meta.id !== id),
        })),
      )

      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(DASHBOARD_QUERY_KEY, context.previous)
      }
    },
  })

  const aporteMutation = useMutation({
    mutationFn: ({ id, valor }: { id: number; valor: number }) => realizarAporte(id, valor),
    onMutate: async ({ id, valor }) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_QUERY_KEY })
      const previous = queryClient.getQueryData<DashboardResumo>(DASHBOARD_QUERY_KEY)

      queryClient.setQueryData<DashboardResumo | undefined>(DASHBOARD_QUERY_KEY, (current) =>
        mutateResumo(current, (data) => ({
          ...data,
          metas: data.metas.map((meta) => {
            if (meta.id !== id) return meta
            return {
              ...meta,
              valorGuardado: Math.min(meta.valorGuardado + valor, meta.valorObjetivo),
            }
          }),
        })),
      )

      return { previous }
    },
    onSuccess: (savedMeta) => {
      queryClient.setQueryData<DashboardResumo | undefined>(DASHBOARD_QUERY_KEY, (current) =>
        mutateResumo(current, (data) => ({
          ...data,
          metas: data.metas.map((meta) => (meta.id === savedMeta.id ? savedMeta : meta)),
        })),
      )
      setMetaSelecionada(savedMeta)
      setValorAporte('')
      setErroAporte('')
      setModalAporte(false)
    },
    onError: (error: any, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(DASHBOARD_QUERY_KEY, context.previous)
      }
      setErroAporte(error?.response?.data ?? 'Erro ao registrar aporte.')
    },
  })

  const desejoMutation = useMutation({
    mutationFn: postDesejo,
    onSuccess: (savedDesejo) => {
      queryClient.setQueryData<DashboardResumo | undefined>(DASHBOARD_QUERY_KEY, (current) =>
        mutateResumo(current, (data) => ({
          ...data,
          desejos: data.desejos
            .filter((desejo) => desejo.id > 0)
            .concat(savedDesejo),
        })),
      )
      setModalDesejo(false)
      setNovoDesejo(FORM_DESEJO_VAZIO)
      setErroDesejo('')
    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY })
      setErroDesejo(error?.response?.data ?? 'Erro ao salvar desejo.')
    },
  })

  const deleteDesejoMutation = useMutation({
    mutationFn: deleteDesejo,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: DASHBOARD_QUERY_KEY })
      const previous = queryClient.getQueryData<DashboardResumo>(DASHBOARD_QUERY_KEY)

      queryClient.setQueryData<DashboardResumo | undefined>(DASHBOARD_QUERY_KEY, (current) =>
        mutateResumo(current, (data) => ({
          ...data,
          desejos: data.desejos.filter((desejo) => desejo.id !== id),
        })),
      )

      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(DASHBOARD_QUERY_KEY, context.previous)
      }
    },
  })

  const addChecklistMutation = useMutation({
    mutationFn: addChecklistItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...CHECKLIST_QUERY_KEY, mesChecklist] })
      setNovoItemChecklist('')
      setErroRotina('')
    },
    onError: () => {
      setErroRotina('Nao foi possivel adicionar o item do checklist.')
    },
  })

  const updateChecklistMutation = useMutation({
    mutationFn: updateChecklistItem,
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: [...CHECKLIST_QUERY_KEY, mesChecklist] })
      const previous = queryClient.getQueryData<ChecklistItem[]>([...CHECKLIST_QUERY_KEY, mesChecklist])

      queryClient.setQueryData<ChecklistItem[]>([...CHECKLIST_QUERY_KEY, mesChecklist], (current = []) =>
        current.map((currentItem) => (currentItem.id === item.id ? item : currentItem)),
      )

      return { previous }
    },
    onError: (_error, _item, context) => {
      if (context?.previous) {
        queryClient.setQueryData([...CHECKLIST_QUERY_KEY, mesChecklist], context.previous)
      }
      setErroRotina('Nao foi possivel atualizar o checklist.')
    },
  })

  const deleteChecklistMutation = useMutation({
    mutationFn: deleteChecklistItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...CHECKLIST_QUERY_KEY, mesChecklist] })
    },
    onError: () => {
      setErroRotina('Nao foi possivel remover o item do checklist.')
    },
  })

  const resetChecklistMutation = useMutation({
    mutationFn: () => resetChecklistMensal(mesChecklist),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...CHECKLIST_QUERY_KEY, mesChecklist] })
      setStatusRotina('Checklist mensal recriado com sucesso.')
      setErroRotina('')
    },
    onError: () => {
      setErroRotina('Nao foi possivel recriar o checklist mensal.')
    },
  })

  const backupMutation = useMutation({
    mutationFn: baixarBackupLocal,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `backup-minha-vida-${mesChecklist}.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      setStatusRotina('Backup gerado com sucesso.')
      setErroRotina('')
    },
    onError: () => {
      setErroRotina('Nao foi possivel gerar o backup.')
    },
  })

  const restoreMutation = useMutation({
    mutationFn: restaurarBackupLocal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...CHECKLIST_QUERY_KEY, mesChecklist] })
      setStatusRotina('Backup restaurado com sucesso.')
      setErroRotina('')
    },
    onError: () => {
      setErroRotina('Nao foi possivel restaurar o backup.')
    },
  })

  const metas = useMemo(
    () => [...(resumo?.metas ?? [])]
      .filter((meta) => !meta.ehReservaEmergencia)
      .sort((a, b) => (b.valorGuardado / Math.max(b.valorObjetivo, 1)) - (a.valorGuardado / Math.max(a.valorObjetivo, 1))),
    [resumo?.metas],
  )
  const reservaEmergencia = useMemo(
    () => [...(resumo?.metas ?? [])].find((meta) => meta.ehReservaEmergencia) ?? null,
    [resumo?.metas],
  )
  const desejos = resumo?.desejos ?? []

  const totalEu = resumo?.transacoesEu?.reduce((acc, transaction) => acc + transaction.valor, 0) ?? 0
  const totalBia = resumo?.transacoesDela?.reduce((acc, transaction) => acc + transaction.valor, 0) ?? 0
  const totalJuntos = totalEu + totalBia

  const todasTransacoes = combineTransactions(resumo)
  const mesAtual = new Date().getMonth()
  const transacoesMes = todasTransacoes.filter((transaction) => new Date(transaction.data).getMonth() === mesAtual)
  const entradasMes = transacoesMes.filter((transaction) => transaction.tipo === 'Entrada').reduce((acc, transaction) => acc + transaction.valor, 0)
  const saidasMes = transacoesMes.filter((transaction) => transaction.tipo === 'Saída').reduce((acc, transaction) => acc + Math.abs(transaction.valor), 0)
  const saldoMes = entradasMes - saidasMes
  const taxaPoupanca = entradasMes > 0 ? Math.round((saldoMes / entradasMes) * 100) : 0

  const categoriaTopMes = useMemo(() => {
    const categorias = new Map<string, number>()
    for (const transaction of transacoesMes.filter((item) => item.tipo === 'Saída')) {
      categorias.set(transaction.categoria, (categorias.get(transaction.categoria) ?? 0) + Math.abs(transaction.valor))
    }

    const [nome, total] = [...categorias.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['Sem destaque', 0]
    return { nome, total }
  }, [transacoesMes])

  const totalMetas = metas.reduce((acc, meta) => acc + meta.valorObjetivo, 0)
  const totalGuardadoMetas = metas.reduce((acc, meta) => acc + meta.valorGuardado, 0)
  const progressoMetas = totalMetas > 0 ? Math.round((totalGuardadoMetas / totalMetas) * 100) : 0
  const metasConcluidas = metas.filter((meta) => meta.valorGuardado >= meta.valorObjetivo).length
  const bucketsAbertos = desejos.filter((item) => !item.concluido).length

  const scoreFinanceiro = Math.max(0, Math.min(100,
    45 +
    (saldoMes >= 0 ? 20 : -20) +
    (taxaPoupanca >= 20 ? 15 : taxaPoupanca > 0 ? 5 : -10) +
    (progressoMetas >= 50 ? 10 : progressoMetas > 0 ? 5 : 0) +
    (categoriaTopMes.total > 0 && saidasMes > 0 && categoriaTopMes.total / saidasMes > 0.45 ? -10 : 10),
  ))

  const destaquePrincipal = saldoMes >= 0
    ? `Vocês fecharam o mês com ${fmt(saldoMes)} livres até aqui.`
    : `As saídas do mês estão ${fmt(Math.abs(saldoMes))} acima da sobra atual.`

  const acaoRecomendada = saldoMes < 0
    ? 'Revisem a categoria mais pesada e segurem gastos variáveis nesta semana.'
    : progressoMetas < 100
      ? 'Excelente momento para direcionar parte da sobra do mês para uma meta ativa.'
      : 'Com metas bem encaminhadas, vale criar uma nova reserva estratégica para os próximos planos.'

  const evolucaoMensal = useMemo(() => {
    const seed = MONTH_LABELS.map((label) => ({
      mes: label,
      entradas: 0,
      saidas: 0,
      saldo: 0,
      diogo: 0,
      beatriz: 0,
    }))

    for (const transaction of todasTransacoes) {
      const month = new Date(transaction.data).getMonth()
      const current = seed[month]

      if (transaction.tipo === 'Entrada') {
        current.entradas += transaction.valor
      } else {
        current.saidas += Math.abs(transaction.valor)
      }

      current.saldo = current.entradas - current.saidas

      if (transaction.responsavel === 'Eu') {
        current.diogo += transaction.valor
      } else {
        current.beatriz += transaction.valor
      }
    }

    return seed
  }, [todasTransacoes])

  const saidasRecentes = evolucaoMensal
    .map((item) => item.saidas)
    .filter((value) => value > 0)
    .slice(-3)
  const mediaSaidasRecentes = saidasRecentes.length > 0
    ? saidasRecentes.reduce((acc, value) => acc + value, 0) / saidasRecentes.length
    : saidasMes
  const objetivoIdealReserva = Math.max(mediaSaidasRecentes * 6, mediaSaidasRecentes > 0 ? mediaSaidasRecentes : 0)
  const coberturaReservaMeses = mediaSaidasRecentes > 0 && reservaEmergencia
    ? reservaEmergencia.valorGuardado / mediaSaidasRecentes
    : 0
  const faltanteReservaIdeal = Math.max(objetivoIdealReserva - (reservaEmergencia?.valorGuardado ?? 0), 0)

  const categoriasChart = useMemo(() => {
    const categories = new Map<string, number>()

    for (const transaction of todasTransacoes.filter((item) => item.tipo === 'Saída')) {
      categories.set(transaction.categoria, (categories.get(transaction.categoria) ?? 0) + Math.abs(transaction.valor))
    }

    return [...categories.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], index) => ({
        name,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
  }, [todasTransacoes])

  const alertasInteligentes = useMemo(() => {
    const alertas: { id: string; title: string; message: string; tone: 'amber' | 'rose' | 'indigo' | 'green' }[] = []
    const mesesComSaida = evolucaoMensal.filter((item) => item.saidas > 0)
    const mediaSaidasHistorica = mesesComSaida.length > 0
      ? mesesComSaida.reduce((acc, item) => acc + item.saidas, 0) / mesesComSaida.length
      : 0
    const categoriaPeso = saidasMes > 0 ? categoriaTopMes.total / saidasMes : 0
    const metasParadas = metas
      .filter((meta) => meta.valorGuardado < meta.valorObjetivo)
      .filter((meta) => {
        const diasParada = Math.floor((Date.now() - new Date(meta.atualizadaEm).getTime()) / (1000 * 60 * 60 * 24))
        return diasParada >= 45
      })
      .sort((a, b) => new Date(a.atualizadaEm).getTime() - new Date(b.atualizadaEm).getTime())

    if (mediaSaidasHistorica > 0 && saidasMes > mediaSaidasHistorica * 1.2) {
      const excesso = saidasMes - mediaSaidasHistorica
      alertas.push({
        id: 'gasto-acima',
        title: 'Gasto acima do normal',
        message: `As saídas do mês estão ${fmt(excesso)} acima da média recente do casal.`,
        tone: 'rose',
      })
    }

    if (categoriaTopMes.total > 0 && categoriaPeso >= 0.35) {
      alertas.push({
        id: 'categoria-estourando',
        title: 'Categoria estourando',
        message: `${categoriaTopMes.nome} já consome ${(categoriaPeso * 100).toFixed(0)}% das saídas do mês.`,
        tone: 'amber',
      })
    }

    if (entradasMes > 0 && (saldoMes < 0 || taxaPoupanca <= 10)) {
      alertas.push({
        id: 'saldo-apertado',
        title: 'Saldo do mês apertando',
        message: saldoMes < 0
          ? `O mês está negativo em ${fmt(Math.abs(saldoMes))}. Vale segurar gastos variáveis agora.`
          : `A sobra do mês caiu para ${taxaPoupanca}%, abaixo da faixa confortável.`,
        tone: saldoMes < 0 ? 'rose' : 'amber',
      })
    }

    if (metasParadas.length > 0) {
      const metaParada = metasParadas[0]
      const diasParada = Math.floor((Date.now() - new Date(metaParada.atualizadaEm).getTime()) / (1000 * 60 * 60 * 24))
      alertas.push({
        id: 'meta-parada',
        title: 'Meta parada há muito tempo',
        message: `${metaParada.titulo} está sem aporte há ${diasParada} dias. Um pequeno reforço já reacende o plano.`,
        tone: 'indigo',
      })
    }

    if (alertas.length === 0) {
      alertas.push({
        id: 'sem-alertas',
        title: 'Painel estável',
        message: 'Sem alertas críticos agora. O momento está bom para manter constância e reforçar metas.',
        tone: 'green',
      })
    }

    return alertas.slice(0, 4)
  }, [evolucaoMensal, saidasMes, categoriaTopMes, entradasMes, saldoMes, taxaPoupanca, metas])

  const checklistConcluidos = checklist.filter((item) => item.concluido).length
  const progressoChecklist = checklist.length > 0
    ? Math.round((checklistConcluidos / checklist.length) * 100)
    : 0

  const handleAdicionarChecklist = () => {
    setErroRotina('')
    setStatusRotina('')

    if (!novoItemChecklist.trim()) {
      setErroRotina('Digite uma tarefa para o checklist.')
      return
    }

    addChecklistMutation.mutate({
      mesReferencia: mesChecklist,
      titulo: novoItemChecklist.trim(),
      concluido: false,
      ordem: checklist.length,
    })
  }

  const handleToggleChecklist = (item: ChecklistItem) => {
    setErroRotina('')
    setStatusRotina('')
    updateChecklistMutation.mutate({
      ...item,
      concluido: !item.concluido,
    })
  }

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!confirm('Restaurar esse backup vai substituir todos os dados atuais do app local. Deseja continuar?')) {
      return
    }

    setErroRotina('')
    setStatusRotina('')
    await restoreMutation.mutateAsync(file)
  }

  const handleSalvarMeta = () => {
    setErroMeta('')

    if (!novaMeta.titulo.trim()) {
      setErroMeta('Informe o titulo.')
      return
    }

    if (Number(novaMeta.valorObjetivo) <= 0) {
      setErroMeta('Informe um valor objetivo.')
      return
    }

    const optimisticMeta: Meta = {
      id: -Date.now(),
      titulo: novaMeta.titulo.trim(),
      valorObjetivo: Number(novaMeta.valorObjetivo),
      valorGuardado: Math.min(Number(novaMeta.valorGuardado) || 0, Number(novaMeta.valorObjetivo)),
      responsavel: novaMeta.responsavel,
      ehReservaEmergencia: modoMeta === 'reserva',
      criadaEm: new Date().toISOString(),
      atualizadaEm: new Date().toISOString(),
    }

    queryClient.setQueryData<DashboardResumo | undefined>(DASHBOARD_QUERY_KEY, (current) =>
      mutateResumo(current, (data) => ({
        ...data,
        metas: [...data.metas, optimisticMeta],
      })),
    )

    metaMutation.mutate({
      titulo: optimisticMeta.titulo,
      valorObjetivo: optimisticMeta.valorObjetivo,
      valorGuardado: optimisticMeta.valorGuardado,
      responsavel: optimisticMeta.responsavel,
      ehReservaEmergencia: optimisticMeta.ehReservaEmergencia,
    })
  }

  const handleSalvarDesejo = () => {
    setErroDesejo('')

    if (!novoDesejo.titulo.trim()) {
      setErroDesejo('Informe o titulo.')
      return
    }

    const dataFinal = novoDesejo.dataAlvo
      ? new Date(`${novoDesejo.dataAlvo}T12:00:00`).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const optimisticDesejo: Desejo = {
      id: -Date.now(),
      titulo: novoDesejo.titulo.trim(),
      icone: novoDesejo.icone || '*',
      dataAlvo: dataFinal,
      concluido: false,
    }

    queryClient.setQueryData<DashboardResumo | undefined>(DASHBOARD_QUERY_KEY, (current) =>
      mutateResumo(current, (data) => ({
        ...data,
        desejos: [...data.desejos, optimisticDesejo],
      })),
    )

    desejoMutation.mutate({
      titulo: optimisticDesejo.titulo,
      icone: optimisticDesejo.icone,
      dataAlvo: optimisticDesejo.dataAlvo,
      concluido: optimisticDesejo.concluido,
    })
  }

  const abrirModalAporte = (meta: Meta) => {
    setMetaSelecionada(meta)
    setValorAporte('')
    setErroAporte('')
    setModalAporte(true)
  }

  const abrirModalMeta = () => {
    setModoMeta('meta')
    setNovaMeta(FORM_META_VAZIO)
    setErroMeta('')
    setModalMeta(true)
  }

  const abrirModalReserva = () => {
    setModoMeta('reserva')
    setNovaMeta({
      ...FORM_META_VAZIO,
      titulo: 'Reserva de Emergência',
      valorObjetivo: objetivoIdealReserva > 0 ? String(Math.round(objetivoIdealReserva)) : '',
      ehReservaEmergencia: true,
    })
    setErroMeta('')
    setModalMeta(true)
  }

  const handleSalvarAporte = () => {
    setErroAporte('')

    if (!metaSelecionada) {
      setErroAporte('Selecione uma meta.')
      return
    }

    const valor = Number(valorAporte)
    if (valor <= 0) {
      setErroAporte('Informe um valor maior que zero.')
      return
    }

    aporteMutation.mutate({ id: metaSelecionada.id, valor })
  }

  if (isLoading) return <SkeletonDashboard />

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10 tracking-tight animate-fade-up">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.14),_transparent_58%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <Badge label={`Radar ${new Date().toLocaleDateString('pt-BR', { month: 'long' })}`} color="indigo" />
            <h2 className="mt-4 text-3xl font-black uppercase italic tracking-tighter text-slate-950 md:text-4xl">
              Painel do casal
            </h2>
            <p className="mt-3 text-sm font-bold text-slate-500">
              {destaquePrincipal}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:min-w-[430px]">
            <InsightCard title="Score" value={`${scoreFinanceiro}`} detail={acaoRecomendada} tone={scoreFinanceiro >= 75 ? 'green' : scoreFinanceiro >= 55 ? 'indigo' : 'amber'} icon={<Sparkles size={18} />} />
            <InsightCard title="Saldo mês" value={fmt(saldoMes)} detail={categoriaTopMes.nome} tone={saldoMes >= 0 ? 'green' : 'amber'} icon={<PiggyBank size={18} />} />
            <InsightCard title="Sobra" value={`${taxaPoupanca}%`} detail="Taxa de preservação" tone={taxaPoupanca >= 20 ? 'green' : taxaPoupanca > 0 ? 'indigo' : 'amber'} icon={<TrendingUp size={18} />} />
            <InsightCard title="Metas" value={`${progressoMetas}%`} detail={`${metasConcluidas} concluídas`} tone="pink" icon={<Target size={18} />} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Patrimônio" value={fmt(totalJuntos)} color="indigo" sub="Casal" />
        <StatCard label="Entradas" value={fmt(entradasMes)} color="green" sub="Mês atual" />
        <StatCard label="Maior categoria" value={categoriaTopMes.nome} color="amber" sub={categoriaTopMes.total > 0 ? fmt(categoriaTopMes.total) : 'Sem destaque'} />
        <StatCard label="Reserva" value={fmt(reservaEmergencia?.valorGuardado ?? 0)} color="pink" sub={reservaEmergencia ? `${coberturaReservaMeses.toFixed(1)} meses de cobertura` : `${bucketsAbertos} buckets abertos`} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Radar automático</p>
            <h3 className="text-lg font-black uppercase italic tracking-tight text-slate-950">Alertas inteligentes</h3>
          </div>
          <Badge label={`${alertasInteligentes.length} sinais`} color={alertasInteligentes.some((alerta) => alerta.tone === 'rose') ? 'red' : 'amber'} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {alertasInteligentes.map((alerta) => (
            <AlertCard
              key={alerta.id}
              title={alerta.title}
              message={alerta.message}
              tone={alerta.tone}
            />
          ))}
        </div>
      </section>

      <div className="flex w-fit rounded-2xl border border-slate-200 bg-slate-100 p-1.5 shadow-inner">
        {(['metas', 'reserva', 'buckets', 'evolucao', 'backup', 'rotina'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setAba(tab)}
            className={`rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
              aba === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="min-h-[450px]">
        {aba === 'metas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black uppercase italic text-slate-900">
                <Target className="text-indigo-600" size={20} /> Objetivos Financeiros
              </h3>
              <Btn onClick={abrirModalMeta} className="bg-indigo-600">
                <Plus size={16} className="mr-1 inline" /> Nova Meta
              </Btn>
            </div>

            {metas.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-slate-400">
                <Target size={32} className="mb-2 opacity-30" />
                <p className="text-sm font-bold">Nenhuma meta cadastrada</p>
                <p className="text-xs">Clique em "Nova Meta" para comecar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {metas.map((meta) => {
                  const percentual = meta.valorObjetivo > 0
                    ? Math.round((meta.valorGuardado / meta.valorObjetivo) * 100)
                    : 0
                  const restante = Math.max(meta.valorObjetivo - meta.valorGuardado, 0)
                  const concluida = restante <= 0

                  return (
                    <Card key={meta.id} className="group relative p-6 transition-all hover:border-indigo-300">
                      <button
                        onClick={() => confirm('Remover esta meta?') && deleteMetaMutation.mutate(meta.id)}
                        disabled={deleteMetaMutation.isPending}
                        className="absolute right-3 top-3 text-slate-400 opacity-0 transition-all hover:text-red-500 disabled:opacity-30 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="mb-3 flex items-start justify-between gap-3 pr-6">
                        <div>
                          <h4 className="mb-1 text-sm font-black uppercase italic tracking-tight text-slate-950">
                            {meta.titulo}
                          </h4>
                          <p className="text-[10px] font-bold uppercase text-slate-400">{meta.responsavel}</p>
                        </div>
                        <Badge label={concluida ? 'Concluida' : 'Em progresso'} color={concluida ? 'green' : 'indigo'} />
                      </div>
                      <ProgressBar value={meta.valorGuardado} max={meta.valorObjetivo} color={concluida ? '#10b981' : '#6366f1'} />
                      <div className="mt-3 flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-500">{fmt(meta.valorGuardado)} / {fmt(meta.valorObjetivo)}</span>
                        <span className={concluida ? 'text-emerald-700' : 'text-indigo-700'}>
                          {percentual}%
                        </span>
                      </div>
                      <p className="mt-3 text-[11px] font-bold text-slate-500">
                        {concluida ? 'Meta batida. Agora e so curtir a conquista.' : `Faltam ${fmt(restante)} para concluir.`}
                      </p>
                      <Btn
                        onClick={() => abrirModalAporte(meta)}
                        disabled={concluida || aporteMutation.isPending}
                        className={`mt-4 w-full py-3 ${concluida ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                      >
                        <DollarSign size={14} className="mr-1 inline" />
                        {concluida ? 'Meta Concluida' : 'Adicionar Dinheiro'}
                      </Btn>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {aba === 'reserva' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black uppercase italic text-slate-900">
                <Shield className="text-emerald-600" size={20} /> Reserva de Emergência
              </h3>
              {reservaEmergencia ? (
                <Btn onClick={() => abrirModalAporte(reservaEmergencia)} className="bg-emerald-600">
                  <DollarSign size={14} className="mr-1 inline" /> Novo aporte
                </Btn>
              ) : (
                <Btn onClick={abrirModalReserva} className="bg-emerald-600">
                  <Plus size={14} className="mr-1 inline" /> Criar reserva
                </Btn>
              )}
            </div>

            {!reservaEmergencia ? (
              <Card className="overflow-hidden border-emerald-100 p-0">
                <div className="grid gap-0 lg:grid-cols-[1.3fr_0.9fr]">
                  <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8">
                    <Badge label="Proteção financeira" color="green" />
                    <h4 className="mt-4 text-3xl font-black uppercase italic tracking-tight text-slate-950">
                      Criem a reserva do casal
                    </h4>
                    <p className="mt-3 max-w-xl text-sm font-bold leading-relaxed text-slate-500">
                      A reserva de emergência funciona como colchão de segurança para imprevistos, saúde, trabalho e despesas essenciais.
                    </p>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gasto base</p>
                        <p className="mt-2 text-xl font-black text-slate-950">{fmt(mediaSaidasRecentes)}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">Média recente de saídas</p>
                      </div>
                      <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta ideal</p>
                        <p className="mt-2 text-xl font-black text-emerald-700">{fmt(objetivoIdealReserva)}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">Sugestão para 6 meses</p>
                      </div>
                      <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estratégia</p>
                        <p className="mt-2 text-xl font-black text-slate-950">6 meses</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">Ideal para estabilidade</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between border-l border-emerald-100 bg-slate-950 p-8 text-white">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Próximo passo</p>
                      <h4 className="mt-3 text-2xl font-black uppercase italic tracking-tight">
                        Montar a rede de segurança
                      </h4>
                      <p className="mt-3 text-sm font-bold leading-relaxed text-slate-300">
                        Já deixei a sugestão pronta com base no ritmo recente de gastos. Vocês podem criar e começar a aportar aos poucos.
                      </p>
                    </div>

                    <Btn onClick={abrirModalReserva} className="mt-8 bg-emerald-600 py-3 hover:bg-emerald-700">
                      <Plus size={14} className="mr-1 inline" /> Criar reserva recomendada
                    </Btn>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
                <Card className="overflow-hidden border-emerald-100 p-0">
                  <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <Badge label="Proteção ativa" color="green" />
                        <h4 className="mt-4 text-3xl font-black uppercase italic tracking-tight text-slate-950">
                          {reservaEmergencia.titulo}
                        </h4>
                        <p className="mt-3 max-w-xl text-sm font-bold leading-relaxed text-slate-500">
                          Uma reserva forte reduz pressão em meses apertados e evita quebrar outras metas quando surgir um imprevisto.
                        </p>
                      </div>

                      <button
                        onClick={() => confirm('Remover a reserva de emergência?') && deleteMetaMutation.mutate(reservaEmergencia.id)}
                        disabled={deleteMetaMutation.isPending}
                        className="rounded-2xl border border-rose-100 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-rose-500 transition hover:bg-rose-50 disabled:opacity-40"
                      >
                        <Trash2 size={14} className="mr-1 inline" /> Remover
                      </button>
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                      <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Guardado</p>
                        <p className="mt-3 text-3xl font-black tracking-tight text-emerald-700">{fmt(reservaEmergencia.valorGuardado)}</p>
                        <p className="mt-2 text-xs font-bold text-slate-500">Valor já protegido</p>
                      </div>
                      <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cobertura</p>
                        <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{coberturaReservaMeses.toFixed(1)} meses</p>
                        <p className="mt-2 text-xs font-bold text-slate-500">Base nas saídas recentes</p>
                      </div>
                      <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Falta p/ ideal</p>
                        <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{fmt(faltanteReservaIdeal)}</p>
                        <p className="mt-2 text-xs font-bold text-slate-500">Para chegar em 6 meses</p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-[28px] border border-emerald-100 bg-white/90 p-5 shadow-sm">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progresso da reserva</p>
                        <Badge label={`${Math.round((reservaEmergencia.valorGuardado / Math.max(reservaEmergencia.valorObjetivo, 1)) * 100)}%`} color="green" />
                      </div>
                      <ProgressBar value={reservaEmergencia.valorGuardado} max={reservaEmergencia.valorObjetivo} color="#10b981" />
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] font-black text-slate-500">
                        <span>{fmt(reservaEmergencia.valorGuardado)} de {fmt(reservaEmergencia.valorObjetivo)}</span>
                        <span>Meta estratégica atual</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="space-y-6">
                  <Card className="p-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plano recomendado</p>
                    <h4 className="mt-3 text-lg font-black uppercase italic tracking-tight text-slate-950">
                      Como fortalecer a reserva
                    </h4>
                    <div className="mt-5 space-y-3">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Aporte sugerido</p>
                        <p className="mt-2 text-xl font-black text-emerald-700">{fmt(Math.max(faltanteReservaIdeal / 6, 0))}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">Para acelerar nos próximos 6 meses</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Alvo ideal</p>
                        <p className="mt-2 text-xl font-black text-slate-950">{fmt(objetivoIdealReserva)}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">Baseado nas saídas médias recentes</p>
                      </div>
                    </div>
                    <Btn onClick={() => abrirModalAporte(reservaEmergencia)} className="mt-5 w-full bg-emerald-600 py-3 hover:bg-emerald-700">
                      <DollarSign size={14} className="mr-1 inline" /> Adicionar à reserva
                    </Btn>
                  </Card>

                  <Card className="p-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leitura rápida</p>
                    <div className="mt-4 space-y-3 text-sm font-bold text-slate-600">
                      <p>Se a renda apertar, a reserva segura em média <span className="text-slate-950">{coberturaReservaMeses.toFixed(1)} meses</span> do padrão recente.</p>
                      <p>Hoje vocês têm <span className="text-slate-950">{fmt(reservaEmergencia.valorGuardado)}</span> protegidos fora das metas de sonho.</p>
                      <p>Para atingir o patamar ideal, faltam <span className="text-slate-950">{fmt(faltanteReservaIdeal)}</span>.</p>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}

        {aba === 'buckets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black uppercase italic text-slate-900">
                <ShoppingBag className="text-indigo-600" size={20} /> Wishlist & Sonhos
              </h3>
              <Btn onClick={() => { setErroDesejo(''); setModalDesejo(true) }} className="bg-slate-900">
                <Plus size={14} className="mr-1 inline" /> Novo Desejo
              </Btn>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {desejos.map((desejo: Desejo) => (
                <Card key={desejo.id} className="group relative overflow-hidden p-0 transition-all hover:border-indigo-300">
                  <button
                    onClick={() => confirm('Remover?') && deleteDesejoMutation.mutate(desejo.id)}
                    disabled={deleteDesejoMutation.isPending}
                    className="absolute right-2 top-2 z-10 rounded-lg bg-white p-1.5 text-slate-400 opacity-0 shadow-sm transition-all hover:text-red-500 disabled:opacity-30 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="flex justify-center border-b border-slate-100 bg-slate-50 p-8">
                    <span className="text-5xl transition-transform duration-300 group-hover:scale-110">
                      {desejo.icone || '*'}
                    </span>
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-black uppercase leading-tight tracking-tight text-slate-950">
                        {desejo.titulo}
                      </h4>
                      <Badge label={desejo.concluido ? 'Pronto' : 'Fila'} color={desejo.concluido ? 'green' : 'indigo'} />
                    </div>
                    <p className="text-[9px] font-bold uppercase italic text-slate-400">
                      <Sparkles size={10} className="mr-1 inline text-amber-500" />
                      {new Date(desejo.dataAlvo).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </Card>
              ))}

              <button
                onClick={() => { setErroDesejo(''); setModalDesejo(true) }}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-slate-400 transition-all hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-600"
              >
                <div className="rounded-full bg-white p-3 shadow-sm"><Plus size={22} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Sonho</span>
              </button>
            </div>
          </div>
        )}

        {aba === 'backup' && (
          <div className="space-y-6">
            <Card className="overflow-hidden border-slate-200 p-0">
              <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 text-white">
                  <Badge label="Segurança local" color="green" />
                  <h3 className="mt-4 text-3xl font-black uppercase italic tracking-tight">
                    Backup e restauração
                  </h3>
                  <p className="mt-3 max-w-lg text-sm font-bold leading-relaxed text-slate-300">
                    Gere um backup completo do app local e restaure quando precisar migrar de computador ou recuperar os dados.
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Formato</p>
                      <p className="mt-2 text-xl font-black">JSON completo</p>
                      <p className="mt-2 text-xs font-bold text-slate-300">Transações, metas, desejos, reserva e checklist</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recomendação</p>
                      <p className="mt-2 text-xl font-black">1 vez por mês</p>
                      <p className="mt-2 text-xs font-bold text-slate-300">Ideal antes de trocar de PC ou fazer mudanças grandes</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 p-8">
                  <Card className="p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Backup</p>
                    <h4 className="mt-3 text-lg font-black uppercase italic tracking-tight text-slate-950">Exportar dados atuais</h4>
                    <p className="mt-2 text-sm font-bold text-slate-500">Baixa um arquivo com toda a base local para guardar ou transferir.</p>
                    <Btn onClick={() => backupMutation.mutate()} disabled={backupMutation.isPending} className="mt-4 w-full bg-indigo-600 py-3">
                      <Download size={14} className="mr-1 inline" />
                      {backupMutation.isPending ? 'Gerando...' : 'Baixar backup'}
                    </Btn>
                  </Card>

                  <Card className="p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Restauração</p>
                    <h4 className="mt-3 text-lg font-black uppercase italic tracking-tight text-slate-950">Importar backup</h4>
                    <p className="mt-2 text-sm font-bold text-slate-500">Substitui os dados atuais do app pelos dados do arquivo escolhido.</p>
                    <input id="restore-backup-input" type="file" accept=".json,application/json" onChange={handleRestoreBackup} className="hidden" />
                    <Btn onClick={() => document.getElementById('restore-backup-input')?.click()} disabled={restoreMutation.isPending} className="mt-4 w-full bg-slate-900 py-3">
                      <Upload size={14} className="mr-1 inline" />
                      {restoreMutation.isPending ? 'Restaurando...' : 'Selecionar backup'}
                    </Btn>
                  </Card>
                </div>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Backup" value={statusRotina ? 'OK' : 'Pendente'} color="green" sub="Faça uma cópia mensal" />
              <StatCard label="Formato" value="JSON" color="indigo" sub="Portável entre computadores" />
              <StatCard label="Proteção" value="Local" color="amber" sub="Restauração pronta" />
            </div>
 
            {(erroRotina || statusRotina) && (
              <Card className={`p-4 ${erroRotina ? 'border-rose-100 bg-rose-50' : 'border-emerald-100 bg-emerald-50'}`}>
                <div className="flex items-center gap-3">
                  <ClipboardList size={16} className={erroRotina ? 'text-rose-500' : 'text-emerald-600'} />
                  <p className={`text-sm font-bold ${erroRotina ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {erroRotina || statusRotina}
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {aba === 'rotina' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Checklist mensal</p>
                  <h3 className="mt-2 text-lg font-black uppercase italic tracking-tight text-slate-950">
                    Rotina financeira de {new Date(`${mesChecklist}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </h3>
                </div>
                <Badge label={`${progressoChecklist}%`} color={progressoChecklist >= 100 ? 'green' : 'indigo'} />
              </div>

              <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progresso do mês</p>
                  <span className="text-xs font-black text-slate-500">{checklistConcluidos}/{checklist.length} concluídos</span>
                </div>
                <ProgressBar value={checklistConcluidos} max={Math.max(checklist.length, 1)} color="#6366f1" />
              </div>

              <div className="mt-5 flex gap-3">
                <Input label="Nova tarefa" value={novoItemChecklist} onChange={setNovoItemChecklist} placeholder="Ex: revisar assinaturas do mês" />
                <Btn onClick={handleAdicionarChecklist} disabled={addChecklistMutation.isPending} className="mt-[22px] bg-indigo-600">
                  <Plus size={14} className="mr-1 inline" /> Adicionar
                </Btn>
              </div>

              <div className="mt-5 space-y-3">
                {checklist.map((item) => (
                  <div key={item.id} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${item.concluido ? 'border-emerald-100 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                    <button
                      onClick={() => handleToggleChecklist(item)}
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-all ${item.concluido ? 'border-emerald-200 bg-emerald-500 text-white' : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'}`}
                    >
                      <CheckCheck size={16} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-black tracking-tight ${item.concluido ? 'text-emerald-800 line-through' : 'text-slate-900'}`}>
                        {item.titulo}
                      </p>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        {item.concluido ? 'Concluído' : 'Pendente'}
                      </p>
                    </div>
                    <button
                      onClick={() => confirm('Remover essa tarefa do checklist?') && deleteChecklistMutation.mutate(item.id)}
                      className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 transition hover:bg-rose-50"
                    >
                      <Trash2 size={12} className="mr-1 inline" /> Remover
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Btn onClick={() => resetChecklistMutation.mutate()} disabled={resetChecklistMutation.isPending} variant="ghost" className="bg-slate-100">
                  <RotateCcw size={14} className="mr-1 inline" />
                  {resetChecklistMutation.isPending ? 'Recriando...' : 'Recriar checklist'}
                </Btn>
                <Badge label={progressoChecklist >= 100 ? 'Mês em dia' : 'Rotina ativa'} color={progressoChecklist >= 100 ? 'green' : 'amber'} />
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Checklist" value={`${checklistConcluidos}/${checklist.length || 0}`} color="indigo" sub="Itens concluídos" />
              <StatCard label="Progresso" value={`${progressoChecklist}%`} color="green" sub="Execução do mês" />
              <StatCard label="Rotina" value={progressoChecklist >= 100 ? 'Em dia' : 'Ativa'} color="amber" sub="Acompanhamento mensal" />
            </div>

            {(erroRotina || statusRotina) && (
              <Card className={`p-4 ${erroRotina ? 'border-rose-100 bg-rose-50' : 'border-emerald-100 bg-emerald-50'}`}>
                <div className="flex items-center gap-3">
                  <ClipboardList size={16} className={erroRotina ? 'text-rose-500' : 'text-emerald-600'} />
                  <p className={`text-sm font-bold ${erroRotina ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {erroRotina || statusRotina}
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {aba === 'evolucao' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <FluxoCard
                titulo="Diogo"
                icon={<Briefcase size={20} />}
                iconWrap="border-indigo-100 bg-indigo-50"
                iconColor="text-indigo-600"
                transacoes={resumo?.transacoesEu ?? []}
              />

              <FluxoCard
                titulo="Beatriz"
                icon={<Wallet size={20} />}
                iconWrap="border-pink-100 bg-pink-50"
                iconColor="text-pink-600"
                transacoes={resumo?.transacoesDela ?? []}
              />
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.5fr_1fr]">
              <Card className="p-6">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Histórico visual</p>
                    <h3 className="text-lg font-black uppercase italic text-slate-950">Evolução mensal do casal</h3>
                  </div>
                  <Badge label="12 meses" color="indigo" />
                </div>

                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolucaoMensal}>
                      <defs>
                        <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(value) => `R$${Math.round(value / 1000)}k`} />
                      <Tooltip formatter={(value: number) => fmt(Number(value))} contentStyle={{ borderRadius: 16, borderColor: '#e2e8f0' }} />
                      <Area type="monotone" dataKey="entradas" stroke="#10b981" fill="transparent" strokeWidth={2} />
                      <Area type="monotone" dataKey="saidas" stroke="#f43f5e" fill="transparent" strokeWidth={2} />
                      <Area type="monotone" dataKey="saldo" stroke="#6366f1" fill="url(#saldoFill)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Composição</p>
                    <h3 className="text-lg font-black uppercase italic text-slate-950">Saídas por categoria</h3>
                  </div>
                  <Badge label={`${categoriasChart.length} grupos`} color="pink" />
                </div>

                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoriasChart} dataKey="value" nameKey="name" innerRadius={62} outerRadius={94} paddingAngle={3}>
                        {categoriasChart.map((entry, index) => (
                          <Cell key={entry.name} fill={entry.color ?? CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => fmt(Number(value))} contentStyle={{ borderRadius: 16, borderColor: '#e2e8f0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {categoriasChart.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-black uppercase text-slate-700">{item.name}</span>
                      </div>
                      <span className="text-xs font-black text-slate-500">{fmt(item.value)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comparativo</p>
                  <h3 className="text-lg font-black uppercase italic text-slate-950">Diogo x Beatriz por mês</h3>
                </div>
                <Badge label="Saldos individuais" color="amber" />
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evolucaoMensal} barGap={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="mes" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(value) => `R$${Math.round(value / 1000)}k`} />
                    <Tooltip formatter={(value: number) => fmt(Number(value))} contentStyle={{ borderRadius: 16, borderColor: '#e2e8f0' }} />
                    <Bar dataKey="diogo" name="Diogo" radius={[10, 10, 0, 0]} fill="#6366f1" />
                    <Bar dataKey="beatriz" name="Beatriz" radius={[10, 10, 0, 0]} fill="#ec4899" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}
      </div>

      <Modal
        open={modalMeta}
        onClose={() => {
          setModalMeta(false)
          setModoMeta('meta')
        }}
        title={modoMeta === 'reserva' ? 'Nova Reserva de Emergência' : 'Nova Meta de Casal'}
      >
        <div className="space-y-4 py-2">
          <Input label={modoMeta === 'reserva' ? 'Nome da reserva' : 'Titulo da Meta'} value={novaMeta.titulo} onChange={(value) => setNovaMeta({ ...novaMeta, titulo: value })} placeholder={modoMeta === 'reserva' ? 'Ex: Reserva do casal' : 'Ex: Viagem para Europa'} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={modoMeta === 'reserva' ? 'Valor ideal (R$)' : 'Valor Alvo (R$)'} type="number" value={novaMeta.valorObjetivo} onChange={(value) => setNovaMeta({ ...novaMeta, valorObjetivo: value })} placeholder="10000" />
            <Input label="Ja Guardado (R$)" type="number" value={novaMeta.valorGuardado} onChange={(value) => setNovaMeta({ ...novaMeta, valorGuardado: value })} placeholder="0" />
          </div>

          {modoMeta === 'reserva' && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
              Sugestão atual: {fmt(objetivoIdealReserva)} para cobrir cerca de 6 meses do padrão recente de saídas.
            </div>
          )}

          {erroMeta && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">{erroMeta}</p>}

          <Btn onClick={handleSalvarMeta} disabled={metaMutation.isPending} className="w-full bg-indigo-600 py-3">
            {metaMutation.isPending ? 'Salvando...' : modoMeta === 'reserva' ? 'Salvar Reserva' : 'Salvar Meta'}
          </Btn>
        </div>
      </Modal>

      <Modal open={modalAporte} onClose={() => setModalAporte(false)} title={metaSelecionada ? `Aportar em ${metaSelecionada.titulo}` : 'Adicionar Dinheiro'}>
        <div className="space-y-4 py-2">
          {metaSelecionada && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-black uppercase tracking-widest text-[10px] text-emerald-700">Resumo da meta</p>
              <p className="mt-2 font-bold">Guardado: {fmt(metaSelecionada.valorGuardado)}</p>
              <p className="font-bold">Objetivo: {fmt(metaSelecionada.valorObjetivo)}</p>
              <p className="font-bold">Falta: {fmt(Math.max(metaSelecionada.valorObjetivo - metaSelecionada.valorGuardado, 0))}</p>
            </div>
          )}

          <Input
            label="Valor do aporte (R$)"
            type="number"
            value={valorAporte}
            onChange={setValorAporte}
            placeholder="250"
          />

          {erroAporte && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">{erroAporte}</p>}

          <Btn onClick={handleSalvarAporte} disabled={aporteMutation.isPending} className="w-full bg-emerald-600 py-3">
            {aporteMutation.isPending ? 'Registrando...' : 'Adicionar Dinheiro'}
          </Btn>
        </div>
      </Modal>

      <Modal open={modalDesejo} onClose={() => setModalDesejo(false)} title="Novo Sonho / Bucket">
        <div className="space-y-4 py-2">
          <Input label="O que querem conquistar?" value={novoDesejo.titulo} onChange={(value) => setNovoDesejo({ ...novoDesejo, titulo: value })} placeholder="Ex: Viagem para Gramado" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Icone (Emoji)" value={novoDesejo.icone} onChange={(value) => setNovoDesejo({ ...novoDesejo, icone: value })} placeholder="*" />
            <Input label="Data Estimada" type="date" value={novoDesejo.dataAlvo} onChange={(value) => setNovoDesejo({ ...novoDesejo, dataAlvo: value })} />
          </div>

          {erroDesejo && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">{erroDesejo}</p>}

          <Btn onClick={handleSalvarDesejo} disabled={desejoMutation.isPending} className="w-full bg-slate-900 py-3">
            {desejoMutation.isPending ? 'Salvando...' : 'Salvar Desejo'}
          </Btn>
        </div>
      </Modal>
    </div>
  )
}



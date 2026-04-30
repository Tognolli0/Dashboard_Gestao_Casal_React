import { memo, useMemo } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Briefcase, TrendingUp, Wallet } from 'lucide-react'
import { Badge, Card, fmt } from './ui'
import type { DashboardCategoriaChartItem, DashboardEvolucaoItem, DashboardFluxoResumo } from '../types/models'

const FluxoCard = memo(function FluxoCard({
  titulo,
  icon,
  iconWrap,
  iconColor,
  resumo,
}: {
  titulo: string
  icon: React.ReactNode
  iconWrap: string
  iconColor: string
  resumo: DashboardFluxoResumo
}) {
  const { entradas, saidas, saldo } = resumo

  return (
    <Card className="border-slate-200 p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entradas</p>
          <p className="mt-2 text-lg font-black text-emerald-600">{fmt(entradas)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saídas</p>
          <p className="mt-2 text-lg font-black text-rose-600">{fmt(saidas)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saldo</p>
          <p className={`mt-2 text-lg font-black ${saldo >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>{fmt(saldo)}</p>
        </div>
      </div>
    </Card>
  )
})

function buildCategoriaPalette(items: DashboardCategoriaChartItem[]) {
  const topItems = items.slice(0, 5)
  const restValue = items.slice(5).reduce((sum, item) => sum + item.value, 0)

  if (restValue <= 0) {
    return topItems
  }

  return topItems.concat({
    name: 'Outros',
    value: restValue,
    color: '#94a3b8',
  })
}

function monthLabel(value: string) {
  return value.length > 3 ? value.slice(0, 3) : value
}

function compactCurrency(value: number) {
  if (Math.abs(value) < 1000) return `R$${Math.round(value)}`
  return `R$${Math.round(value / 1000)}k`
}

function EvolutionSection({
  fluxoEu,
  fluxoDela,
  evolucaoMensal,
  categoriasChart,
}: {
  fluxoEu: DashboardFluxoResumo
  fluxoDela: DashboardFluxoResumo
  evolucaoMensal: DashboardEvolucaoItem[]
  categoriasChart: DashboardCategoriaChartItem[]
}) {
  const chartMensal = useMemo(
    () => evolucaoMensal.map((item) => ({ ...item, mesCurto: monthLabel(item.mes) })),
    [evolucaoMensal],
  )

  const chartCategorias = useMemo(
    () => buildCategoriaPalette(categoriasChart),
    [categoriasChart],
  )

  const melhorSaldo = useMemo(() => {
    if (chartMensal.length === 0) return null
    return chartMensal.reduce((best, item) => (item.saldo > best.saldo ? item : best), chartMensal[0])
  }, [chartMensal])

  const mediaSaldo = useMemo(() => {
    if (chartMensal.length === 0) return 0
    return chartMensal.reduce((sum, item) => sum + item.saldo, 0) / chartMensal.length
  }, [chartMensal])

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <FluxoCard
          titulo="Diogo"
          icon={<Briefcase size={20} />}
          iconWrap="border-indigo-100 bg-indigo-50"
          iconColor="text-indigo-600"
          resumo={fluxoEu}
        />

        <FluxoCard
          titulo="Beatriz"
          icon={<Wallet size={20} />}
          iconWrap="border-pink-100 bg-pink-50"
          iconColor="text-pink-600"
          resumo={fluxoDela}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Melhor mês</p>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">{melhorSaldo?.mes ?? 'Sem dados'}</p>
          <p className="mt-2 text-xs font-bold text-slate-500">
            {melhorSaldo ? `${fmt(melhorSaldo.saldo)} de saldo acumulado.` : 'Ainda não há histórico suficiente.'}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Média de saldo</p>
          <p className={`mt-3 text-2xl font-black tracking-tight ${mediaSaldo >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>
            {fmt(mediaSaldo)}
          </p>
          <p className="mt-2 text-xs font-bold text-slate-500">Leitura mensal média do comportamento do casal.</p>
        </Card>
        <Card className="p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categorias ativas</p>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">{chartCategorias.length}</p>
          <p className="mt-2 text-xs font-bold text-slate-500">Resumo visual concentrado nas categorias mais relevantes.</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.45fr_0.95fr]">
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Histórico visual</p>
              <h3 className="text-lg font-black uppercase italic text-slate-950">Evolução mensal do casal</h3>
            </div>
            <Badge label={`${chartMensal.length} meses`} color="indigo" />
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartMensal}>
                <defs>
                  <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mesCurto" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={compactCurrency} />
                <Tooltip formatter={(value: number) => fmt(Number(value))} contentStyle={{ borderRadius: 16, borderColor: '#e2e8f0' }} />
                <Area isAnimationActive={false} type="monotone" dataKey="entradas" stroke="#10b981" fill="transparent" strokeWidth={2} />
                <Area isAnimationActive={false} type="monotone" dataKey="saidas" stroke="#f43f5e" fill="transparent" strokeWidth={2} />
                <Area isAnimationActive={false} type="monotone" dataKey="saldo" stroke="#6366f1" fill="url(#saldoFill)" strokeWidth={3} />
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
            <Badge label={`${chartCategorias.length} grupos`} color="pink" />
          </div>

          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={chartCategorias}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {chartCategorias.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => fmt(Number(value))} contentStyle={{ borderRadius: 16, borderColor: '#e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {chartCategorias.map((item) => (
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

        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartMensal} barGap={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mesCurto" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={compactCurrency} />
              <Tooltip formatter={(value: number) => fmt(Number(value))} contentStyle={{ borderRadius: 16, borderColor: '#e2e8f0' }} />
              <Bar isAnimationActive={false} dataKey="diogo" name="Diogo" radius={[10, 10, 0, 0]} fill="#6366f1" />
              <Bar isAnimationActive={false} dataKey="beatriz" name="Beatriz" radius={[10, 10, 0, 0]} fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

export default memo(EvolutionSection)

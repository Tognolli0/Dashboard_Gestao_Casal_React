import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Briefcase, Wallet } from 'lucide-react'
import { Badge, Card, fmt } from './ui'
import type { DashboardCategoriaChartItem, DashboardEvolucaoItem, DashboardFluxoResumo } from '../types/models'

function getBarHeight(value: number, max: number) {
  if (value <= 0 || max <= 0) return 14
  const normalized = value / max
  return Math.round(14 + normalized * 150)
}

function FluxoCard({
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
  const escala = Math.max(entradas, saidas, Math.abs(saldo), 1)
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

export default function HomeEvolutionSection({
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
                  {categoriasChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
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
  )
}

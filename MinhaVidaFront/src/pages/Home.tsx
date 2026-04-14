import { useState } from 'react'
import { Briefcase, Heart, Plus, ShoppingBag, Sparkles, Target, Trash2, TrendingUp, Users } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteDesejo, deleteMeta, getDashboardResumo, postDesejo, postMeta } from '../services/api'
import { DASHBOARD_QUERY_KEY } from '../lib/queryClient'
import { Badge, Btn, Card, Input, Modal, ProgressBar, SkeletonDashboard, StatCard, fmt } from '../components/ui'
import type { Desejo } from '../types/models'

const FORM_META_VAZIO = { titulo: '', valorObjetivo: '', valorGuardado: '0', responsavel: 'Casal' }
const FORM_DESEJO_VAZIO = { titulo: '', dataAlvo: '', icone: '*' }

export default function Home() {
  const queryClient = useQueryClient()
  const [aba, setAba] = useState<'metas' | 'buckets' | 'evolucao'>('metas')
  const [modalMeta, setModalMeta] = useState(false)
  const [modalDesejo, setModalDesejo] = useState(false)
  const [novaMeta, setNovaMeta] = useState(FORM_META_VAZIO)
  const [novoDesejo, setNovoDesejo] = useState(FORM_DESEJO_VAZIO)
  const [erroMeta, setErroMeta] = useState('')
  const [erroDesejo, setErroDesejo] = useState('')

  const { data: resumo, isLoading } = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: getDashboardResumo,
  })

  const metas = resumo?.metas ?? []
  const desejos = resumo?.desejos ?? []

  const metaMutation = useMutation({
    mutationFn: postMeta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY })
      setModalMeta(false)
      setNovaMeta(FORM_META_VAZIO)
      setErroMeta('')
    },
    onError: (error: any) => setErroMeta(error?.response?.data ?? 'Erro ao salvar meta.'),
  })

  const deleteMetaMutation = useMutation({
    mutationFn: deleteMeta,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY }),
  })

  const desejoMutation = useMutation({
    mutationFn: postDesejo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY })
      setModalDesejo(false)
      setNovoDesejo(FORM_DESEJO_VAZIO)
      setErroDesejo('')
    },
    onError: (error: any) => setErroDesejo(error?.response?.data ?? 'Erro ao salvar desejo.'),
  })

  const deleteDesejoMutation = useMutation({
    mutationFn: deleteDesejo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY }),
  })

  const totalEu = resumo?.transacoesEu?.reduce((acc, transaction) => acc + transaction.valor, 0) ?? 0
  const totalBia = resumo?.transacoesDela?.reduce((acc, transaction) => acc + transaction.valor, 0) ?? 0
  const totalJuntos = totalEu + totalBia

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

    metaMutation.mutate({
      titulo: novaMeta.titulo.trim(),
      valorObjetivo: Number(novaMeta.valorObjetivo),
      valorGuardado: Number(novaMeta.valorGuardado) || 0,
      responsavel: novaMeta.responsavel,
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

    desejoMutation.mutate({
      titulo: novoDesejo.titulo.trim(),
      icone: novoDesejo.icone || '*',
      dataAlvo: dataFinal,
      concluido: false,
    })
  }

  if (isLoading) return <SkeletonDashboard />

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10 tracking-tight animate-fade-up">
      <header className="flex flex-col justify-between gap-6 border-b border-slate-100 pb-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-950">
            Dash<span className="text-indigo-600">board</span>
          </h2>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase italic tracking-widest text-slate-500">
            <Heart size={12} className="text-pink-500" /> Gestao Diogo & Beatriz
          </p>
        </div>

        <div className="flex w-fit rounded-2xl border border-slate-200 bg-slate-100 p-1.5 shadow-inner">
          {(['metas', 'buckets', 'evolucao'] as const).map((tab) => (
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
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 border-l-4 border-l-indigo-600 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <p className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Users size={14} className="text-indigo-500" /> Patrimonio Casal
          </p>
          <p className="text-3xl font-black italic tracking-tighter text-slate-950">{fmt(totalJuntos)}</p>
        </div>
        <StatCard label="Saldo Diogo" value={fmt(totalEu)} color="indigo" />
        <StatCard label="Saldo Beatriz" value={fmt(totalBia)} color="pink" />
      </div>

      <div className="min-h-[450px]">
        {aba === 'metas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black uppercase italic text-slate-900">
                <Target className="text-indigo-600" size={20} /> Objetivos Financeiros
              </h3>
              <Btn onClick={() => { setErroMeta(''); setModalMeta(true) }} className="bg-indigo-600">
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
                {metas.map((meta) => (
                  <Card key={meta.id} className="group relative p-6 transition-all hover:border-indigo-300">
                    <button
                      onClick={() => confirm('Remover esta meta?') && deleteMetaMutation.mutate(meta.id)}
                      disabled={deleteMetaMutation.isPending}
                      className="absolute right-3 top-3 text-slate-400 opacity-0 transition-all hover:text-red-500 disabled:opacity-30 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                    <h4 className="mb-1 pr-6 text-sm font-black uppercase italic tracking-tight text-slate-950">
                      {meta.titulo}
                    </h4>
                    <p className="mb-4 text-[10px] font-bold uppercase text-slate-400">{meta.responsavel}</p>
                    <ProgressBar value={meta.valorGuardado} max={meta.valorObjetivo} color="#6366f1" />
                    <div className="mt-3 flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-500">{fmt(meta.valorGuardado)} / {fmt(meta.valorObjetivo)}</span>
                      <span className="text-indigo-700">
                        {meta.valorObjetivo > 0
                          ? `${Math.round((meta.valorGuardado / meta.valorObjetivo) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                  </Card>
                ))}
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

        {aba === 'evolucao' && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card className="relative overflow-visible p-8">
              <div className="mb-10 flex items-center gap-3 italic">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-2.5">
                  <Briefcase size={20} className="text-indigo-600" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-950">Diogo</h3>
              </div>
              <div className="flex h-48 items-end justify-around gap-8 border-b-2 border-slate-100 px-8 pb-2">
                {[
                  { label: 'Entradas', value: (resumo?.transacoesEu ?? []).filter((t) => t.tipo === 'Entrada').reduce((a, t) => a + t.valor, 0), color: 'bg-emerald-100 border-emerald-500' },
                  { label: 'Saidas', value: (resumo?.transacoesEu ?? []).filter((t) => t.tipo === 'Saída').reduce((a, t) => a + Math.abs(t.valor), 0), color: 'bg-rose-100 border-rose-500' },
                ].map(({ label, value, color }) => {
                  const max = Math.max(
                    (resumo?.transacoesEu ?? []).filter((t) => t.tipo === 'Entrada').reduce((a, t) => a + t.valor, 0),
                    (resumo?.transacoesEu ?? []).filter((t) => t.tipo === 'Saída').reduce((a, t) => a + Math.abs(t.valor), 0),
                    1,
                  )
                  const pct = Math.round((value / max) * 85) + 10
                  return (
                    <div key={label} className="flex flex-1 flex-col items-center gap-2">
                      <span className="text-[9px] font-black text-slate-600">{fmt(value)}</span>
                      <div className={`w-full rounded-t-xl border-2 border-b-0 ${color}`} style={{ height: `${pct}%` }} />
                      <span className="text-[9px] font-black uppercase text-slate-400">{label}</span>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card className="relative overflow-visible p-8">
              <div className="mb-10 flex items-center gap-3 italic">
                <div className="rounded-xl border border-pink-100 bg-pink-50 p-2.5">
                  <TrendingUp size={20} className="text-pink-600" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-950">Beatriz</h3>
              </div>
              <div className="flex h-48 items-end justify-around gap-8 border-b-2 border-slate-100 px-8 pb-2">
                {[
                  { label: 'Entradas', value: (resumo?.transacoesDela ?? []).filter((t) => t.tipo === 'Entrada').reduce((a, t) => a + t.valor, 0), color: 'bg-emerald-100 border-emerald-500' },
                  { label: 'Saidas', value: (resumo?.transacoesDela ?? []).filter((t) => t.tipo === 'Saída').reduce((a, t) => a + Math.abs(t.valor), 0), color: 'bg-rose-100 border-rose-500' },
                ].map(({ label, value, color }) => {
                  const max = Math.max(
                    (resumo?.transacoesDela ?? []).filter((t) => t.tipo === 'Entrada').reduce((a, t) => a + t.valor, 0),
                    (resumo?.transacoesDela ?? []).filter((t) => t.tipo === 'Saída').reduce((a, t) => a + Math.abs(t.valor), 0),
                    1,
                  )
                  const pct = Math.round((value / max) * 85) + 10
                  return (
                    <div key={label} className="flex flex-1 flex-col items-center gap-2">
                      <span className="text-[9px] font-black text-slate-600">{fmt(value)}</span>
                      <div className={`w-full rounded-t-xl border-2 border-b-0 ${color}`} style={{ height: `${pct}%` }} />
                      <span className="text-[9px] font-black uppercase text-slate-400">{label}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}
      </div>

      <Modal open={modalMeta} onClose={() => setModalMeta(false)} title="Nova Meta de Casal">
        <div className="space-y-4 py-2">
          <Input
            label="Titulo da Meta"
            value={novaMeta.titulo}
            onChange={(value) => setNovaMeta({ ...novaMeta, titulo: value })}
            placeholder="Ex: Viagem para Europa"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valor Alvo (R$)"
              type="number"
              value={novaMeta.valorObjetivo}
              onChange={(value) => setNovaMeta({ ...novaMeta, valorObjetivo: value })}
              placeholder="10000"
            />
            <Input
              label="Ja Guardado (R$)"
              type="number"
              value={novaMeta.valorGuardado}
              onChange={(value) => setNovaMeta({ ...novaMeta, valorGuardado: value })}
              placeholder="0"
            />
          </div>

          {erroMeta && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">{erroMeta}</p>}

          <Btn onClick={handleSalvarMeta} disabled={metaMutation.isPending} className="w-full bg-indigo-600 py-3">
            {metaMutation.isPending ? 'Salvando...' : 'Salvar Meta'}
          </Btn>
        </div>
      </Modal>

      <Modal open={modalDesejo} onClose={() => setModalDesejo(false)} title="Novo Sonho / Bucket">
        <div className="space-y-4 py-2">
          <Input
            label="O que querem conquistar?"
            value={novoDesejo.titulo}
            onChange={(value) => setNovoDesejo({ ...novoDesejo, titulo: value })}
            placeholder="Ex: Viagem para Gramado"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Icone (Emoji)"
              value={novoDesejo.icone}
              onChange={(value) => setNovoDesejo({ ...novoDesejo, icone: value })}
              placeholder="*"
            />
            <Input
              label="Data Estimada"
              type="date"
              value={novoDesejo.dataAlvo}
              onChange={(value) => setNovoDesejo({ ...novoDesejo, dataAlvo: value })}
            />
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



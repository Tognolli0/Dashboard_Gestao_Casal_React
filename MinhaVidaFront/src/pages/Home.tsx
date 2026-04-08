import { useState } from 'react'
import { TrendingUp, Target, Plus, Trash2, Users, ShoppingBag, Briefcase, Sparkles, Heart } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getDashboardResumo, getMetas,
    postMeta, deleteMeta,
    postDesejo, deleteDesejo,
} from '../services/api'
import {
    Card, StatCard, Badge, Btn, Input, Modal,
    SkeletonDashboard, fmt, ProgressBar,
} from '../components/ui'
import type { Desejo } from '../types/models'

const FORM_META_VAZIO = { titulo: '', valorObjetivo: '', valorGuardado: '0', responsavel: 'Casal' }
const FORM_DESEJO_VAZIO = { titulo: '', dataAlvo: '', icone: '💎' }

export default function Home() {
    const queryClient = useQueryClient()
    const [aba, setAba] = useState<'metas' | 'buckets' | 'evolucao'>('metas')

    const [modalMeta, setModalMeta] = useState(false)
    const [modalDesejo, setModalDesejo] = useState(false)
    const [novaMeta, setNovaMeta] = useState(FORM_META_VAZIO)
    const [novoDesejo, setNovoDesejo] = useState(FORM_DESEJO_VAZIO)
    const [erroMeta, setErroMeta] = useState('')
    const [erroDesejo, setErroDesejo] = useState('')

    // ── Queries ───────────────────────────────────────────────────────────────
    const { data: resumo, isLoading: loadingResumo } = useQuery({
        queryKey: ['dashboard-resumo'],
        queryFn: getDashboardResumo,
        staleTime: 1000 * 60 * 5,
    })

    const { data: metas = [], isLoading: loadingMetas } = useQuery({
        queryKey: ['metas'],
        queryFn: getMetas,
        staleTime: 1000 * 60 * 5,
    })

    // ── Mutations Metas ───────────────────────────────────────────────────────
    const metaMutation = useMutation({
        mutationFn: postMeta,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['metas'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] })
            setModalMeta(false)
            setNovaMeta(FORM_META_VAZIO)
            setErroMeta('')
        },
        onError: (e: any) => setErroMeta(e?.response?.data ?? 'Erro ao salvar meta.'),
    })

    const deleteMetaMutation = useMutation({
        mutationFn: deleteMeta,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['metas'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] })
        },
    })

    // ── Mutations Desejos ─────────────────────────────────────────────────────
    const desejoMutation = useMutation({
        mutationFn: postDesejo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] })
            setModalDesejo(false)
            setNovoDesejo(FORM_DESEJO_VAZIO)
            setErroDesejo('')
        },
        onError: (e: any) => setErroDesejo(e?.response?.data ?? 'Erro ao salvar desejo.'),
    })

    const deleteDesejoMutation = useMutation({
        mutationFn: deleteDesejo,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] }),
    })

    // ── Cálculos de patrimônio ────────────────────────────────────────────────
    // Valores já vêm com sinal correto do backend (saídas negativas)
    const totalEu = resumo?.transacoesEu?.reduce((acc, t) => acc + t.valor, 0) ?? 0
    const totalBia = resumo?.transacoesDela?.reduce((acc, t) => acc + t.valor, 0) ?? 0
    const totalJuntos = totalEu + totalBia

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleSalvarMeta = () => {
        setErroMeta('')
        if (!novaMeta.titulo.trim()) { setErroMeta('Informe o título.'); return }
        if (Number(novaMeta.valorObjetivo) <= 0) { setErroMeta('Informe um valor objetivo.'); return }

        metaMutation.mutate({
            titulo: novaMeta.titulo.trim(),
            valorObjetivo: Number(novaMeta.valorObjetivo),
            valorGuardado: Number(novaMeta.valorGuardado) || 0,
            responsavel: novaMeta.responsavel,
        })
    }

    const handleSalvarDesejo = () => {
        setErroDesejo('')
        if (!novoDesejo.titulo.trim()) { setErroDesejo('Informe o título.'); return }

        const dataFinal = novoDesejo.dataAlvo
            ? new Date(novoDesejo.dataAlvo + 'T12:00:00').toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        desejoMutation.mutate({
            titulo: novoDesejo.titulo.trim(),
            icone: novoDesejo.icone || '💎',
            dataAlvo: dataFinal,
            concluido: false,
        })
    }

    if (loadingResumo || loadingMetas) return <SkeletonDashboard />

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-up pb-10 tracking-tight">

            {/* HEADER */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase">
                        Dash<span className="text-indigo-600">board</span>
                    </h2>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest italic flex items-center gap-2">
                        <Heart size={12} className="text-pink-500" /> Gestão Diogo & Beatriz
                    </p>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit shadow-inner">
                    {(['metas', 'buckets', 'evolucao'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setAba(t)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${aba === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </header>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 border-l-4 border-l-indigo-600 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest flex items-center gap-2">
                        <Users size={14} className="text-indigo-500" /> Patrimônio Casal
                    </p>
                    <p className="text-3xl font-black text-slate-950 tracking-tighter italic">{fmt(totalJuntos)}</p>
                </div>
                <StatCard label="Saldo Diogo" value={fmt(totalEu)} color="indigo" />
                <StatCard label="Saldo Beatriz" value={fmt(totalBia)} color="pink" />
            </div>

            {/* ABAS */}
            <div className="min-h-[450px]">

                {/* ── METAS ── */}
                {aba === 'metas' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 uppercase italic flex items-center gap-2">
                                <Target className="text-indigo-600" size={20} /> Objetivos Financeiros
                            </h3>
                            <Btn onClick={() => { setErroMeta(''); setModalMeta(true) }} className="bg-indigo-600">
                                <Plus size={16} className="mr-1 inline" /> Nova Meta
                            </Btn>
                        </div>

                        {metas.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                                <Target size={32} className="mb-2 opacity-30" />
                                <p className="text-sm font-bold">Nenhuma meta cadastrada</p>
                                <p className="text-xs">Clique em "Nova Meta" para começar</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {metas.map(meta => (
                                    <Card key={meta.id} className="p-6 relative group hover:border-indigo-300 transition-all">
                                        <button
                                            onClick={() => confirm('Remover esta meta?') && deleteMetaMutation.mutate(meta.id)}
                                            disabled={deleteMetaMutation.isPending}
                                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all disabled:opacity-30"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <h4 className="font-black text-slate-950 text-sm uppercase italic mb-1 tracking-tight pr-6">
                                            {meta.titulo}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">
                                            {meta.responsavel}
                                        </p>
                                        <ProgressBar value={meta.valorGuardado} max={meta.valorObjetivo} color="#6366f1" />
                                        <div className="flex justify-between mt-3 text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-500">
                                                {fmt(meta.valorGuardado)} / {fmt(meta.valorObjetivo)}
                                            </span>
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

                {/* ── BUCKETS ── */}
                {aba === 'buckets' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 uppercase italic flex items-center gap-2">
                                <ShoppingBag className="text-indigo-600" size={20} /> Wishlist & Sonhos
                            </h3>
                            <Btn onClick={() => { setErroDesejo(''); setModalDesejo(true) }} className="bg-slate-900">
                                <Plus size={14} className="mr-1 inline" /> Novo Desejo
                            </Btn>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {(resumo?.desejos ?? []).map((d: Desejo) => (
                                <Card key={d.id} className="p-0 overflow-hidden group hover:border-indigo-300 transition-all relative">
                                    <button
                                        onClick={() => confirm('Remover?') && deleteDesejoMutation.mutate(d.id)}
                                        disabled={deleteDesejoMutation.isPending}
                                        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-white rounded-lg shadow-sm z-10 disabled:opacity-30"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="bg-slate-50 p-8 flex justify-center border-b border-slate-100">
                                        <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                                            {d.icone || '🎁'}
                                        </span>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="text-sm font-black text-slate-950 uppercase tracking-tight leading-tight">
                                                {d.titulo}
                                            </h4>
                                            <Badge label={d.concluido ? 'Pronto' : 'Fila'} color={d.concluido ? 'green' : 'indigo'} />
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase italic">
                                            <Sparkles size={10} className="text-amber-500 inline mr-1" />
                                            {new Date(d.dataAlvo).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </Card>
                            ))}

                            <button
                                onClick={() => { setErroDesejo(''); setModalDesejo(true) }}
                                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                            >
                                <div className="p-3 bg-white rounded-full shadow-sm"><Plus size={22} /></div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Sonho</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ── EVOLUÇÃO ── */}
                {aba === 'evolucao' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="p-8 overflow-visible relative">
                            <div className="flex items-center gap-3 mb-10 italic">
                                <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <Briefcase size={20} className="text-indigo-600" />
                                </div>
                                <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Diogo</h3>
                            </div>
                            <div className="h-48 flex items-end justify-around gap-8 px-8 border-b-2 border-slate-100 pb-2">
                                {[
                                    { label: 'Entradas', value: (resumo?.transacoesEu ?? []).filter(t => t.tipo === 'Entrada').reduce((a, t) => a + t.valor, 0), color: 'bg-emerald-100 border-emerald-500' },
                                    { label: 'Saídas', value: (resumo?.transacoesEu ?? []).filter(t => t.tipo === 'Saída').reduce((a, t) => a + Math.abs(t.valor), 0), color: 'bg-rose-100 border-rose-500' },
                                ].map(({ label, value, color }) => {
                                    const max = Math.max(
                                        (resumo?.transacoesEu ?? []).filter(t => t.tipo === 'Entrada').reduce((a, t) => a + t.valor, 0),
                                        (resumo?.transacoesEu ?? []).filter(t => t.tipo === 'Saída').reduce((a, t) => a + Math.abs(t.valor), 0),
                                        1
                                    )
                                    const pct = Math.round((value / max) * 85) + 10
                                    return (
                                        <div key={label} className="flex flex-col items-center gap-2 flex-1">
                                            <span className="text-[9px] font-black text-slate-600">{fmt(value)}</span>
                                            <div className={`w-full ${color} border-2 border-b-0 rounded-t-xl`} style={{ height: `${pct}%` }} />
                                            <span className="text-[9px] font-black text-slate-400 uppercase">{label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </Card>

                        <Card className="p-8 overflow-visible relative">
                            <div className="flex items-center gap-3 mb-10 italic">
                                <div className="p-2.5 bg-pink-50 rounded-xl border border-pink-100">
                                    <TrendingUp size={20} className="text-pink-600" />
                                </div>
                                <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Beatriz</h3>
                            </div>
                            <div className="h-48 flex items-end justify-around gap-8 px-8 border-b-2 border-slate-100 pb-2">
                                {[
                                    { label: 'Entradas', value: (resumo?.transacoesDela ?? []).filter(t => t.tipo === 'Entrada').reduce((a, t) => a + t.valor, 0), color: 'bg-emerald-100 border-emerald-500' },
                                    { label: 'Saídas', value: (resumo?.transacoesDela ?? []).filter(t => t.tipo === 'Saída').reduce((a, t) => a + Math.abs(t.valor), 0), color: 'bg-rose-100 border-rose-500' },
                                ].map(({ label, value, color }) => {
                                    const max = Math.max(
                                        (resumo?.transacoesDela ?? []).filter(t => t.tipo === 'Entrada').reduce((a, t) => a + t.valor, 0),
                                        (resumo?.transacoesDela ?? []).filter(t => t.tipo === 'Saída').reduce((a, t) => a + Math.abs(t.valor), 0),
                                        1
                                    )
                                    const pct = Math.round((value / max) * 85) + 10
                                    return (
                                        <div key={label} className="flex flex-col items-center gap-2 flex-1">
                                            <span className="text-[9px] font-black text-slate-600">{fmt(value)}</span>
                                            <div className={`w-full ${color} border-2 border-b-0 rounded-t-xl`} style={{ height: `${pct}%` }} />
                                            <span className="text-[9px] font-black text-slate-400 uppercase">{label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* MODAL META */}
            <Modal open={modalMeta} onClose={() => setModalMeta(false)} title="🎯 Nova Meta de Casal">
                <div className="space-y-4 py-2">
                    <Input
                        label="Título da Meta"
                        value={novaMeta.titulo}
                        onChange={v => setNovaMeta({ ...novaMeta, titulo: v })}
                        placeholder="Ex: Viagem para Europa"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Valor Alvo (R$)"
                            type="number"
                            value={novaMeta.valorObjetivo}
                            onChange={v => setNovaMeta({ ...novaMeta, valorObjetivo: v })}
                            placeholder="10000"
                        />
                        <Input
                            label="Já Guardado (R$)"
                            type="number"
                            value={novaMeta.valorGuardado}
                            onChange={v => setNovaMeta({ ...novaMeta, valorGuardado: v })}
                            placeholder="0"
                        />
                    </div>

                    {erroMeta && (
                        <p className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
                            ⚠️ {erroMeta}
                        </p>
                    )}

                    <Btn
                        onClick={handleSalvarMeta}
                        disabled={metaMutation.isPending}
                        className="w-full bg-indigo-600 py-3"
                    >
                        {metaMutation.isPending ? 'Salvando...' : 'Salvar Meta'}
                    </Btn>
                </div>
            </Modal>

            {/* MODAL DESEJO */}
            <Modal open={modalDesejo} onClose={() => setModalDesejo(false)} title="💎 Novo Sonho / Bucket">
                <div className="space-y-4 py-2">
                    <Input
                        label="O que querem conquistar?"
                        value={novoDesejo.titulo}
                        onChange={v => setNovoDesejo({ ...novoDesejo, titulo: v })}
                        placeholder="Ex: Viagem para Gramado"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Ícone (Emoji)"
                            value={novoDesejo.icone}
                            onChange={v => setNovoDesejo({ ...novoDesejo, icone: v })}
                            placeholder="💎"
                        />
                        <Input
                            label="Data Estimada"
                            type="date"
                            value={novoDesejo.dataAlvo}
                            onChange={v => setNovoDesejo({ ...novoDesejo, dataAlvo: v })}
                        />
                    </div>

                    {erroDesejo && (
                        <p className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
                            ⚠️ {erroDesejo}
                        </p>
                    )}

                    <Btn
                        onClick={handleSalvarDesejo}
                        disabled={desejoMutation.isPending}
                        className="w-full bg-slate-900 py-3"
                    >
                        {desejoMutation.isPending ? 'Salvando...' : 'Salvar Desejo'}
                    </Btn>
                </div>
            </Modal>
        </div>
    )
}
import { useState } from 'react'
import { TrendingUp, Target, Plus, Trash2, Users, ShoppingBag, Briefcase, Sparkles, Heart } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDashboardResumo, getMetas, postMeta, deleteMeta, postDesejo, deleteDesejo } from '../services/api'
import { Card, StatCard, Badge, Btn, Input, Modal, SkeletonDashboard, fmt, ProgressBar } from '../components/ui'
import type { Desejo } from '../types/models'

export default function Home() {
    const queryClient = useQueryClient()
    const [aba, setAba] = useState<'metas' | 'buckets' | 'evolucao'>('metas')
    const [modalMeta, setModalMeta] = useState(false)
    const [modalDesejo, setModalDesejo] = useState(false)
    const [novaMeta, setNovaMeta] = useState({ titulo: '', valorObjetivo: 0, valorGuardado: 0, responsavel: 'Casal' })
    const [novoDesejo, setNovoDesejo] = useState({
        titulo: '', dataAlvo: new Date().toISOString(), icone: '💎', concluido: false
    })

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

    const metaMutation = useMutation({
        mutationFn: postMeta,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['metas'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] })
            setModalMeta(false)
            setNovaMeta({ titulo: '', valorObjetivo: 0, valorGuardado: 0, responsavel: 'Casal' })
        }
    })

    const deleteMetaMutation = useMutation({
        mutationFn: deleteMeta,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metas'] })
    })

    const desejoMutation = useMutation({
        mutationFn: postDesejo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] })
            setModalDesejo(false)
            setNovoDesejo({ titulo: '', dataAlvo: new Date().toISOString(), icone: '💎', concluido: false })
        }
    })

    const deleteDesejoMutation = useMutation({
        mutationFn: deleteDesejo,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] })
    })

    const totalEu = resumo?.transacoesEu.reduce((acc, t) => acc + t.valor, 0) || 0
    const totalBia = resumo?.transacoesDela.reduce((acc, t) => acc + t.valor, 0) || 0

    const handleSalvarMeta = () => {
        if (!novaMeta.titulo || novaMeta.valorObjetivo <= 0) return
        metaMutation.mutate(novaMeta)
    }

    const handleSalvarDesejo = () => {
        if (!novoDesejo.titulo) return
        const dataValida = !isNaN(Date.parse(novoDesejo.dataAlvo))
            ? novoDesejo.dataAlvo
            : new Date().toISOString()
        desejoMutation.mutate({ ...novoDesejo, dataAlvo: dataValida })
    }

    // Skeleton enquanto carrega — muito melhor que um spinner centralizado
    if (loadingResumo || loadingMetas) return <SkeletonDashboard />

    const totalJuntos = totalEu + totalBia

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-up pb-10 tracking-tight">
            {/* HEADER */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase">
                        Dash<span className="text-primary font-black">board</span>
                    </h2>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest italic flex items-center gap-2">
                        <Heart size={12} className="text-pink-500" /> Gestão Diogo & Beatriz
                    </p>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit shadow-inner">
                    {(['metas', 'buckets', 'evolucao'] as const).map((t) => (
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

                {aba === 'metas' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 uppercase italic flex items-center gap-2">
                                <Target className="text-primary" size={20} /> Objetivos Financeiros
                            </h3>
                            <Btn onClick={() => setModalMeta(true)} className="bg-primary px-4 py-2 hover:scale-105 active:scale-95">
                                <Plus size={18} />
                            </Btn>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {metas.map((meta) => (
                                <Card key={meta.id} className="p-6 border-slate-200 shadow-sm relative group hover:border-indigo-300 transition-all">
                                    <button
                                        onClick={() => confirm("Remover esta meta?") && deleteMetaMutation.mutate(meta.id)}
                                        disabled={deleteMetaMutation.isPending}
                                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all disabled:opacity-30"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <h4 className="font-black text-slate-950 text-sm uppercase italic mb-4 tracking-tight">{meta.titulo}</h4>
                                    <ProgressBar value={meta.valorGuardado} max={meta.valorObjetivo} color="#6366f1" />
                                    <div className="flex justify-between mt-4 text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-500 italic">Faltam {fmt(meta.valorObjetivo - meta.valorGuardado)}</span>
                                        <span className="text-indigo-700 font-extrabold">{fmt(meta.valorGuardado)}</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {aba === 'buckets' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 uppercase italic flex items-center gap-2">
                                <ShoppingBag className="text-primary" size={20} /> Wishlist & Sonhos
                            </h3>
                            <Btn onClick={() => setModalDesejo(true)} className="bg-slate-900 px-4 py-2 text-[10px]">
                                <Plus size={14} className="mr-1" /> Novo Desejo
                            </Btn>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {resumo?.desejos.map((d: Desejo) => (
                                <Card key={d.id} className="p-0 border-slate-200 overflow-hidden group hover:border-primary/40 transition-all shadow-sm relative">
                                    <button
                                        onClick={() => confirm("Remover?") && deleteDesejoMutation.mutate(d.id)}
                                        disabled={deleteDesejoMutation.isPending}
                                        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-white rounded-lg shadow-sm z-10 disabled:opacity-30"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="bg-slate-50 p-8 flex justify-center border-b border-slate-100 group-hover:bg-primary/5 transition-colors">
                                        <span className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform duration-500">{d.icone || '🎁'}</span>
                                    </div>
                                    <div className="p-5 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-black text-slate-950 uppercase tracking-tight leading-tight">{d.titulo}</h4>
                                            <Badge label={d.concluido ? "Pronto" : "Fila"} color={d.concluido ? "green" : "indigo"} />
                                        </div>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 italic">
                                            <Sparkles size={12} className="text-amber-500 inline mr-1" />
                                            Meta: {new Date(d.dataAlvo).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </Card>
                            ))}
                            <button
                                onClick={() => setModalDesejo(true)}
                                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-sm bg-slate-50/50"
                            >
                                <div className="p-3 bg-white rounded-full shadow-sm"><Plus size={24} /></div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Sonho</span>
                            </button>
                        </div>
                    </div>
                )}

                {aba === 'evolucao' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="p-8 border-slate-200 shadow-lg bg-white overflow-visible relative">
                            <div className="flex items-center gap-3 mb-12 italic">
                                <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 shadow-inner">
                                    <Briefcase size={20} className="text-indigo-600" />
                                </div>
                                <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Diogo: Pessoal vs Business</h3>
                            </div>
                            <div className="h-56 flex items-end justify-around gap-10 px-10 border-b-2 border-slate-100 pb-2">
                                <div className="relative group w-16 bg-indigo-100 border-2 border-indigo-600 border-b-0 rounded-t-xl transition-all" style={{ height: '55%' }}>
                                    <div className="absolute -top-7 inset-x-0 text-center text-[9px] font-black text-indigo-700">{fmt(totalEu * 0.4)}</div>
                                </div>
                                <div className="relative group w-16 bg-emerald-100 border-2 border-emerald-600 border-b-0 rounded-t-xl transition-all" style={{ height: '90%' }}>
                                    <div className="absolute -top-7 inset-x-0 text-center text-[9px] font-black text-emerald-700">{fmt(totalEu * 0.6)}</div>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-8 border-slate-200 shadow-lg bg-white overflow-visible relative">
                            <div className="flex items-center gap-3 mb-12 italic">
                                <div className="p-2.5 bg-pink-50 rounded-xl border border-pink-100 shadow-inner">
                                    <TrendingUp size={20} className="text-pink-600" />
                                </div>
                                <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Bia: Pessoal vs Secret Studio</h3>
                            </div>
                            <div className="h-56 flex items-end justify-around gap-10 px-10 border-b-2 border-slate-100 pb-2">
                                <div className="relative group w-16 bg-pink-100 border-2 border-pink-600 border-b-0 rounded-t-xl transition-all" style={{ height: '40%' }}>
                                    <div className="absolute -top-7 inset-x-0 text-center text-[9px] font-black text-pink-700">{fmt(totalBia * 0.3)}</div>
                                </div>
                                <div className="relative group w-16 bg-purple-100 border-2 border-purple-600 border-b-0 rounded-t-xl transition-all" style={{ height: '95%' }}>
                                    <div className="absolute -top-7 inset-x-0 text-center text-[9px] font-black text-purple-700">{fmt(totalBia * 0.7)}</div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* MODAIS */}
            <Modal open={modalMeta} onClose={() => setModalMeta(false)} title="Nova Meta de Casal">
                <div className="space-y-5 py-2">
                    <Input label="Título da Meta" value={novaMeta.titulo} onChange={v => setNovaMeta({ ...novaMeta, titulo: v })} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Valor Alvo (R$)" type="number" value={novaMeta.valorObjetivo} onChange={v => setNovaMeta({ ...novaMeta, valorObjetivo: Number(v) })} />
                        <Input label="Já Guardado (R$)" type="number" value={novaMeta.valorGuardado} onChange={v => setNovaMeta({ ...novaMeta, valorGuardado: Number(v) })} />
                    </div>
                    <Btn onClick={handleSalvarMeta} disabled={metaMutation.isPending} className="w-full bg-primary py-3 font-black text-[11px] shadow-lg">
                        {metaMutation.isPending ? 'Salvando...' : 'Lançar Meta'}
                    </Btn>
                </div>
            </Modal>

            <Modal open={modalDesejo} onClose={() => setModalDesejo(false)} title="Novo Sonho / Bucket">
                <div className="space-y-5 py-2">
                    <Input label="O que querem conquistar?" value={novoDesejo.titulo} onChange={v => setNovoDesejo({ ...novoDesejo, titulo: v })} placeholder="Ex: Viagem para Gramado" />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Ícone (Emoji)" value={novoDesejo.icone} onChange={v => setNovoDesejo({ ...novoDesejo, icone: v })} />
                        <Input label="Data Estimada" type="date" value={novoDesejo.dataAlvo.split('T')[0]} onChange={v => setNovoDesejo({ ...novoDesejo, dataAlvo: new Date(v).toISOString() })} />
                    </div>
                    <Btn onClick={handleSalvarDesejo} disabled={desejoMutation.isPending} className="w-full bg-slate-900 py-3 font-black text-[11px] shadow-lg">
                        {desejoMutation.isPending ? 'Salvando...' : 'Lançar Desejo'}
                    </Btn>
                </div>
            </Modal>
        </div>
    )
}
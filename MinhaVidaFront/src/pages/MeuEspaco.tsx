import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTransacoes, postTransacao, deleteTransacao } from '../services/api'
import { Card, StatCard, Badge, Btn, Input, Select, Spinner, fmt } from '../components/ui'
import type { Transacao } from '../types/models'

const CATEGORIAS = [
    'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação',
    'Lazer', 'Vestuário', 'Investimento', 'Receita', 'Geral',
]
const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const FORM_VAZIO = {
    responsavel: 'Eu' as const,
    ehPessoal: true,
    tipo: 'Saída' as const,
    categoria: 'Geral',
    descricao: '',
    valor: '',        // string para o input não exibir "0"
}

export default function MeuEspaco() {
    const queryClient = useQueryClient()
    const [mes, setMes] = useState(new Date().getMonth())
    const [aba, setAba] = useState<'pessoal' | 'empresa'>('pessoal')
    const [form, setForm] = useState(FORM_VAZIO)
    const [erro, setErro] = useState('')

    // ── Busca ─────────────────────────────────────────────────────────────────
    const { data: lista = [], isLoading } = useQuery({
        queryKey: ['transacoes', 'Eu'],
        queryFn: () => getTransacoes('Eu'),
        staleTime: 1000 * 60 * 5,
    })

    // ── Salvar ────────────────────────────────────────────────────────────────
    const saveMutation = useMutation({
        mutationFn: postTransacao,
        onSuccess: () => {
            // Invalida AMBAS as chaves para que Home e MeuEspaco atualizem juntos
            queryClient.invalidateQueries({ queryKey: ['transacoes', 'Eu'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] })
            setForm(FORM_VAZIO)
            setErro('')
        },
        onError: (e: any) => {
            setErro(e?.response?.data ?? 'Erro ao salvar. Tente novamente.')
        },
    })

    // ── Deletar ───────────────────────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: deleteTransacao,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transacoes', 'Eu'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] })
        },
    })

    // ── Filtros e cálculos ────────────────────────────────────────────────────
    const filtradas = lista.filter(t =>
        new Date(t.data).getMonth() === mes &&
        t.ehPessoal === (aba === 'pessoal')
    )

    // Soma correta: entradas positivas, saídas negativas (já vêm com sinal do backend)
    const saldo = filtradas.reduce((acc, t) => acc + t.valor, 0)

    const entradas = filtradas.filter(t => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0)
    const saidas = filtradas.filter(t => t.tipo === 'Saída').reduce((acc, t) => acc + t.valor, 0)

    // ── Salvar handler ────────────────────────────────────────────────────────
    const salvar = () => {
        setErro('')
        if (!form.descricao.trim()) { setErro('Informe a descrição.'); return }
        if (!form.valor || Number(form.valor) <= 0) { setErro('Informe um valor maior que zero.'); return }

        saveMutation.mutate({
            responsavel: 'Eu',
            ehPessoal: aba === 'pessoal',
            tipo: form.tipo,
            categoria: form.categoria,
            descricao: form.descricao.trim(),
            valor: Number(form.valor),   // positivo — backend aplica o sinal
            data: new Date().toISOString(),
        })
    }

    if (isLoading) return <Spinner />

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-up pb-10 text-slate-900">

            {/* HEADER */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
                <div>
                    <h2 className="text-3xl font-black italic tracking-tighter">
                        Meu <span className="text-indigo-600">Espaço</span>
                    </h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Diogo — Pessoal & Business</p>
                </div>

                <div className="flex gap-3 flex-wrap">
                    <select
                        value={mes}
                        onChange={e => setMes(+e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none"
                    >
                        {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>

                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        {(['pessoal', 'empresa'] as const).map(a => (
                            <button
                                key={a}
                                onClick={() => setAba(a)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${aba === a ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'
                                    }`}
                            >
                                {a === 'pessoal' ? 'Pessoal' : 'Business'}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label={aba === 'pessoal' ? 'Saldo Pessoal' : 'Saldo Business'}
                    value={fmt(saldo)}
                    color={saldo >= 0 ? 'green' : 'red'}
                />
                <StatCard label="Entradas" value={fmt(entradas)} color="green" />
                <StatCard label="Saídas" value={fmt(Math.abs(saidas))} color="red" />
            </div>

            {/* FORMULÁRIO DE LANÇAMENTO */}
            <Card className="p-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
                    Novo Lançamento — {aba === 'pessoal' ? 'Pessoal' : 'Business'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Input
                        label="Descrição"
                        value={form.descricao}
                        onChange={v => setForm({ ...form, descricao: v })}
                        placeholder="Ex: Mercado, Salário..."
                    />
                    <Input
                        label="Valor (R$)"
                        type="number"
                        value={form.valor}
                        onChange={v => setForm({ ...form, valor: v })}
                        placeholder="0,00"
                    />
                    <Select
                        label="Tipo"
                        value={form.tipo}
                        onChange={v => setForm({ ...form, tipo: v as 'Entrada' | 'Saída' })}
                        options={[
                            { value: 'Saída', label: '🔻 Saída' },
                            { value: 'Entrada', label: '🔺 Entrada' },
                        ]}
                    />
                    <Select
                        label="Categoria"
                        value={form.categoria}
                        onChange={v => setForm({ ...form, categoria: v })}
                        options={CATEGORIAS.map(c => ({ value: c, label: c }))}
                    />
                    <div className="flex flex-col justify-end">
                        <Btn
                            onClick={salvar}
                            disabled={saveMutation.isPending}
                            className="w-full"
                        >
                            {saveMutation.isPending ? 'Salvando...' : '+ Lançar'}
                        </Btn>
                    </div>
                </div>

                {erro && (
                    <p className="mt-3 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
                        ⚠️ {erro}
                    </p>
                )}
            </Card>

            {/* TABELA */}
            <Card className="overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                        {filtradas.length} lançamentos em {MESES[mes]}
                    </p>
                </div>

                {filtradas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Plus size={32} className="mb-2 opacity-30" />
                        <p className="text-sm font-bold">Nenhum lançamento neste mês</p>
                        <p className="text-xs">Use o formulário acima para adicionar</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Descrição</th>
                                <th className="p-4">Categoria</th>
                                <th className="p-4 text-right">Valor</th>
                                <th className="p-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtradas.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 text-xs text-slate-400">
                                        {new Date(t.data).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="p-4 text-sm font-bold text-slate-800">{t.descricao}</td>
                                    <td className="p-4">
                                        <Badge label={t.categoria} color="indigo" />
                                    </td>
                                    <td className={`p-4 text-right font-black text-sm ${t.tipo === 'Entrada' ? 'text-emerald-600' : 'text-rose-600'
                                        }`}>
                                        {t.tipo === 'Entrada' ? '+' : '-'} {fmt(Math.abs(t.valor))}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => deleteMutation.mutate(t.id)}
                                            disabled={deleteMutation.isPending}
                                            className="text-slate-300 hover:text-red-500 disabled:opacity-50 transition-colors"
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
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
// 1. Importação dos hooks do React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTransacoes, postTransacao, deleteTransacao } from '../services/api'
import { Card, StatCard, Badge, Btn, Input, Select, Spinner, fmt } from '../components/ui'
import type { Transacao } from '../types/models'

const CATEGORIAS = ['Alimentação','Transporte','Moradia','Saúde','Educação','Lazer','Vestuário','Investimento','Receita','Geral']
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function MeuEspaco() {
  const queryClient = useQueryClient()
  const [mes, setMes] = useState(new Date().getMonth())
  const [aba, setAba] = useState<'pessoal' | 'empresa'>('pessoal')
  const [form, setForm] = useState<Partial<Transacao>>({
    responsavel: 'Eu', ehPessoal: true, tipo: 'Saída', categoria: 'Geral', descricao: '', valor: 0
  })

  // 2. Busca de Dados com Cache (Chave única para 'Eu')
  const { data: lista = [], isLoading } = useQuery({
    queryKey: ['transacoes', 'Eu'],
    queryFn: () => getTransacoes('Eu'),
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  })

  // 3. Mutation para Salvar
  const saveMutation = useMutation({
    mutationFn: postTransacao,
    onSuccess: () => {
      // Invalida o cache para recarregar os dados e atualizar o dashboard
      queryClient.invalidateQueries({ queryKey: ['transacoes', 'Eu'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] })
      setForm({ ...form, descricao: '', valor: 0 })
    }
  })

  // 4. Mutation para Deletar
  const deleteMutation = useMutation({
    mutationFn: deleteTransacao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes', 'Eu'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-resumo'] })
    }
  })

  const filtradas = lista.filter(t => new Date(t.data).getMonth() === mes && t.ehPessoal === (aba === 'pessoal'))
  const saldo = filtradas.reduce((acc, t) => acc + (t.tipo === 'Entrada' ? Math.abs(t.valor) : -Math.abs(t.valor)), 0)

  const salvar = () => {
    if (!form.descricao || !form.valor) return
    const valorFinal = form.tipo === 'Saída' ? -Math.abs(Number(form.valor)) : Math.abs(Number(form.valor))
    
    saveMutation.mutate({ 
      ...form, 
      ehPessoal: aba === 'pessoal', 
      valor: valorFinal, 
      data: new Date().toISOString() 
    })
  }

  if (isLoading) return <Spinner />

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up pb-10 text-slate-900">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <h2 className="text-3xl font-black italic">Meu <span className="text-primary">Espaço</span></h2>
        <div className="flex gap-4">
          <select value={mes} onChange={e => setMes(+e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none">
            {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {['pessoal', 'empresa'].map((a) => (
              <button key={a} onClick={() => setAba(a as any)} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${aba === a ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}>
                {a === 'pessoal' ? 'Pessoal' : 'Business'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Saldo do Mês" value={fmt(saldo)} color={saldo >= 0 ? 'green' : 'indigo'} />
        <Card className="md:col-span-2 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 italic">
            <Input label="Descrição" value={form.descricao!} onChange={v => setForm({ ...form, descricao: v })} />
            <Input label="Valor" type="number" value={form.valor!} onChange={v => setForm({ ...form, valor: v === '' ? 0 : Number(v) })} />
            <Select label="Tipo" value={form.tipo!} onChange={v => setForm({ ...form, tipo: v as any })} options={[{ value: 'Saída', label: 'Saída 🔻' }, { value: 'Entrada', label: 'Entrada 🔺' }]} />
            <Select label="Categoria" value={form.categoria!} onChange={v => setForm({ ...form, categoria: v })} options={CATEGORIAS.map(c => ({ value: c, label: c }))} />
            <Btn onClick={salvar} className="h-fit mt-auto" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Lançando...' : 'Lançar'}
            </Btn>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
            <tr><th className="p-4">Data</th><th className="p-4">Descrição</th><th className="p-4">Categoria</th><th className="p-4 text-right">Valor</th><th className="p-4"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtradas.map(t => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 text-xs text-slate-400">{new Date(t.data).toLocaleDateString()}</td>
                <td className="p-4 text-sm font-bold">{t.descricao}</td>
                <td className="p-4"><Badge label={t.categoria} color="indigo" /></td>
                <td className={`p-4 text-right font-black ${t.tipo === 'Entrada' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {t.tipo === 'Entrada' ? '▲' : '▼'} {fmt(t.valor)}
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => deleteMutation.mutate(t.id)} 
                    disabled={deleteMutation.isPending}
                    className="text-slate-300 hover:text-red-500 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
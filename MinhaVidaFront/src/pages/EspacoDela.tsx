import { useState } from 'react'
import { Trash2 } from 'lucide-react'
// 1. Hooks do React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTransacoes, postTransacao, deleteTransacao } from '../services/api'
import { Card, StatCard, Badge, Btn, Input, Select, Spinner, fmt } from '../components/ui'
import type { Transacao } from '../types/models'

const CATEGORIAS = ['Procedimentos','Materiais','Aluguel','Cursos','Lazer','Pessoal','Faturamento','Geral']
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function EspacoDela() {
  const queryClient = useQueryClient()
  const [mes, setMes] = useState(new Date().getMonth())
  const [aba, setAba] = useState<'pessoal' | 'studio'>('pessoal')
  const [form, setForm] = useState<Partial<Transacao>>({
    responsavel: 'Namorada', ehPessoal: true, tipo: 'Saída', categoria: 'Geral', descricao: '', valor: 0
  })

  // 2. Busca com Cache
  const { data: lista = [], isLoading } = useQuery({
    queryKey: ['transacoes', 'Namorada'],
    queryFn: () => getTransacoes('Namorada'),
    staleTime: 1000 * 60 * 5,
  })

  // 3. Mutation para Salvar
  const saveMutation = useMutation({
    mutationFn: postTransacao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes', 'Namorada'] })
      setForm({ ...form, descricao: '', valor: 0 })
    }
  })

  // 4. Mutation para Deletar
  const deleteMutation = useMutation({
    mutationFn: deleteTransacao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes', 'Namorada'] })
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-pink-50 pb-6">
        <div>
          <h2 className="text-3xl font-black italic">Espaço <span className="text-secondary">Dela</span></h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Beatriz & Secret Studio</p>
        </div>
        <div className="flex gap-4">
          <select value={mes} onChange={e => setMes(+e.target.value)} className="bg-white border border-pink-100 rounded-xl px-4 py-2 text-sm font-bold text-pink-600 outline-none">
            {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <div className="flex bg-pink-50/50 p-1 rounded-xl border border-pink-100">
            {['pessoal', 'studio'].map((a) => (
              <button key={a} onClick={() => setAba(a as any)} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${aba === a ? 'bg-white text-secondary shadow-sm' : 'text-pink-300'}`}>
                {a === 'pessoal' ? 'Pessoal' : 'Studio'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label={aba === 'pessoal' ? 'Saldo Pessoal' : 'Faturamento Studio'} value={fmt(saldo)} color={saldo >= 0 ? 'green' : 'pink'} />
        <Card className="md:col-span-2 p-6 border-pink-100 shadow-sm">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 italic">
              <Input label="Descrição" value={form.descricao!} onChange={v => setForm({...form, descricao: v})} />
              <Input label="Valor" type="number" value={form.valor!} onChange={v => setForm({...form, valor: v === '' ? 0 : Number(v)})} />
              <Select label="Tipo" value={form.tipo!} onChange={v => setForm({...form, tipo: v as any})} options={[{ value: 'Saída', label: 'Saída 🔻' }, { value: 'Entrada', label: 'Entrada 🔺' }]} />
              <Select label="Categoria" value={form.categoria!} onChange={v => setForm({...form, categoria: v})} options={CATEGORIAS.map(c => ({value:c, label:c}))} />
              <Btn onClick={salvar} className="h-fit mt-auto bg-secondary" disabled = {saveMutation.isPending}>Lançar</Btn>
           </div>
        </Card>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
            <tr><th className="p-4">Data</th><th className="p-4">Descrição</th><th className="p-4">Categoria</th><th className="p-4 text-right">Valor</th><th className="p-4"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtradas.map(t => (
              <tr key={t.id} className="hover:bg-pink-50/20 transition-colors">
                <td className="p-4 text-xs text-slate-400">{new Date(t.data).toLocaleDateString()}</td>
                <td className="p-4 text-sm font-bold">{t.descricao}</td>
                <td className="p-4"><Badge label={t.categoria} color="pink" /></td>
                <td className={`p-4 text-right font-black ${t.tipo === 'Entrada' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {t.tipo === 'Entrada' ? '▲' : '▼'} {fmt(t.valor)}
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => deleteMutation.mutate(t.id)} 
                    disabled={deleteMutation.isPending}
                    className="text-slate-200 hover:text-red-500 disabled:opacity-50"
                  >
                    <Trash2 size={16}/>
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
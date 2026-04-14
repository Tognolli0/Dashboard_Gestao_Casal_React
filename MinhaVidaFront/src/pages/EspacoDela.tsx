import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteTransacao, getDashboardResumo, getTransacoes, postTransacao } from '../services/api'
import { DASHBOARD_QUERY_KEY } from '../lib/queryClient'
import { filterTransactionsByMonth, summarizeTransactions } from '../lib/dashboard'
import { Badge, Btn, Card, Input, Select, Spinner, StatCard, fmt } from '../components/ui'

const CATEGORIAS = [
  'Procedimentos', 'Materiais', 'Aluguel', 'Cursos',
  'Lazer', 'Pessoal', 'Faturamento', 'Geral',
]
const MESES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const FORM_VAZIO = {
  tipo: 'Saída' as const,
  categoria: 'Geral',
  descricao: '',
  valor: '',
}

export default function EspacoDela() {
  const queryClient = useQueryClient()
  const [mes, setMes] = useState(new Date().getMonth())
  const [aba, setAba] = useState<'pessoal' | 'studio'>('pessoal')
  const [form, setForm] = useState(FORM_VAZIO)
  const [erro, setErro] = useState('')

  const { data: lista = [], isLoading } = useQuery({
    queryKey: ['transacoes', 'Namorada'],
    queryFn: () => getTransacoes('Namorada'),
    initialData: () => {
      const resumo = queryClient.getQueryData<Awaited<ReturnType<typeof getDashboardResumo>>>(DASHBOARD_QUERY_KEY)
      return resumo?.transacoesDela
    },
  })

  const saveMutation = useMutation({
    mutationFn: postTransacao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes', 'Namorada'] })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY })
      setForm(FORM_VAZIO)
      setErro('')
    },
    onError: (error: any) => {
      setErro(error?.response?.data ?? 'Erro ao salvar. Tente novamente.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTransacao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes', 'Namorada'] })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY })
    },
  })

  const filtradas = filterTransactionsByMonth(lista, mes, aba === 'pessoal')
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
      responsavel: 'Namorada',
      ehPessoal: aba === 'pessoal',
      tipo: form.tipo,
      categoria: form.categoria,
      descricao: form.descricao.trim(),
      valor: Number(form.valor),
      data: new Date().toISOString(),
    })
  }

  if (isLoading) return <Spinner />

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10 text-slate-900 animate-fade-up">
      <header className="flex flex-col justify-between gap-6 border-b border-pink-50 pb-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter">
            Espaco <span className="text-pink-500">Dela</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Beatriz - Pessoal & Secret Studio</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={mes}
            onChange={(event) => setMes(Number(event.target.value))}
            className="rounded-xl border border-pink-100 bg-white px-4 py-2 text-sm font-bold text-pink-600 outline-none"
          >
            {MESES.map((item, index) => <option key={item} value={index}>{item}</option>)}
          </select>

          <div className="flex rounded-xl border border-pink-100 bg-pink-50/50 p-1">
            {(['pessoal', 'studio'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setAba(item)}
                className={`rounded-lg px-4 py-2 text-xs font-black uppercase transition-all ${
                  aba === item ? 'bg-white text-pink-600 shadow-sm' : 'text-pink-300'
                }`}
              >
                {item === 'pessoal' ? 'Pessoal' : 'Studio'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard label={aba === 'pessoal' ? 'Saldo Pessoal' : 'Saldo Studio'} value={fmt(saldo)} color={saldo >= 0 ? 'green' : 'pink'} />
        <StatCard label="Entradas" value={fmt(entradas)} color="green" />
        <StatCard label="Saidas" value={fmt(saidas)} color="red" />
      </div>

      <Card className="border-pink-100 p-6">
        <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">
          Novo Lancamento - {aba === 'pessoal' ? 'Pessoal' : 'Studio'}
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input label="Descricao" value={form.descricao} onChange={(value) => setForm({ ...form, descricao: value })} placeholder="Ex: Material, Receita..." />
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
            options={CATEGORIAS.map((categoria) => ({ value: categoria, label: categoria }))}
          />
          <div className="flex flex-col justify-end">
            <Btn onClick={salvar} disabled={saveMutation.isPending} className="w-full bg-pink-500 hover:bg-pink-600">
              {saveMutation.isPending ? 'Salvando...' : '+ Lancar'}
            </Btn>
          </div>
        </div>

        {erro && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">{erro}</p>}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            {filtradas.length} lancamentos em {MESES[mes]}
          </p>
        </div>

        {filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Plus size={32} className="mb-2 opacity-30" />
            <p className="text-sm font-bold">Nenhum lancamento neste mes</p>
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
                <tr key={transaction.id} className="transition-colors hover:bg-pink-50/20">
                  <td className="p-4 text-xs text-slate-400">{new Date(transaction.data).toLocaleDateString('pt-BR')}</td>
                  <td className="p-4 text-sm font-bold text-slate-800">{transaction.descricao}</td>
                  <td className="p-4"><Badge label={transaction.categoria} color="pink" /></td>
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


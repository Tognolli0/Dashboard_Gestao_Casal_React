import FinancialSpacePage from '../components/FinancialSpacePage'

const CATEGORIAS = [
  'Alimentacao', 'Transporte', 'Moradia', 'Saude', 'Educacao',
  'Lazer', 'Vestuario', 'Investimento', 'Receita', 'Geral',
]

export default function MeuEspacoPage() {
  return (
    <FinancialSpacePage
      title="Meu"
      accent="Espaco"
      subtitle="Diogo - Pessoal & Business"
      responsavel="Eu"
      categorias={CATEGORIAS}
      abas={[
        { id: 'pessoal', label: 'Pessoal', personal: true },
        { id: 'empresa', label: 'Business', personal: false },
      ]}
      saldoLabels={{
        first: 'Saldo Pessoal',
        second: 'Saldo Business',
      }}
      theme={{
        accentText: 'text-indigo-600',
        accentButton: 'bg-indigo-600 text-white',
        accentButtonHover: 'hover:bg-indigo-700',
        accentBorder: 'border-indigo-500',
        accentSoftBorder: 'border-slate-100',
        accentSoftBg: 'bg-slate-100',
        accentInputFocus: 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500',
        accentBadge: 'text-slate-700',
        inactiveTab: 'text-slate-400',
        rowHover: 'hover:bg-slate-50/50',
      }}
    />
  )
}

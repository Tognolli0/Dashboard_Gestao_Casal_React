import FinancialSpacePage from '../components/FinancialSpacePage'

const CATEGORIAS = [
  'Procedimentos', 'Materiais', 'Aluguel', 'Cursos',
  'Lazer', 'Pessoal', 'Faturamento', 'Geral',
]

export default function EspacoDelaPage() {
  return (
    <FinancialSpacePage
      title="Espaco"
      accent="Dela"
      subtitle="Beatriz - Pessoal & Secret Studio"
      responsavel="Namorada"
      categorias={CATEGORIAS}
      abas={[
        { id: 'pessoal', label: 'Pessoal', personal: true },
        { id: 'studio', label: 'Studio', personal: false },
      ]}
      saldoLabels={{
        first: 'Saldo Pessoal',
        second: 'Saldo Studio',
      }}
      theme={{
        accentText: 'text-pink-500',
        accentButton: 'bg-pink-500 text-white',
        accentButtonHover: 'hover:bg-pink-600',
        accentBorder: 'border-pink-500',
        accentSoftBorder: 'border-pink-100',
        accentSoftBg: 'bg-pink-50/50',
        accentInputFocus: 'border-slate-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-500',
        accentBadge: 'text-pink-600',
        inactiveTab: 'text-pink-300',
        rowHover: 'hover:bg-pink-50/20',
      }}
    />
  )
}

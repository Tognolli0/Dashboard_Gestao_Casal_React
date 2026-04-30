export interface Transacao {
  id: number
  descricao: string
  valor: number
  data: string
  responsavel: 'Eu' | 'Namorada'
  categoria: string
  tipo: 'Entrada' | 'Saída'
  ehPessoal: boolean
}

export interface Meta {
  id: number
  titulo: string
  valorObjetivo: number
  valorGuardado: number
  responsavel: string
  ehReservaEmergencia: boolean
  criadaEm: string
  atualizadaEm: string
}

export interface Desejo {
  id: number
  titulo: string
  dataAlvo: string
  icone: string
  concluido: boolean
}

export interface ChecklistItem {
  id: number
  mesReferencia: string
  titulo: string
  concluido: boolean
  ordem: number
}

export interface DashboardResumo {
  transacoesEu: Transacao[]
  transacoesDela: Transacao[]
  metas: Meta[]
  desejos: Desejo[]
}

export interface DashboardFluxoResumo {
  entradas: number
  saidas: number
  saldo: number
}

export interface DashboardCategoriaResumo {
  nome: string
  total: number
}

export interface DashboardTotaisResumo {
  eu: number
  bia: number
  juntos: number
}

export interface DashboardMesAtualResumo {
  entradas: number
  saidas: number
  saldo: number
  taxaPoupanca: number
  categoriaTop: DashboardCategoriaResumo
}

export interface DashboardMetasResumo {
  totalMetas: number
  totalGuardado: number
  progresso: number
  concluidas: number
  bucketsAbertos: number
}

export interface DashboardEvolucaoItem {
  mes: string
  entradas: number
  saidas: number
  saldo: number
  diogo: number
  beatriz: number
}

export interface DashboardCategoriaChartItem {
  name: string
  value: number
  color: string
}

export interface DashboardAlerta {
  id: string
  title: string
  message: string
  tone: 'amber' | 'rose' | 'indigo' | 'green'
}

export interface DashboardReservaPlanejamento {
  objetivoIdeal: number
  coberturaMeses: number
  faltanteIdeal: number
}

export interface DashboardHomeOverview {
  metas: Meta[]
  desejos: Desejo[]
  reservaEmergencia: Meta | null
  totais: DashboardTotaisResumo
  mesAtual: DashboardMesAtualResumo
  metasResumo: DashboardMetasResumo
  scoreFinanceiro: number
  destaquePrincipal: string
  acaoRecomendada: string
  reservaPlanejamento: DashboardReservaPlanejamento
  alertas: DashboardAlerta[]
}

export interface DashboardHomeEvolution {
  fluxoEu: DashboardFluxoResumo
  fluxoDela: DashboardFluxoResumo
  evolucaoMensal: DashboardEvolucaoItem[]
  categoriasChart: DashboardCategoriaChartItem[]
}

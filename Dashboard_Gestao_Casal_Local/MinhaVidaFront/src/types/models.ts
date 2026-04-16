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

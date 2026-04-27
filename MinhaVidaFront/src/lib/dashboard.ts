import type { DashboardResumo, Transacao } from '../types/models'

export function combineTransactions(resumo?: DashboardResumo | null) {
  return [...(resumo?.transacoesEu ?? []), ...(resumo?.transacoesDela ?? [])]
}

export function filterTransactionsByMonth(
  transactions: Transacao[],
  month: number,
  personalOnly: boolean,
) {
  return transactions.filter((transaction) =>
    new Date(transaction.data).getMonth() === month &&
    transaction.ehPessoal === personalOnly,
  )
}

export function summarizeTransactions(transactions: Transacao[]) {
  let saldo = 0
  let entradas = 0
  let saidas = 0

  for (const transaction of transactions) {
    saldo += transaction.valor

    if (transaction.tipo === 'Entrada') {
      entradas += transaction.valor
      continue
    }

    saidas += Math.abs(transaction.valor)
  }

  return { saldo, entradas, saidas }
}

export function sortTransactionsByDateDesc(transactions: Transacao[]) {
  return [...transactions].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  )
}

export function buildOptimisticTransaction(transaction: Partial<Transacao>): Transacao {
  const tipo = (transaction.tipo ?? 'Saída') as 'Entrada' | 'Saída'
  const valorBase = Math.abs(Number(transaction.valor ?? 0))

  return {
    id: transaction.id ?? -Date.now(),
    descricao: transaction.descricao ?? '',
    data: transaction.data ?? new Date().toISOString(),
    responsavel: (transaction.responsavel ?? 'Eu') as 'Eu' | 'Namorada',
    categoria: transaction.categoria ?? 'Geral',
    tipo,
    ehPessoal: transaction.ehPessoal ?? true,
    valor: tipo === 'Entrada' ? valorBase : -valorBase,
  }
}

export function replaceTransaction(
  transactions: Transacao[],
  transactionId: number,
  nextTransaction: Transacao,
) {
  return sortTransactionsByDateDesc(
    transactions.map((transaction) =>
      transaction.id === transactionId ? nextTransaction : transaction,
    ),
  )
}

export function appendTransaction(transactions: Transacao[], nextTransaction: Transacao) {
  return sortTransactionsByDateDesc([...transactions, nextTransaction])
}

export function removeTransaction(transactions: Transacao[], transactionId: number) {
  return transactions.filter((transaction) => transaction.id !== transactionId)
}

export function updateDashboardTransactions(
  resumo: DashboardResumo | undefined,
  responsavel: 'Eu' | 'Namorada',
  updater: (transactions: Transacao[]) => Transacao[],
) {
  if (!resumo) return resumo

  if (responsavel === 'Eu') {
    return {
      ...resumo,
      transacoesEu: updater(resumo.transacoesEu),
    }
  }

  return {
    ...resumo,
    transacoesDela: updater(resumo.transacoesDela),
  }
}


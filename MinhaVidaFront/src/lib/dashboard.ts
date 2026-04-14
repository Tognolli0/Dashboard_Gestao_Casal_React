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


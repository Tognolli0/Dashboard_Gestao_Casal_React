import { useState, useEffect, useCallback } from 'react'
// AJUSTE: Removido /services/ e /types/ pois seus arquivos estão na raiz de src
import { getDashboardResumo } from '../services/api' 
import type { DashboardResumo, Transacao } from '../types/models'

const CACHE_TTL = 2 * 60 * 1000 

let _cache: DashboardResumo | null = null
let _cacheTime = 0

export function useDashboard() {
  const [data, setData] = useState<DashboardResumo | null>(_cache)
  const [loading, setLoading] = useState(!_cache)
  const [error, setError] = useState<string | null>(null)

  const carregar = useCallback(async (forcar = false) => {
    const agora = Date.now()
    if (!forcar && _cache && agora - _cacheTime < CACHE_TTL) {
      setData(_cache)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await getDashboardResumo()
      _cache = res
      _cacheTime = Date.now()
      setData(res)
    } catch {
      setError('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  // Utilitário para somar saldos (Pessoal e Empresa)
  const somarSaldo = (lista: Transacao[], pessoal: boolean) =>
    lista.filter(t => t.ehPessoal === pessoal).reduce((acc, t) => {
      return acc + (t.tipo === 'Entrada' ? Math.abs(t.valor) : -Math.abs(t.valor))
    }, 0)

  // Cálculo do total somando Eu e Ela (Pessoal + Empresa)
  const totalPatrimonio = data 
    ? somarSaldo(data.transacoesEu, true) + somarSaldo(data.transacoesEu, false) + 
      somarSaldo(data.transacoesDela, true) + somarSaldo(data.transacoesDela, false)
    : 0

  return {
    data,
    loading,
    error,
    totalPatrimonio,
    recarregar: () => carregar(true)
  }
}
import axios from 'axios'
import type { ChecklistItem, DashboardHomeEvolution, DashboardHomeOverview, DashboardResumo, Desejo, Meta, Transacao } from '../types/models'
import { readCachedValue, writeCachedValue } from '../lib/persistedApiCache'

const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:5163' : 'https://minhavidaapi.onrender.com')

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config

    if (config && !config._retry && (error.code === 'ECONNABORTED' || !error.response)) {
      config._retry = true
      await new Promise((resolve) => setTimeout(resolve, 800))
      return api(config)
    }

    return Promise.reject(error)
  },
)

let warmupPromise: Promise<unknown> | null = null
const CACHE_MAX_AGE = 1000 * 60 * 60 * 12

const cacheKeys = {
  homeOverview: 'dashboard-home-overview',
  homeEvolution: 'dashboard-home-evolution',
  transacoesPeriodo: (responsavel: 'Eu' | 'Namorada', mes: number, ano: number) => `transacoes-${responsavel}-${ano}-${mes}`,
  transacoesGerais: (mes: number, ano: number, responsavel?: 'Eu' | 'Namorada' | 'Todos') => `transacoes-gerais-${responsavel ?? 'Todos'}-${ano}-${mes}`,
}

export function warmUpAPI() {
  if (warmupPromise) return warmupPromise

  warmupPromise = api.get('/healthz').catch(() => undefined)
  return warmupPromise
}

export const getCachedDashboardHomeResumo = () =>
  readCachedValue<DashboardHomeOverview>(cacheKeys.homeOverview, CACHE_MAX_AGE)

export const getCachedDashboardHomeEvolution = () =>
  readCachedValue<DashboardHomeEvolution>(cacheKeys.homeEvolution, CACHE_MAX_AGE)

export const getCachedTransacoesPorPeriodo = (
  responsavel: 'Eu' | 'Namorada',
  mes: number,
  ano: number,
) => readCachedValue<Transacao[]>(cacheKeys.transacoesPeriodo(responsavel, mes, ano), CACHE_MAX_AGE)

export const getCachedTransacoesGeraisPorPeriodo = (
  mes: number,
  ano: number,
  responsavel?: 'Eu' | 'Namorada' | 'Todos',
) => readCachedValue<Transacao[]>(cacheKeys.transacoesGerais(mes, ano, responsavel), CACHE_MAX_AGE)

export const getDashboardResumo = (): Promise<DashboardResumo> =>
  api.get('/api/dashboard/resumo').then((response) => response.data)

export const getDashboardHomeResumo = (): Promise<DashboardHomeOverview> =>
  api.get('/api/dashboard/home').then((response) => {
    writeCachedValue(cacheKeys.homeOverview, response.data)
    return response.data
  })

export const getDashboardHomeEvolution = (): Promise<DashboardHomeEvolution> =>
  api.get('/api/dashboard/evolution').then((response) => {
    writeCachedValue(cacheKeys.homeEvolution, response.data)
    return response.data
  })

export const getTransacoes = (responsavel: string): Promise<Transacao[]> =>
  api.get(`/api/transacoes/${responsavel}`).then((response) => response.data)

export const getTransacoesPorPeriodo = (
  responsavel: 'Eu' | 'Namorada',
  mes: number,
  ano: number,
): Promise<Transacao[]> =>
  api.get(`/api/transacoes/${responsavel}`, {
    params: { mes, ano },
  }).then((response) => {
    writeCachedValue(cacheKeys.transacoesPeriodo(responsavel, mes, ano), response.data)
    return response.data
  })

export const getTransacoesGeraisPorPeriodo = (
  mes: number,
  ano: number,
  responsavel?: 'Eu' | 'Namorada' | 'Todos',
): Promise<Transacao[]> =>
  api.get('/api/transacoes', {
    params: {
      mes,
      ano,
      responsavel: responsavel && responsavel !== 'Todos' ? responsavel : undefined,
    },
  }).then((response) => {
    writeCachedValue(cacheKeys.transacoesGerais(mes, ano, responsavel), response.data)
    return response.data
  })

export const getMetas = (): Promise<Meta[]> =>
  api.get('/api/metas').then((response) => response.data)

export const getDesejos = (): Promise<Desejo[]> =>
  api.get('/api/desejos').then((response) => response.data)

export const postTransacao = (transacao: Partial<Transacao>): Promise<Transacao> =>
  api.post('/api/transacoes', {
    ...transacao,
    id: 0,
    valor: Math.abs(Number(transacao.valor)),
    data: transacao.data ?? new Date().toISOString(),
  }).then((response) => response.data)

export const deleteTransacao = (id: number): Promise<void> =>
  api.delete(`/api/transacoes/${id}`).then(() => undefined)

export const postMeta = (meta: Partial<Meta>): Promise<Meta> =>
  api.post('/api/metas', { ...meta, id: 0 }).then((response) => response.data)

export const putMeta = (meta: Meta): Promise<Meta> =>
  api.put(`/api/metas/${meta.id}`, meta).then((response) => response.data)

export const deleteMeta = (id: number): Promise<void> =>
  api.delete(`/api/metas/${id}`).then(() => undefined)

export const realizarAporte = (id: number, valor: number): Promise<Meta> =>
  api.post(`/api/metas/${id}/aporte`, valor, {
    headers: { 'Content-Type': 'application/json' },
  }).then((response) => response.data)

export const postDesejo = (desejo: Partial<Desejo>): Promise<Desejo> =>
  api.post('/api/desejos', {
    ...desejo,
    id: 0,
    dataAlvo: desejo.dataAlvo
      ? new Date(desejo.dataAlvo).toISOString()
      : new Date().toISOString(),
  }).then((response) => response.data)

export const deleteDesejo = (id: number): Promise<void> =>
  api.delete(`/api/desejos/${id}`).then(() => undefined)

export const getChecklistMensal = (mes: string): Promise<ChecklistItem[]> =>
  api.get('/api/checklist', { params: { mes } }).then((response) => response.data)

export const addChecklistItem = (item: Partial<ChecklistItem>): Promise<ChecklistItem> =>
  api.post('/api/checklist', item).then((response) => response.data)

export const updateChecklistItem = (item: ChecklistItem): Promise<ChecklistItem> =>
  api.put(`/api/checklist/${item.id}`, item).then((response) => response.data)

export const deleteChecklistItem = (id: number): Promise<void> =>
  api.delete(`/api/checklist/${id}`).then(() => undefined)

export const resetChecklistMensal = (mes: string): Promise<void> =>
  api.post('/api/checklist/reset', null, { params: { mes } }).then(() => undefined)

export const baixarBackupLocal = (): Promise<Blob> =>
  api.get('/api/local/backup', { responseType: 'blob' }).then((response) => response.data)

export const restaurarBackupLocal = (file: File): Promise<{ message: string }> => {
  const formData = new FormData()
  formData.append('file', file)

  return api.post('/api/local/restore', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then((response) => response.data)
}

export default api

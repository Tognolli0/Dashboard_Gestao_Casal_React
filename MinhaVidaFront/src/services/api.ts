import axios from 'axios'
import type { DashboardResumo, Desejo, Meta, Transacao } from '../types/models'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'https://minhavidaapi.onrender.com'

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

    if (config && !config._retry && (error.code === 'ECONNABORTED' || error.response?.status === 502 || error.response?.status === 503)) {
      config._retry = true
      await new Promise((resolve) => setTimeout(resolve, 1500))
      return api(config)
    }

    return Promise.reject(error)
  },
)

let warmupPromise: Promise<unknown> | null = null

export function warmUpAPI() {
  if (warmupPromise) return warmupPromise

  warmupPromise = api.get('/healthz').catch(() => undefined)
  return warmupPromise
}

export const getDashboardResumo = (): Promise<DashboardResumo> =>
  api.get('/api/dashboard/resumo').then((response) => response.data)

export const getTransacoes = (responsavel: string): Promise<Transacao[]> =>
  api.get(`/api/transacoes/${responsavel}`).then((response) => response.data)

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

export default api


import axios from 'axios';
import type { Transacao, Meta, Desejo, DashboardResumo } from '../types/models';

// 1. Configuração Base
const api = axios.create({
  // A URL que aparece na sua imagem do terminal
  baseURL: 'https://minhavidaapi.onrender.com',
  timeout: 120000,
})

// Funções para buscar os dados
export const getDashboardResumo = (): Promise<DashboardResumo> =>
  api.get('/api/dashboard/resumo').then(r => r.data)

// 3. Transações (Financeiro)
export const getTransacoes = (responsavel: string): Promise<Transacao[]> =>
  api.get(`/api/transacoes/${responsavel}`).then(r => r.data);

export const postTransacao = (t: Partial<Transacao>): Promise<Transacao> =>
  api.post('/api/transacoes', t).then(r => r.data);

export const deleteTransacao = (id: number): Promise<void> =>
  api.delete(`/api/transacoes/${id}`).then(r => r.data);

// 4. Metas e Sonhos
export const getMetas = (): Promise<Meta[]> =>
  api.get('/api/metas').then(r => r.data);

export const postMeta = (m: Partial<Meta>): Promise<Meta> =>
  api.post('/api/metas', m).then(r => r.data);

export const deleteMeta = (id: number): Promise<void> =>
  api.delete(`/api/metas/${id}`).then(r => r.data);

export const realizarAporte = (id: number, valor: number): Promise<Meta> =>
  api.post(`/api/metas/${id}/aporte`, { valor }).then(r => r.data);

// 5. Bucket List (Desejos)
export const getDesejos = (): Promise<Desejo[]> =>
  api.get('/api/desejos').then(r => r.data);

export const postDesejo = (d: Partial<Desejo>): Promise<Desejo> =>
  api.post('/api/desejos', d).then(r => r.data);

export const deleteDesejo = (id: number): Promise<void> =>
  api.delete(`/api/desejos/${id}`).then(r => r.data);

export default api;
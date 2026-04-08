import axios from 'axios';
import type { Transacao, Meta, Desejo, DashboardResumo } from '../types/models';

const api = axios.create({
  baseURL: 'https://minhavidaapi.onrender.com',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Interceptor útil para não precisar repetir o .data em todo lugar internamente se quiser, 
// mas manteremos suas funções exportadas como estão para não quebrar seu código atual.
api.interceptors.response.use(
  response => response,
  error => {
    // Se a API demorar (Render dormindo), o erro de rede será capturado aqui
    console.error('Erro na chamada da API:', error.message);
    return Promise.reject(error);
  }
);

// --- FUNÇÕES DE BUSCA (Queries para o React Query) ---

export const getDashboardResumo = (): Promise<DashboardResumo> =>
  api.get('/api/dashboard/resumo').then(r => r.data);

// Importante: O React Query usará o 'responsavel' como chave de cache
export const getTransacoes = (responsavel: string): Promise<Transacao[]> =>
  api.get(`/api/transacoes/${responsavel}`).then(r => r.data);

export const getMetas = (): Promise<Meta[]> =>
  api.get('/api/metas').then(r => r.data);

export const getDesejos = (): Promise<Desejo[]> =>
  api.get('/api/desejos').then(r => r.data);

// --- FUNÇÕES DE ALTERAÇÃO (Mutations para o React Query) ---

export const postTransacao = (t: Partial<Transacao>): Promise<Transacao> =>
  api.post('/api/transacoes', t).then(r => r.data);

export const deleteTransacao = (id: number): Promise<void> =>
  api.delete(`/api/transacoes/${id}`);

export const postMeta = (m: Partial<Meta>): Promise<Meta> =>
  api.post('/api/metas', m).then(r => r.data);

export const deleteMeta = (id: number): Promise<void> =>
  api.delete(`/api/metas/${id}`);

export const realizarAporte = (id: number, valor: number): Promise<Meta> =>
  api.post(`/api/metas/${id}/aporte`, { valor }).then(r => r.data);

export const postDesejo = (d: Partial<Desejo>): Promise<Desejo> =>
  api.post('/api/desejos', d).then(r => r.data);

export const deleteDesejo = (id: number): Promise<void> =>
  api.delete(`/api/desejos/${id}`);

export default api;
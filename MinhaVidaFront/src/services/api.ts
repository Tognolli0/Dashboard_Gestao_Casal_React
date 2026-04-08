import axios from 'axios';
import type { Transacao, Meta, Desejo, DashboardResumo } from '../types/models';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'https://minhavidaapi.onrender.com',
    timeout: 120_000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Retry automático no cold start do Render
api.interceptors.response.use(
    res => res,
    async (error) => {
        const config = error.config;
        if (!config._retry && (error.code === 'ECONNABORTED' || error.response?.status === 503)) {
            config._retry = true;
            await new Promise(r => setTimeout(r, 3000));
            return api(config);
        }
        console.error('[API]', error.response?.status, error.message);
        return Promise.reject(error);
    }
);

let _warmed = false;
export function warmUpAPI() {
    if (_warmed) return;
    _warmed = true;
    api.get('/').catch(() => { });
}

// ── QUERIES ───────────────────────────────────────────────────────────────────

export const getDashboardResumo = (): Promise<DashboardResumo> =>
    api.get('/api/dashboard/resumo').then(r => r.data);

export const getTransacoes = (responsavel: string): Promise<Transacao[]> =>
    api.get(`/api/transacoes/${responsavel}`).then(r => r.data);

export const getMetas = (): Promise<Meta[]> =>
    api.get('/api/metas').then(r => r.data);

export const getDesejos = (): Promise<Desejo[]> =>
    api.get('/api/desejos').then(r => r.data);

// ── MUTATIONS ─────────────────────────────────────────────────────────────────

// Envia valor POSITIVO — o backend aplica o sinal correto baseado no campo Tipo
export const postTransacao = (t: Partial<Transacao>): Promise<Transacao> =>
    api.post('/api/transacoes', {
        ...t,
        id: 0,
        valor: Math.abs(Number(t.valor)),
        data: t.data ?? new Date().toISOString(),
    }).then(r => r.data);

export const deleteTransacao = (id: number): Promise<void> =>
    api.delete(`/api/transacoes/${id}`).then(() => undefined);

export const postMeta = (m: Partial<Meta>): Promise<Meta> =>
    api.post('/api/metas', { ...m, id: 0 }).then(r => r.data);

export const putMeta = (m: Meta): Promise<Meta> =>
    api.put(`/api/metas/${m.id}`, m).then(r => r.data);

export const deleteMeta = (id: number): Promise<void> =>
    api.delete(`/api/metas/${id}`).then(() => undefined);

export const realizarAporte = (id: number, valor: number): Promise<Meta> =>
    api.post(`/api/metas/${id}/aporte`, valor, {
        headers: { 'Content-Type': 'application/json' },
    }).then(r => r.data);

export const postDesejo = (d: Partial<Desejo>): Promise<Desejo> =>
    api.post('/api/desejos', {
        ...d,
        id: 0,
        dataAlvo: d.dataAlvo
            ? new Date(d.dataAlvo).toISOString()
            : new Date().toISOString(),
    }).then(r => r.data);

export const deleteDesejo = (id: number): Promise<void> =>
    api.delete(`/api/desejos/${id}`).then(() => undefined);

export default api;
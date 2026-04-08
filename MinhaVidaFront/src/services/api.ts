import axios from 'axios';
import type { Transacao, Meta, Desejo, DashboardResumo } from '../types/models';

// ── CLIENTE AXIOS OTIMIZADO ───────────────────────────────────────────────────
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'https://minhavidaapi.onrender.com',
    // 120s para o primeiro cold start do Render (free tier dorme após 15min)
    timeout: 120_000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Solicita compressão gzip/brotli ao servidor
        'Accept-Encoding': 'br, gzip, deflate',
    },
});

// ── INTERCEPTOR: log + retry automático ─────────────────────────────────────
let isWarming = false;

api.interceptors.response.use(
    response => response,
    async (error) => {
        const config = error.config;

        // Retry automático UMA vez em timeout ou erro 503 (Render acordando)
        if (
            !config._retry &&
            (error.code === 'ECONNABORTED' || error.response?.status === 503)
        ) {
            config._retry = true;
            console.warn('[API] Servidor dormindo, aguardando 3s e tentando novamente...');
            await new Promise(r => setTimeout(r, 3000));
            return api(config);
        }

        console.error('[API] Erro:', error.message);
        return Promise.reject(error);
    }
);

// ── WARM-UP: pinga a API assim que o módulo é carregado ──────────────────────
// Isso "acorda" o Render antes do usuário fazer a primeira requisição real.
export function warmUpAPI() {
    if (isWarming) return;
    isWarming = true;

    api.get('/').catch(() => {
        // Silencia erros — só estamos acordando o servidor
    });
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

export const postTransacao = (t: Partial<Transacao>): Promise<Transacao> =>
    api.post('/api/transacoes', t).then(r => r.data);

export const deleteTransacao = (id: number): Promise<void> =>
    api.delete(`/api/transacoes/${id}`).then(() => undefined);

export const postMeta = (m: Partial<Meta>): Promise<Meta> =>
    api.post('/api/metas', m).then(r => r.data);

export const deleteMeta = (id: number): Promise<void> =>
    api.delete(`/api/metas/${id}`).then(() => undefined);

export const realizarAporte = (id: number, valor: number): Promise<Meta> =>
    api.post(`/api/metas/${id}/aporte`, { valor }).then(r => r.data);

export const postDesejo = (d: Partial<Desejo>): Promise<Desejo> =>
    api.post('/api/desejos', d).then(r => r.data);

export const deleteDesejo = (id: number): Promise<void> =>
    api.delete(`/api/desejos/${id}`).then(() => undefined);

export default api;
import type { ReactNode } from 'react'

export function Card({
    children, className = '', onClick,
}: { children: ReactNode; className?: string; onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={`bg-white border border-slate-200 rounded-2xl ${onClick ? 'cursor-pointer hover:border-indigo-300 hover:shadow-md' : 'shadow-sm'
                } transition-all ${className}`}
        >
            {children}
        </div>
    )
}

export function StatCard({
    label, value, color = 'indigo', sub,
}: { label: string; value: string; color?: string; sub?: string }) {
    const colors: Record<string, string> = {
        indigo: 'border-l-indigo-600',
        pink: 'border-l-pink-500',
        green: 'border-l-emerald-500',
        amber: 'border-l-amber-500',
        red: 'border-l-rose-500',
    }
    return (
        <div className={`bg-white border border-slate-200 border-l-4 ${colors[color] ?? colors.indigo} rounded-2xl p-5 shadow-sm`}>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-1 font-bold italic">{sub}</p>}
        </div>
    )
}

export function ProgressBar({
    value, max, color = '#6366f1',
}: { value: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
    return (
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color }}
            />
        </div>
    )
}

export function Badge({
    label, color = 'indigo',
}: { label: string; color?: string }) {
    const c: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        pink: 'bg-pink-50 text-pink-600 border-pink-100',
        green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        red: 'bg-rose-50 text-rose-600 border-rose-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        gray: 'bg-slate-100 text-slate-500 border-slate-200',
    }
    return (
        <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${c[color] ?? c.gray}`}>
            {label}
        </span>
    )
}

export function Modal({
    open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fade-up">
        <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg leading-none"
        >
                    ✕
                </button>
                <h3 className="text-base font-black text-slate-900 mb-4 italic tracking-tight">{title}</h3>
                {children}
            </div>
        </div>
    )
}

export function Btn({
    children, onClick, variant = 'primary', disabled, className = '',
}: {
    children: ReactNode
    onClick?: () => void
    variant?: 'primary' | 'ghost' | 'danger'
    disabled?: boolean
    className?: string
}) {
    const v = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
        ghost: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
        danger: 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100',
    }
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40 active:scale-95 ${v[variant]} ${className}`}
        >
            {children}
        </button>
    )
}

export function Input({
    label, value, onChange, type = 'text', placeholder,
}: {
    label: string
    value: string | number
    onChange: (v: string) => void
    type?: string
    placeholder?: string
}) {
    return (
        <label className="flex flex-col gap-1 w-full">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</span>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                // min="0" evita valores negativos em campos number
                {...(type === 'number' ? { min: '0', step: 'any' } : {})}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
            />
        </label>
    )
}

export function Select({
    label, value, onChange, options,
}: {
    label: string
    value: string
    onChange: (v: string) => void
    options: { value: string; label: string }[]
}) {
    return (
        <label className="flex flex-col gap-1 w-full">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</span>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm appearance-none cursor-pointer"
                >
                    {options.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                </div>
            </div>
        </label>
    )
}

// ── Skeleton — muito melhor que spinner para perceived performance ─────────────
export function SkeletonCard({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-pulse ${className}`}>
            <div className="h-3 bg-slate-200 rounded-full w-1/3 mb-3" />
            <div className="h-7 bg-slate-200 rounded-full w-2/3" />
        </div>
    )
}

export function SkeletonDashboard() {
    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <div className="flex justify-between items-center border-b border-slate-100 pb-6 animate-pulse">
                <div className="space-y-2">
                    <div className="h-8 bg-slate-200 rounded w-44" />
                    <div className="h-3 bg-slate-100 rounded w-32" />
                </div>
                <div className="h-10 bg-slate-200 rounded-2xl w-56" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[0, 1, 2].map(i => (
                    <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                        <div className="h-2 bg-slate-100 rounded-full" />
                        <div className="flex justify-between">
                            <div className="h-3 bg-slate-100 rounded w-1/3" />
                            <div className="h-3 bg-slate-200 rounded w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function Spinner() {
    return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
    )
}

export const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

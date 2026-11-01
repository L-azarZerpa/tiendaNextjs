'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage('¡Correo enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-md mb-4">
                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                    ← Volver al login
                </Link>
            </div>

            <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-md border border-slate-100">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Recuperar Contraseña</h1>
                    <p className="text-sm text-slate-500 mt-1">Te enviaremos un enlace de recuperación</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg">
                        {message}
                    </div>
                )}

                <form onSubmit={handleReset} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@correo.com"
                            required
                            className="px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 outline-none focus:bg-white focus:border-slate-800 transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {loading ? "Enviando enlace..." : "Enviar enlace de recuperación"}
                    </button>
                </form>
            </div>
        </div>
    );
}
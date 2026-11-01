'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Supabase procesa automáticamente el token de la URL al cargar esta página.
    // Opcional: podemos validar si hay una sesión activa o un evento de recuperación.
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === "PASSWORD_RECOVERY") {
                // El usuario entró mediante el enlace de recuperación con éxito
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setLoading(true);

        // Actualizamos la contraseña del usuario autenticado por el token del link
        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
            // Redirigir al login después de 3 segundos para que inicie sesión con su nueva clave
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col items-center justify-center px-4 py-12">
            <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-md border border-slate-100">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Nueva Contraseña</h1>
                    <p className="text-sm text-slate-500 mt-1">Ingresa tu nueva contraseña para tu cuenta</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="flex flex-col gap-4 text-center">
                        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg font-medium">
                            ¡Contraseña actualizada con éxito! Redirigiendo al inicio de sesión...
                        </div>
                        <Link
                            href="/login"
                            className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors"
                        >
                            Ir a Iniciar Sesión ahora
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-700">Nueva Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 outline-none focus:bg-white focus:border-slate-800 transition-all"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-700">Confirmar Nueva Contraseña</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 outline-none focus:bg-white focus:border-slate-800 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {loading ? "Actualizando..." : "Actualizar Contraseña"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
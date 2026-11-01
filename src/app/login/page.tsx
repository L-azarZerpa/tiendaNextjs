'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { createClient } from '@/lib/supabase/client';
import { verifyRecaptcha } from '@/app/actions/recaptcha';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Hook para ejecutar reCAPTCHA v3
    const { executeRecaptcha } = useGoogleReCaptcha();

    // Inicializamos el cliente de Supabase optimizado para SSR
    const supabase = createClient();

    // Asegurar que el estado de carga se resetea al montar el componente
    useEffect(() => {
        setLoading(false);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // 1. Verificar si reCAPTCHA está disponible
        if (!executeRecaptcha) {
            setError('La verificación de seguridad aún no está lista. Intenta nuevamente.');
            setLoading(false);
            return;
        }

        try {
            // 2. Obtener token de reCAPTCHA para la acción 'login'
            const token = await executeRecaptcha('login');

            // 3. Validar token con la Server Action
            const isHuman = await verifyRecaptcha(token);
            if (!isHuman) {
                setError('Acceso denegado: Actividad sospechosa detectada por el sistema anti-bot.');
                setLoading(false);
                return;
            }

            // 4. Autenticar en Supabase si la verificación fue exitosa
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
                setLoading(false);
            } else {
                // Recarga limpia para sincronizar la sesión y evitar estados residuales en caché
                window.location.href = '/';
            }
        } catch (err) {
            setError('Error durante la verificación de seguridad.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col items-center justify-center px-4 py-12">
            {/* Enlace para volver */}
            <div className="w-full max-w-md mb-4">
                <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                    ← Volver al inicio
                </Link>
            </div>

            <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-md border border-slate-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Iniciar Sesión</h1>
                    <p className="text-sm text-slate-500 mt-1">Ingresa a tu cuenta de la tienda de licores</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
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

                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-700">Contraseña</label>
                            <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                        {loading ? "Verificando e iniciando..." : "Entrar"}
                    </button>
                </form>

                <p className="text-center text-xs text-slate-500 mt-6">
                    ¿No tienes una cuenta?{" "}
                    <Link href="/register" className="text-slate-900 font-semibold hover:underline">
                        Regístrate aquí
                    </Link>
                </p>
            </div>
        </div>
    );
}
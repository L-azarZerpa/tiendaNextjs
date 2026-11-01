'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function RegisterPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) throw error;

            router.push("/");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al registrarse.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col items-center justify-center px-5 py-10">
            {/* Enlace para volver */}
            <div className="w-full max-w-[400px] mb-4">
                <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                    ← Volver al inicio
                </Link>
            </div>

            <div className="bg-white max-w-[400px] w-full rounded-2xl shadow-md p-8 border border-slate-100 flex flex-col gap-6">
                <div className="text-center flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-slate-900">Crear Cuenta</h1>
                    <p className="text-slate-500 text-sm">Regístrate para comenzar a comprar</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-lg">
                        {error}
                    </div>
                )}

                <form className="flex flex-col gap-4" onSubmit={handleRegister}>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Nombre Completo</label>
                        <input
                            type="text"
                            placeholder="Tu nombre"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 outline-none text-sm text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 transition-all"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Correo Electrónico</label>
                        <input
                            type="email"
                            placeholder="tucorreo@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 outline-none text-sm text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 transition-all"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Contraseña</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 outline-none text-sm text-slate-800 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm mt-2 cursor-pointer disabled:opacity-50"
                    >
                        {loading ? "Registrando..." : "Registrarse"}
                    </button>
                </form>

                <div className="text-center text-sm text-slate-500 border-t pt-4">
                    ¿Ya tienes una cuenta?{" "}
                    <Link href="/login" className="text-slate-800 font-semibold hover:underline">
                        Inicia sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}
'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

// Componente interno para el buscador envuelto en Suspense
function SearchBar() {
    const searchParams = useSearchParams();
    const currentQuery = searchParams.get('q') || '';

    return (
        <form method="GET" action="/" className="flex-1 max-w-[450px]">
            <input
                type="text"
                name="q"
                defaultValue={currentQuery}
                placeholder="Buscar por nombre o categoría (ej. Whisky, Vinos)..."
                className="w-full px-3.5 py-2 rounded-full border border-slate-300 outline-none text-sm text-slate-800 placeholder-slate-400 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
        </form>
    );
}

export default function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const router = useRouter();

    // Inicializamos el cliente de Supabase optimizado para el navegador con cookies SSR
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    // Sincronizar el contador del carrito en tiempo real
    useEffect(() => {
        const updateCartCount = () => {
            const savedCart = localStorage.getItem("mi_tienda_carrito");
            if (savedCart) {
                try {
                    const items = JSON.parse(savedCart);
                    const totalQuantity = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
                    setCartCount(totalQuantity);
                } catch {
                    setCartCount(0);
                }
            } else {
                setCartCount(0);
            }
        };

        updateCartCount();

        // Escuchar eventos personalizados y de almacenamiento
        window.addEventListener("cart-updated", updateCartCount);
        window.addEventListener("storage", updateCartCount);

        return () => {
            window.removeEventListener("cart-updated", updateCartCount);
            window.removeEventListener("storage", updateCartCount);
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <header className="bg-slate-800 text-white px-6 py-3.5 flex items-center justify-between shadow-sm gap-4 relative z-50">
            {/* Brand */}
            <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-90 flex-shrink-0">
                Mi Tienda
            </Link>

            {/* Buscador conectado a Prisma vía GET envuelto en Suspense */}
            <Suspense fallback={<div className="flex-1 max-w-[450px] h-9 bg-slate-700/50 rounded-full animate-pulse" />}>
                <SearchBar />
            </Suspense>

            {/* Acciones (Carrito + Auth) */}
            <div className="flex items-center gap-3 flex-shrink-0">
                <Link
                    href="/carrito"
                    className="relative bg-slate-700 hover:bg-slate-600 text-white text-sm px-3.5 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                >
                    🛒 Carrito
                    {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm">
                            {cartCount}
                        </span>
                    )}
                </Link>

                {loading ? (
                    <span className="text-xs text-slate-400">...</span>
                ) : user ? (
                    <div className="flex items-center gap-3">
                        <span className="text-xs bg-slate-700 border border-slate-600 px-3 py-2 rounded-lg text-slate-200 font-medium">
                            {user.email}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3.5 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link
                            href="/login"
                            className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3.5 py-2 rounded-lg font-medium transition-colors"
                        >
                            Iniciar Sesión
                        </Link>
                        <Link
                            href="/register"
                            className="text-xs bg-white text-slate-900 hover:bg-slate-100 px-3.5 py-2 rounded-lg font-semibold transition-colors"
                        >
                            Registrarse
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}
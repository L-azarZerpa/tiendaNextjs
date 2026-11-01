'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    category: string;
}

export default function CartPage() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [orderCompleted, setOrderCompleted] = useState(false);
    const router = useRouter();

    // 1. Cargamos el carrito del localStorage y verificamos la sesión de Supabase
    useEffect(() => {
        const savedCart = localStorage.getItem("mi_tienda_carrito");
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }

        const checkUserSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoadingAuth(false);
        };

        checkUserSession();

        // Escuchar cambios de sesión en tiempo real
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Función para actualizar el almacenamiento local
    const updateLocalStorage = (newCart: CartItem[]) => {
        setCart(newCart);
        localStorage.setItem("mi_tienda_carrito", JSON.stringify(newCart));
        // Notificamos cambios al header global
        window.dispatchEvent(new Event("cart-updated"));
    };

    // Incrementar o decrementar cantidad
    const handleQuantityChange = (id: string, delta: number) => {
        const updated = cart.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
        }).filter(Boolean) as CartItem[];

        updateLocalStorage(updated);
    };

    // Eliminar producto individual
    const handleRemove = (id: string) => {
        const updated = cart.filter(item => item.id !== id);
        updateLocalStorage(updated);
    };

    // Calcular el precio total del carrito
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Simular el proceso de pago con 0% comisión
    const handleSimulatedCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        // Doble validación de seguridad por si acaso
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
            return;
        }

        setIsCheckingOut(true);

        setTimeout(() => {
            setIsCheckingOut(false);
            localStorage.removeItem("mi_tienda_carrito"); // Vaciamos el carrito
            setCart([]);
            window.dispatchEvent(new Event("cart-updated")); // 🔔 Avisamos al Header que el carrito se vació
            setOrderCompleted(false); // Reseteamos el estado para futuras compras
            router.push('/'); // Mandamos directo a la vista principal para seguir comprando
        }, 1500);
    };

    if (orderCompleted) {
        return null; // Ya no necesitamos mostrar pantalla estática porque redirige directo a la principal
    }

    return (
        <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col antialiased">
            <main className="flex-1 max-w-[1000px] w-full mx-auto px-5 py-10">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Tu Carrito de Compras</h1>
                    <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline">
                        ← Seguir comprando
                    </Link>
                </div>

                {cart.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl shadow-md text-center flex flex-col items-center gap-4">
                        <p className="text-slate-500 text-lg">Tu carrito está vacío.</p>
                        <Link
                            href="/"
                            className="bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
                        >
                            Explorar Licores
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LISTA DE PRODUCTOS EN EL CARRITO */}
                        <div className="lg:col-span-2 flex flex-col gap-4">
                            {cart.map((item) => (
                                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 border border-slate-100">
                                    <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className="w-20 h-20 object-cover rounded-lg bg-slate-100"
                                    />
                                    <div className="flex-1 flex flex-col gap-1">
                                        <span className="text-xs uppercase text-slate-400 font-bold">{item.category}</span>
                                        <h3 className="font-semibold text-slate-800 text-base leading-tight">{item.name}</h3>
                                        <span className="text-slate-900 font-bold">${item.price.toFixed(2)}</span>
                                    </div>

                                    {/* Controles de Cantidad */}
                                    <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1 bg-slate-50">
                                        <button
                                            onClick={() => handleQuantityChange(item.id, -1)}
                                            className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                                        >
                                            -
                                        </button>
                                        <span className="text-sm font-semibold px-2 text-slate-800">{item.quantity}</span>
                                        <button
                                            onClick={() => handleQuantityChange(item.id, 1)}
                                            className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Botón eliminar */}
                                    <button
                                        onClick={() => handleRemove(item.id)}
                                        className="text-red-500 hover:text-red-700 p-2 text-sm font-medium cursor-pointer"
                                        title="Eliminar producto"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* RESUMEN DE LA ORDEN Y PAGO */}
                        <div className="bg-white p-6 rounded-2xl shadow-md h-fit flex flex-col gap-4">
                            <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Resumen del Pedido</h2>

                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Subtotal</span>
                                <span>${totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Comisión de pasarela</span>
                                <span className="text-emerald-600 font-bold">0.00$ (0%)</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-slate-900 border-t pt-3">
                                <span>Total a Pagar</span>
                                <span className="text-xl">${totalAmount.toFixed(2)}</span>
                            </div>

                            {loadingAuth ? (
                                <p className="text-xs text-slate-400 text-center py-4">Verificando sesión...</p>
                            ) : user ? (
                                // Si está logueado, mostramos el formulario de pago simulado
                                <form onSubmit={handleSimulatedCheckout} className="flex flex-col gap-3 mt-4">
                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600 mb-1">
                                        Comprando como: <strong className="text-slate-900">{user.email}</strong>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-600">Número de Tarjeta (Simulado)</label>
                                        <input type="text" placeholder="4242 •••• •••• 4242" required className="px-3.5 py-2 border rounded-lg text-sm bg-white outline-none focus:border-slate-600" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="text" placeholder="MM/AA" required className="px-3.5 py-2 border rounded-lg text-sm bg-white outline-none focus:border-slate-600" />
                                        <input type="text" placeholder="CVV" required className="px-3.5 py-2 border rounded-lg text-sm bg-white outline-none focus:border-slate-600" />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isCheckingOut}
                                        className="w-full mt-2 bg-slate-900 text-white py-3 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        {isCheckingOut ? "Procesando pago..." : `Pagar $${totalAmount.toFixed(2)}`}
                                    </button>
                                </form>
                            ) : (
                                // Si NO está logueado, bloqueamos el pago y le pedimos iniciar sesión
                                <div className="flex flex-col gap-3 mt-4 p-4 rounded-xl text-center">
                                    <Link
                                        href="/login"
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium text-sm transition-colors text-center"
                                    >
                                        Pagar
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
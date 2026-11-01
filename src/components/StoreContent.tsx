'use client';

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
    id: string;
    name: string;
    slug: string;
    price: any;
    category: string;
    imageUrl: string | null;
}

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    category: string;
}

export default function StoreContent({ products, searchQuery }: { products: Product[]; searchQuery: string }) {
    const [cart, setCart] = useState<CartItem[]>([]);

    // Cargar y sincronizar carrito del localStorage al montar y al escuchar eventos
    useEffect(() => {
        const syncCart = () => {
            const saved = localStorage.getItem("mi_tienda_carrito");
            if (saved) {
                try {
                    setCart(JSON.parse(saved));
                } catch {
                    setCart([]);
                }
            } else {
                setCart([]);
            }
        };

        syncCart();

        // Escuchar eventos para actualizar o vaciar el widget del carrito en tiempo real
        window.addEventListener("cart-updated", syncCart);
        window.addEventListener("storage", syncCart);

        return () => {
            window.removeEventListener("cart-updated", syncCart);
            window.removeEventListener("storage", syncCart);
        };
    }, []);

    const saveCart = (newCart: CartItem[]) => {
        setCart(newCart);
        localStorage.setItem("mi_tienda_carrito", JSON.stringify(newCart));
        window.dispatchEvent(new Event("cart-updated"));
    };

    // Función para agregar producto al carrito desde la grilla
    const addToCart = (product: Product) => {
        const existing = cart.find(item => item.id === product.id);
        let updated;
        if (existing) {
            updated = cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
        } else {
            updated = [...cart, {
                id: product.id,
                name: product.name,
                price: Number(product.price),
                quantity: 1,
                imageUrl: product.imageUrl || 'https://via.placeholder.com/280x200?text=Sin+Imagen',
                category: product.category
            }];
        }
        saveCart(updated);
    };

    const updateQuantity = (id: string, delta: number) => {
        const updated = cart.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
        }).filter(Boolean) as CartItem[];
        saveCart(updated);
    };

    const removeFromCart = (id: string) => {
        const updated = cart.filter(item => item.id !== id);
        saveCart(updated);
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const hasItems = cart.length > 0;

    return (
        <div className={`w-full mx-auto px-5 py-10 grid gap-8 items-start transition-all ${hasItems ? "max-w-[1300px] grid-cols-1 lg:grid-cols-[1fr_350px]" : "max-w-[1000px] grid-cols-1"
            }`}>

            {/* COLUMNA IZQUIERDA: GRILLA DE PRODUCTOS */}
            <div className="flex flex-col gap-6 w-full">
                {searchQuery && (
                    <div className="text-sm text-slate-600 flex justify-between items-center bg-white px-4 py-3 rounded-lg shadow-sm">
                        <span>Resultados para: <strong>&quot;{searchQuery}&quot;</strong> ({products.length} encontrados)</span>
                        <Link href="/" className="text-blue-600 hover:underline text-xs font-medium">
                            Limpiar búsqueda
                        </Link>
                    </div>
                )}

                {products.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                        <p className="text-slate-500 text-lg">No se encontraron productos que coincidan con tu búsqueda.</p>
                        <Link href="/" className="mt-4 inline-block bg-slate-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-600 transition-colors">
                            Ver todos los productos
                        </Link>
                    </div>
                ) : (
                    <div className={`grid grid-cols-1 sm:grid-cols-2 ${hasItems ? 'xl:grid-cols-3' : 'lg:grid-cols-3'} gap-6 justify-center`}>
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white w-full max-w-[280px] rounded-xl overflow-hidden shadow-md hover:-translate-y-1 hover:shadow-lg transition-all duration-200 flex flex-col group mx-auto"
                            >
                                <Link href={`/producto/${product.slug}`}>
                                    <img
                                        src={product.imageUrl || 'https://via.placeholder.com/280x200?text=Sin+Imagen'}
                                        alt={product.name}
                                        className="w-full h-[200px] object-cover bg-slate-200 cursor-pointer"
                                    />
                                </Link>
                                <div className="p-4 flex flex-col gap-2 flex-1">
                                    <span className="text-[0.75rem] uppercase text-slate-500 font-bold tracking-wider">
                                        {product.category}
                                    </span>
                                    <Link href={`/producto/${product.slug}`}>
                                        <h3 className="text-[1.05rem] font-medium text-slate-800 leading-tight group-hover:text-slate-600 transition-colors cursor-pointer">
                                            {product.name}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center gap-1 text-amber-500 text-sm">
                                        ★ ★ ★ ★ ★ <span className="text-slate-400 text-xs ml-1">(24)</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                                        <span className="text-xl font-bold text-slate-900">${Number(product.price).toFixed(2)}</span>
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="bg-slate-800 text-white px-3.5 py-2 rounded-md text-xs font-medium hover:bg-slate-900 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                                        >
                                            🛒 Agregar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* COLUMNA DERECHA: SIDEBAR DEL CARRITO (SOLO APARECE SI HAY 1 O MÁS PRODUCTOS) */}
            {hasItems && (
                <aside className="bg-white p-5 rounded-2xl shadow-md sticky top-6 flex flex-col gap-4 border border-slate-100 animate-fadeIn">
                    <div className="flex items-center justify-between border-b pb-3">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            🛒 Tu Carrito
                        </h2>
                        <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                        </span>
                    </div>

                    <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
                        {cart.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <img src={item.imageUrl} alt={item.name} className="w-11 h-11 object-cover rounded-lg bg-white" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-semibold text-slate-800 truncate">{item.name}</h4>
                                    <span className="text-xs font-bold text-slate-900">${item.price.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                                    <button
                                        onClick={() => updateQuantity(item.id, -1)}
                                        className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                                    >
                                        -
                                    </button>
                                    <span className="text-xs font-bold px-1 text-slate-800">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, 1)}
                                        className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-red-400 hover:text-red-600 text-xs font-bold p-1 cursor-pointer"
                                    title="Eliminar"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="border-t pt-3 flex flex-col gap-3 mt-2">
                        <div className="flex justify-between text-sm font-semibold text-slate-600">
                            <span>Subtotal</span>
                            <span>${totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold text-slate-600">
                            <span>Comisión</span>
                            <span className="text-emerald-600 font-bold">$0.00 (0%)</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-slate-900 border-t pt-2">
                            <span>Total</span>
                            <span className="text-lg">${totalAmount.toFixed(2)}</span>
                        </div>

                        <div className="flex flex-col gap-2 mt-2">
                            <Link
                                href="/carrito"
                                className="w-full bg-slate-800 text-white text-center py-2.5 rounded-xl text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm"
                            >
                                Ver Carrito Completo & Pagar
                            </Link>
                        </div>
                    </div>
                </aside>
            )}

        </div>
    );
}
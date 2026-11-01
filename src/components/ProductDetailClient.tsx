'use client';

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
    id: string;
    name: string;
    slug: string;
    price: any;
    category: string;
    abv: any;
    volume: string | null;
    stock: number;
    description: string | null;
    imageUrl: string | null;
    isFeatured: boolean;
}

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    category: string;
}

export default function ProductDetailClient({ product }: { product: Product }) {
    const [cart, setCart] = useState<CartItem[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem("mi_tienda_carrito");
        if (saved) {
            setCart(JSON.parse(saved));
        }
    }, []);

    const saveCart = (newCart: CartItem[]) => {
        setCart(newCart);
        localStorage.setItem("mi_tienda_carrito", JSON.stringify(newCart));
    };

    const addToCart = () => {
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
                imageUrl: product.imageUrl || 'https://via.placeholder.com/600',
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

            <section className="bg-white rounded-2xl shadow-md grid grid-cols-1 md:grid-cols-2 gap-9 p-8 border border-slate-100">
                <div className="flex flex-col gap-4 relative">
                    <div className="absolute top-3 left-3 right-3 flex justify-between z-10">
                        <span className="bg-slate-800 text-white text-[0.75rem] font-bold uppercase px-3 py-1.5 rounded-full">
                            {product.abv}% ABV
                        </span>
                        {product.isFeatured && (
                            <span className="bg-amber-600 text-white text-[0.75rem] font-bold uppercase px-3 py-1.5 rounded-full">
                                Premium
                            </span>
                        )}
                    </div>

                    <div className="relative w-full h-[380px] bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                        <img
                            src={product.imageUrl || 'https://via.placeholder.com/600'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-[0.85rem] uppercase font-bold text-slate-500 tracking-wider">
                        <span>{product.category}</span>
                    </div>

                    <h1 className="text-[1.75rem] font-bold text-slate-900 leading-tight m-0">
                        {product.name}
                    </h1>

                    <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-sm">
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-xs">Categoría</span>
                            <span className="text-slate-900 font-semibold">{product.category}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-xs">Graduación</span>
                            <span className="text-slate-900 font-semibold">{product.abv}% Alc. Vol.</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-xs">Contenido</span>
                            <span className="text-slate-900 font-semibold">{product.volume || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-xs">Stock Disponible</span>
                            <span className="text-slate-900 font-semibold">{product.stock} unidades</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                        <div className="flex text-amber-500 text-xl tracking-tight">★ ★ ★ ★ ★</div>
                        <span className="text-sm text-slate-900"><strong>4.8</strong> / 5</span>
                        <span className="text-xs text-slate-400">(128 valoraciones)</span>
                    </div>

                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-slate-900">${Number(product.price).toFixed(2)}</span>
                    </div>

                    <div className="text-slate-600 text-sm leading-relaxed flex flex-col gap-2">
                        <h3 className="text-slate-800 font-semibold text-base m-0">Descripción</h3>
                        <p className="m-0">{product.description || 'Sin descripción disponible.'}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <button
                            onClick={addToCart}
                            className="flex-1 bg-slate-800 text-white border-none rounded-lg text-base font-medium cursor-pointer flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors py-3 px-4 shadow-sm"
                        >
                            🛒 Añadir al Carrito
                        </button>
                    </div>
                </div>
            </section>

            {hasItems && (
                <aside className="bg-white p-5 rounded-2xl shadow-md sticky top-6 flex flex-col gap-4 border border-slate-100">
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
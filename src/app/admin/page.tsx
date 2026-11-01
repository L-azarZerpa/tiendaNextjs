import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Permitimos que la ruta sea bloqueante en Next.js 16
export const instant = false;

interface AdminProps {
    searchParams: Promise<{ q?: string; edit?: string }>;
}

// Función auxiliar para verificar si el usuario actual es Administrador con getUser()
async function verifyAdmin() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch { }
                },
            },
        }
    );

    // Usamos getUser() para validar de forma segura el token y la cookie en el servidor
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
    });

    if (!dbUser || dbUser.role !== "ADMIN") return null;

    return dbUser;
}

// 1. FUNCIÓN SERVER ACTION: CREAR O ACTUALIZAR PRODUCTO (Blindada)
async function handleSaveProduct(formData: FormData) {
    "use server";

    const adminUser = await verifyAdmin();
    if (!adminUser) {
        throw new Error("Acceso denegado: Se requieren privilegios de Administrador.");
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string) || 0;
    const category = formData.get("category") as string;
    const abv = parseFloat(formData.get("abv") as string) || 0;
    const stock = parseInt(formData.get("stock") as string) || 10;
    const description = formData.get("description") as string;
    const imageUrl = formData.get("imageUrl") as string;

    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    if (id) {
        // Actualizar producto existente
        await prisma.product.update({
            where: { id },
            data: {
                name,
                slug,
                price,
                category,
                abv,
                stock,
                description,
                imageUrl: imageUrl || "https://via.placeholder.com/600",
            },
        });
    } else {
        // Crear nuevo producto
        await prisma.product.create({
            data: {
                name,
                slug,
                price,
                category,
                abv,
                stock,
                description,
                imageUrl: imageUrl || "https://via.placeholder.com/600",
                isFeatured: true,
                volume: "750 ml",
            },
        });
    }

    revalidatePath("/");
    revalidatePath("/admin");
    redirect("/admin");
}

// 2. FUNCIÓN SERVER ACTION: ELIMINAR PRODUCTO (Blindada)
async function handleDeleteProduct(formData: FormData) {
    "use server";

    const adminUser = await verifyAdmin();
    if (!adminUser) {
        throw new Error("Acceso denegado: Se requieren privilegios de Administrador.");
    }

    const id = formData.get("id") as string;

    await prisma.product.delete({
        where: { id },
    });

    revalidatePath("/");
    revalidatePath("/admin");
}

export default async function AdminPage({ searchParams }: AdminProps) {
    // 🛡️ CAPA DE SEGURIDAD PRINCIPAL DE LA RUTA
    const adminUser = await verifyAdmin();
    if (!adminUser) {
        redirect("/");
    }

    const resolvedSearchParams = await searchParams;
    const searchQuery = resolvedSearchParams?.q || "";
    const editId = resolvedSearchParams?.edit;

    // Consultamos productos filtrando si hay búsqueda
    const productList = await prisma.product.findMany({
        where: searchQuery
            ? {
                OR: [
                    { name: { contains: searchQuery, mode: "insensitive" } },
                    { category: { contains: searchQuery, mode: "insensitive" } },
                ],
            }
            : {},
    });

    // Si hay un ID para editar, lo buscamos en la base de datos
    const productToEdit = editId
        ? await prisma.product.findUnique({ where: { id: editId } })
        : null;

    return (
        <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col relative antialiased">
            {/* CHECKBOX OCULTO PARA CONTROLAR EL MODAL DE CREAR */}
            <input type="checkbox" id="create-modal-toggle" className="hidden peer/create" />

            {/* MODAL FLOTANTE: AÑADIR NUEVO PRODUCTO */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden peer-checked/create:flex items-center justify-center p-4">
                <div className="bg-white max-w-[650px] w-full p-6 rounded-2xl shadow-2xl relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center border-b pb-3">
                        <h2 className="text-xl font-bold text-slate-900">Añadir Nuevo Producto</h2>
                        <label htmlFor="create-modal-toggle" className="text-slate-400 hover:text-slate-700 font-bold text-xl cursor-pointer">
                            ✕
                        </label>
                    </div>

                    <form action={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-slate-600">Nombre</label>
                            <input type="text" name="name" placeholder="Nombre del licor" required className="px-3.5 py-2 border rounded-lg text-sm bg-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-slate-600">Categoría</label>
                            <input type="text" name="category" placeholder="Ej. Whisky, Vinos" required className="px-3.5 py-2 border rounded-lg text-sm bg-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-slate-600">Precio ($)</label>
                            <input type="number" step="0.01" name="price" placeholder="0.00" required className="px-3.5 py-2 border rounded-lg text-sm bg-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-slate-600">Graduación (% ABV)</label>
                            <input type="number" step="0.1" name="abv" placeholder="40" className="px-3.5 py-2 border rounded-lg text-sm bg-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-slate-600">Stock</label>
                            <input type="number" name="stock" placeholder="10" className="px-3.5 py-2 border rounded-lg text-sm bg-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-slate-600">URL Imagen</label>
                            <input type="text" name="imageUrl" placeholder="https://..." className="px-3.5 py-2 border rounded-lg text-sm bg-white" />
                        </div>
                        <div className="sm:col-span-2 flex flex-col gap-1">
                            <label className="text-xs font-semibold text-slate-600">Descripción</label>
                            <textarea name="description" rows={3} placeholder="Descripción..." className="px-3.5 py-2 border rounded-lg text-sm bg-white"></textarea>
                        </div>
                        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                            <label htmlFor="create-modal-toggle" className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium cursor-pointer">
                                Cancelar
                            </label>
                            <button type="submit" className="px-5 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 cursor-pointer">
                                Guardar Producto
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* MODAL FLOTANTE: EDITAR PRODUCTO */}
            {productToEdit && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white max-w-[650px] w-full p-6 rounded-2xl shadow-2xl relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h2 className="text-xl font-bold text-slate-900">Editar Producto: {productToEdit.name}</h2>
                            <Link href="/admin" className="text-slate-400 hover:text-slate-700 font-bold text-xl">
                                ✕
                            </Link>
                        </div>

                        <form action={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input type="hidden" name="id" value={productToEdit.id} />

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-600">Nombre</label>
                                <input type="text" name="name" defaultValue={productToEdit.name} required className="px-3.5 py-2 border rounded-lg text-sm bg-white" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-600">Categoría</label>
                                <input type="text" name="category" defaultValue={productToEdit.category} required className="px-3.5 py-2 border rounded-lg text-sm bg-white" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-600">Precio ($)</label>
                                <input type="number" step="0.01" name="price" defaultValue={Number(productToEdit.price)} required className="px-3.5 py-2 border rounded-lg text-sm bg-white" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-600">Graduación (% ABV)</label>
                                <input type="number" step="0.1" name="abv" defaultValue={productToEdit.abv ?? ""} className="px-3.5 py-2 border rounded-lg text-sm bg-white" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-600">Stock</label>
                                <input type="number" name="stock" defaultValue={productToEdit.stock} className="px-3.5 py-2 border rounded-lg text-sm bg-white" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-600">URL Imagen</label>
                                <input type="text" name="imageUrl" defaultValue={productToEdit.imageUrl || ""} className="px-3.5 py-2 border rounded-lg text-sm bg-white" />
                            </div>
                            <div className="sm:col-span-2 flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-600">Descripción</label>
                                <textarea name="description" rows={3} defaultValue={productToEdit.description || ""} className="px-3.5 py-2 border rounded-lg text-sm bg-white"></textarea>
                            </div>
                            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                                <Link href="/admin" className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center">
                                    Cancelar
                                </Link>
                                <button type="submit" className="px-5 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 cursor-pointer">
                                    Actualizar Producto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* BARRA SUPERIOR ADMIN */}
            <header className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-medium tracking-tight">
                        Panel de Administración - Mi Tienda
                    </h1>
                    <span className="bg-emerald-600/30 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                        🛡️ {adminUser.email}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <label
                        htmlFor="create-modal-toggle"
                        className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                        + Nuevo Producto
                    </label>
                    <Link
                        href="/"
                        className="bg-slate-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors"
                    >
                        Ver Tienda
                    </Link>
                </div>
            </header>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 max-w-[1100px] w-full mx-auto px-5 py-10 flex flex-col gap-6">
                <section className="bg-white p-6 rounded-2xl shadow-md flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-900">
                            Inventario ({productList.length} productos)
                        </h2>

                        <form method="GET" action="/admin" className="w-full sm:w-[300px]">
                            <input
                                type="text"
                                name="q"
                                defaultValue={searchQuery}
                                placeholder="Filtrar inventario..."
                                className="w-full px-3.5 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-slate-600 bg-white"
                            />
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500">
                                    <th className="py-3 px-4">Imagen</th>
                                    <th className="py-3 px-4">Nombre</th>
                                    <th className="py-3 px-4">Categoría</th>
                                    <th className="py-3 px-4">Precio</th>
                                    <th className="py-3 px-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productList.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-slate-400">
                                            No se encontraron productos.
                                        </td>
                                    </tr>
                                ) : (
                                    productList.map((product) => (
                                        <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-3 px-4">
                                                <img
                                                    src={product.imageUrl || ''}
                                                    alt={product.name}
                                                    className="w-10 h-10 object-cover rounded-md bg-slate-200"
                                                />
                                            </td>
                                            <td className="py-3 px-4 font-medium text-slate-800">{product.name}</td>
                                            <td className="py-3 px-4 text-slate-500 uppercase text-xs font-bold">{product.category}</td>
                                            <td className="py-3 px-4 font-bold text-slate-900">${Number(product.price).toFixed(2)}</td>
                                            <td className="py-3 px-4 text-center flex items-center justify-center gap-2">
                                                {/* Botón Editar */}
                                                <Link
                                                    href={`/admin?edit=${product.id}`}
                                                    className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-600 transition-colors"
                                                >
                                                    Editar
                                                </Link>

                                                {/* Botón Eliminar */}
                                                <form action={handleDeleteProduct}>
                                                    <input type="hidden" name="id" value={product.id} />
                                                    <button
                                                        type="submit"
                                                        className="bg-red-500 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-600 transition-colors cursor-pointer"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </form>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}
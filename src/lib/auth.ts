import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";

// 1. Tu función para verificar si un ID es Administrador en Prisma
export async function checkIsAdmin(userId: string) {
    if (!userId) return false;

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    return user?.role === "ADMIN";
}

// 2. Función completa para proteger páginas y Server Actions (obtiene sesión y valida con la función de arriba)
export async function verifyAdmin() {
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
                    } catch {
                        // Ignorado en Server Components de lectura
                    }
                },
            },
        }
    );

    // Obtenemos la sesión actual del servidor
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    // Verificamos el rol usando checkIsAdmin
    const isAdmin = await checkIsAdmin(session.user.id);
    if (!isAdmin) return null;

    // Retornamos la información del usuario si pasa el filtro
    return session.user;
}
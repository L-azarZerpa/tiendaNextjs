import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/ProductDetailClient";

export const instant = false;

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function ProductDetail({ params }: PageProps) {
    const { slug } = await params;

    const rawProduct = await prisma.product.findUnique({
        where: { slug },
    });

    if (!rawProduct) {
        notFound();
    }

    // Convertimos los Decimal de Prisma a números planos
    const product = {
        ...rawProduct,
        price: Number(rawProduct.price),
        abv: Number(rawProduct.abv),
    };

    return (
        <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col antialiased">
            <main className="flex-1 flex justify-center">
                <ProductDetailClient product={product} />
            </main>
        </div>
    );
}
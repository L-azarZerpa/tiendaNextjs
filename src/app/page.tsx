import { prisma } from "@/lib/prisma";
import StoreContent from "@/components/StoreContent";

export const instant = false;

interface HomeProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const searchQuery = resolvedSearchParams?.q || "";

  // 1. Consultamos los productos de Prisma con el filtro de búsqueda
  const rawProducts = await prisma.product.findMany({
    where: searchQuery
      ? {
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { category: { contains: searchQuery, mode: "insensitive" } },
        ],
      }
      : {},
  });

  // 2. Convertimos los objetos Decimal a números planos de JS
  const products = rawProducts.map((p) => ({
    ...p,
    price: Number(p.price),
    abv: Number(p.abv),
  }));

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col antialiased">
      <StoreContent products={products} searchQuery={searchQuery} />
    </div>
  );
}
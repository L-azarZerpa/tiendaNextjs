import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Iniciando el sembrado de productos...')

    // Usamos upsert para evitar errores si ejecutas el seed varias veces
    await prisma.product.upsert({
        where: { slug: 'whisky-johnnie-walker-black-label' },
        update: {},
        create: {
            name: 'Whisky Johnnie Walker Black Label',
            slug: 'whisky-johnnie-walker-black-label',
            description: 'Un clásico blended Scotch whisky con notas ahumadas, malta y vainilla.',
            price: 45.99,
            stock: 25,
            imageUrl: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=600&auto=format&fit=crop',
            category: 'Whisky',
            volume: '750 ml',
            abv: 40.0,
            isFeatured: true,
        },
    })

    await prisma.product.upsert({
        where: { slug: 'ron-diplomatico-reserva-exclusiva' },
        update: {},
        create: {
            name: 'Ron Diplomático Reserva Exclusiva',
            slug: 'ron-diplomatico-reserva-exclusiva',
            description: 'Ron añejo venezolano de gran prestigio, complejo, con notas de caramelo y frutos secos.',
            price: 38.50,
            stock: 30,
            imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=600&auto=format&fit=crop',
            category: 'Ron',
            volume: '700 ml',
            abv: 40.0,
            isFeatured: true,
        },
    })

    await prisma.product.upsert({
        where: { slug: 'tequila-don-julio-reposado' },
        update: {},
        create: {
            name: 'Tequila Don Julio Reposado',
            slug: 'tequila-don-julio-reposado',
            description: 'Envejecido en barricas de roble blanco americano durante ocho meses. Suave y elegante.',
            price: 60.00,
            stock: 15,
            imageUrl: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=600&auto=format&fit=crop',
            category: 'Tequila',
            volume: '750 ml',
            abv: 38.0,
            isFeatured: true,
        },
    })

    await prisma.product.upsert({
        where: { slug: 'vino-tinto-malbec-catena' },
        update: {},
        create: {
            name: 'Vino Tinto Catena Malbec',
            slug: 'vino-tinto-malbec-catena',
            description: 'Vino argentino de excelente cuerpo, con aromas a frutas negras y toques de vainilla.',
            price: 22.00,
            stock: 40,
            imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=600&auto=format&fit=crop',
            category: 'Vinos',
            volume: '750 ml',
            abv: 13.5,
            isFeatured: false,
        },
    })

    console.log('✅ ¡Base de datos sembrada con éxito!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
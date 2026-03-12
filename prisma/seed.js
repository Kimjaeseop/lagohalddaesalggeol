import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

const initialData = [
    {
        name: '워렌 버핏',
        slug: 'warren-buffett',
        imageUrl: '/images/buffett.png',
        quotes: [
            {
                text: "가상화폐는 기본적으로 아무런 가치를 창출하지 못한다. 나는 비트코인을 평생 단 하나도 사지 않을 것이다.",
                relatedTicker: 'BITCOIN',
                priceThen: 9700, // May 2018 approx
                priceNow: 95000,
                saidAt: '2018-05-07'
            }
        ]
    },
    {
        name: '일론 머스크',
        slug: 'elon-musk',
        imageUrl: '/images/musk.png',
        quotes: [
            {
                text: "테슬라 주가는 너무 높은 것 같다. (Tesla stock price is too high imo)",
                relatedTicker: 'TSLA',
                priceThen: 156, // Split adjusted approx
                priceNow: 350,
                saidAt: '2020-05-01'
            }
        ]
    },
    {
        name: '유시민',
        slug: 'simin-ryu',
        imageUrl: '/images/simin.png',
        quotes: [
            {
                text: "비트코인은 바다이야기 같은 도박판이다.",
                relatedTicker: 'BITCOIN',
                priceThen: 15000, // Jan 2018 approx
                priceNow: 95000,
                saidAt: '2018-01-12'
            }
        ]
    },
    {
        name: '스티브 발머',
        slug: 'steve-ballmer',
        imageUrl: '/images/ballmer.png',
        quotes: [
            {
                text: "아이폰이 시장 점유율을 크게 차지할 가능성은 없다.",
                relatedTicker: 'AAPL',
                priceThen: 4.5, // Split adjusted 2007
                priceNow: 220,
                saidAt: '2007-04-30'
            }
        ]
    }
];

async function main() {
    console.log('🌱 Start seeding...');

    // Clear existing (optional, but good for fresh seed)
    // await prisma.quote.deleteMany();
    // await prisma.person.deleteMany();

    for (const p of initialData) {
        const person = await prisma.person.upsert({
            where: { slug: p.slug },
            update: {},
            create: {
                name: p.name,
                slug: p.slug,
                imageUrl: p.imageUrl,
                quotes: {
                    create: p.quotes
                }
            }
        });
        console.log(`Created user with id: ${person.id}`);
    }
    console.log('✅ Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

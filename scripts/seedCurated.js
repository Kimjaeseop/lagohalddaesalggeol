import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const people = [
    {
        name: 'Warren Buffett',
        slug: 'buffett',
        imageUrl: '/images/buffett.png',
        quotes: [
            {
                text: "Apple is an extraordinary company. We just started buying it.",
                saidAt: '2016-05-16',
                relatedTicker: 'AAPL',
                priceThen: 27.25,
                priceNow: 255.00,
                context: '기술주를 기피하던 가치투자의 대가가 13F 공시를 통해 Apple $1B 매수 공개. 이후 $9.4B 투자, +545% 수익.'
            },
            {
                text: "Be fearful when others are greedy, and greedy when others are fearful.",
                saidAt: '2008-10-16',
                relatedTicker: 'SPY',
                priceThen: 90.00,
                priceNow: 682.00,
                context: 'NYT 기고문으로 금융위기 한복판에서 "I\'m buying American stocks" 선언. 14년 대세 상승장의 시작점.'
            }
        ]
    },
    {
        name: 'Keith Gill (Roaring Kitty)',
        slug: 'roaringkitty',
        imageUrl: '/images/roaringkitty.png',
        quotes: [
            {
                text: "GME YOLO update — 포지션 공개: $53K 콜옵션 매수",
                saidAt: '2020-09-01',
                relatedTicker: 'GME',
                priceThen: 4.00,
                priceNow: 24.00,
                context: 'Reddit r/wallstreetbets에서 매주 포지션 업데이트 공개. 철저한 펀더멘탈 분석 기반 GameStop 저평가 논리 제시. $53K → $48M.'
            }
        ]
    },
    {
        name: 'Elon Musk',
        slug: 'musk',
        imageUrl: '/images/elon.png',
        quotes: [
            {
                text: "Tesla stock price is too high imo",
                saidAt: '2020-05-01',
                relatedTicker: 'TSLA',
                priceThen: 54.00,
                priceNow: 417.00,
                context: 'CEO의 솔직한 트윗에 주가 11% 급락. 하지만 S&P500 편입과 함께 대세 상승. 역설적 매수 기회.'
            },
            {
                text: "You can now buy a Tesla with Bitcoin",
                saidAt: '2021-03-24',
                relatedTicker: 'BTC',
                priceThen: 56000,
                priceNow: 70000,
                context: 'Tesla $1.5B BTC 매수 SEC 공시 후 비트코인 결제 시작 트윗. S&P500 기업 최초 크립토 채택.'
            }
        ]
    },
    {
        name: 'Cathie Wood',
        slug: 'wood',
        imageUrl: '/images/cathie.png',
        quotes: [
            {
                text: "Our confidence in bitcoin hitting $500,000 by 2030 has only gone up.",
                saidAt: '2020-11-20',
                relatedTicker: 'BTC',
                priceThen: 18000,
                priceNow: 70000,
                context: 'ARK Invest CEO가 체계적 리서치 모델 기반으로 BTC $500K 목표가 제시. 기관투자자 크립토 유입 전환점.'
            },
            {
                text: "Our new price target for Tesla is $3,000.",
                saidAt: '2021-03-19',
                relatedTicker: 'TSLA',
                priceThen: 220.00,
                priceNow: 417.00,
                context: 'ARK가 상세 DCF 모델로 5년 목표가 제시. 자율주행·에너지 사업 가치 반영. 월가가 비웃었지만 방향성 적중.'
            }
        ]
    },
    {
        name: 'Nancy Pelosi',
        slug: 'pelosi',
        imageUrl: '/images/pelosi.png',
        quotes: [
            {
                text: "NVIDIA $100 행사가 콜옵션 200계약 행사 (의회 거래 공시)",
                saidAt: '2022-06-17',
                relatedTicker: 'NVDA',
                priceThen: 100.00,
                priceNow: 183.00,
                context: '하원의장 배우자 Paul Pelosi가 CHIPS법안 투표 전 NVDA 콜옵션 행사. AI 반도체 슈퍼사이클 직전 매수.'
            }
        ]
    },
    {
        name: 'Chamath Palihapitiya',
        slug: 'chamath',
        imageUrl: '/images/chamath.png',
        quotes: [
            {
                text: "SoFi is the Amazon of financial services.",
                saidAt: '2021-01-07',
                relatedTicker: 'SOFI',
                priceThen: 10.00,
                priceNow: 20.00,
                context: 'SPAC King이 SoFi 합병 SPAC 발표와 함께 핀테크 혁명 근거 설명. SoFi는 은행 라이선스 취득, 회원 1,370만 달성.'
            }
        ]
    },
    {
        name: 'Michael Burry',
        slug: 'burry',
        imageUrl: '/images/burry.png',
        quotes: [
            {
                text: "Scion Asset Management 13F: Alibaba (BABA) 대규모 신규 매수",
                saidAt: '2023-11-15',
                relatedTicker: 'BABA',
                priceThen: 78.00,
                priceNow: 130.00,
                context: '빅숏의 주인공이 중국 디플레이션 우려 속 역발상으로 알리바바 대규모 매수. 13F 공시로 확인 가능.'
            }
        ]
    }
];

async function seed() {
    console.log('🌱 Starting curated data seed...\n');

    for (const personData of people) {
        // Check if person already exists
        const existing = await prisma.person.findUnique({
            where: { slug: personData.slug }
        });

        if (existing) {
            console.log(`⏭️  ${personData.name} already exists (slug: ${personData.slug}). Adding new quotes only...`);

            // Add quotes that don't already exist (check by text)
            for (const q of personData.quotes) {
                const existingQuotes = await prisma.quote.findMany({
                    where: {
                        personId: existing.id,
                        relatedTicker: q.relatedTicker,
                        saidAt: q.saidAt
                    }
                });

                if (existingQuotes.length === 0) {
                    await prisma.quote.create({
                        data: {
                            personId: existing.id,
                            ...q
                        }
                    });
                    console.log(`   ✅ Added quote: "${q.text.slice(0, 50)}..." (${q.relatedTicker})`);
                } else {
                    // Update existing quote with new price
                    await prisma.quote.update({
                        where: { id: existingQuotes[0].id },
                        data: {
                            priceNow: q.priceNow,
                            context: q.context
                        }
                    });
                    console.log(`   🔄 Updated existing quote: "${q.text.slice(0, 50)}..." (${q.relatedTicker})`);
                }
            }
        } else {
            // Create person with all quotes
            const created = await prisma.person.create({
                data: {
                    name: personData.name,
                    slug: personData.slug,
                    imageUrl: personData.imageUrl,
                    quotes: {
                        create: personData.quotes
                    }
                },
                include: { quotes: true }
            });
            console.log(`✅ Created ${created.name} with ${created.quotes.length} quotes`);
        }
    }

    console.log('\n🎉 Seed completed!');

    // Show summary
    const totalPeople = await prisma.person.count();
    const totalQuotes = await prisma.quote.count();
    console.log(`📊 Total: ${totalPeople} people, ${totalQuotes} quotes`);

    await prisma.$disconnect();
    await pool.end();
}

seed().catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
});

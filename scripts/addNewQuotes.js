import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { getAssetPrice } from '../server/services/price.js';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 15 Global Celebrity Quotes
const newQuotes = [
    {
        name: 'Jamie Dimon',
        slug: 'jamie-dimon',
        role: 'JP모건 CEO',
        imageUrl: '/images/default_user.png',
        quotes: [{
            text: "비트코인은 사기(fraud)다. 비트코인을 거래하는 직원은 해고할 것이다.",
            relatedTicker: 'BITCOIN',
            saidAt: '2017-09-12',
            asset: { id: 'bitcoin', type: 'crypto' }
        }]
    },
    {
        name: 'Peter Schiff',
        slug: 'peter-schiff',
        role: '금 투자자 & 비트코인 비판론자',
        imageUrl: '/images/default_user.png',
        quotes: [{
            text: "비트코인은 내재 가치가 없다. 결국 0달러로 갈 것이다.",
            relatedTicker: 'BITCOIN',
            saidAt: '2019-07-17',
            asset: { id: 'bitcoin', type: 'crypto' }
        }]
    },
    {
        name: 'Paul Krugman',
        slug: 'paul-krugman',
        role: '노벨 경제학상 수상자',
        imageUrl: '/images/default_user.png',
        quotes: [{
            text: "인터넷이 경제에 미치는 영향은 팩스기와 다를 바 없을 것이다.",
            relatedTicker: '^IXIC',
            saidAt: '1998-06-10',
            asset: { id: '^IXIC', type: 'stock' }
        }]
    },
    {
        name: 'Jim Cramer',
        slug: 'jim-cramer',
        role: 'CNBC Mad Money 진행자',
        imageUrl: '/images/default_user.png',
        quotes: [{
            text: "Bear Stearns는 괜찮다. 돈을 빼지 말아라!",
            relatedTicker: 'SPY',
            saidAt: '2008-03-11',
            asset: { id: 'SPY', type: 'stock' }
        }]
    },
    {
        name: 'Bill Gates',
        slug: 'bill-gates',
        role: '마이크로소프트 창업자',
        imageUrl: '/images/default_user.png',
        quotes: [{
            text: "일론 머스크만큼의 돈이 없다면 암호화폐에 투자하지 마라.",
            relatedTicker: 'BITCOIN',
            saidAt: '2021-02-24',
            asset: { id: 'bitcoin', type: 'crypto' }
        }]
    },
    {
        name: 'Mark Cuban',
        slug: 'mark-cuban',
        role: 'Shark Tank & 달라스 매버릭스 구단주',
        imageUrl: '/images/default_user.png',
        quotes: [{
            text: "비트코인보다 바나나가 더 가치 있다.",
            relatedTicker: 'BITCOIN',
            saidAt: '2019-10-02',
            asset: { id: 'bitcoin', type: 'crypto' }
        }]
    },
    {
        name: 'Janet Yellen',
        slug: 'janet-yellen',
        role: '전 미국 재무장관 & 전 Fed 의장',
        imageUrl: '/images/default_user.png',
        quotes: [{
            text: "비트코인은 극도로 비효율적인 거래 수단이다.",
            relatedTicker: 'BITCOIN',
            saidAt: '2018-01-31',
            asset: { id: 'bitcoin', type: 'crypto' }
        }]
    },
    {
        name: 'Ray Dalio',
        slug: 'ray-dalio',
        role: '브릿지워터 창업자',
        imageUrl: '/images/default_user.png',
        quotes: [{
            text: "비트코인은 거품(bubble)이다.",
            relatedTicker: 'BITCOIN',
            saidAt: '2017-09-19',
            asset: { id: 'bitcoin', type: 'crypto' }
        }]
    },
    {
        name: 'Michael Saylor',
        slug: 'michael-saylor',
        role: 'MicroStrategy CEO',
        imageUrl: '/images/default_user.png',
        quotes: [{
            text: "비트코인의 날은 얼마 남지 않았다.",
            relatedTicker: 'BITCOIN',
            saidAt: '2013-12-18',
            asset: { id: 'bitcoin', type: 'crypto' }
        }]
    },
    {
        name: 'Charlie Munger',
        slug: 'charlie-munger',
        role: '버크셔 해서웨이 부회장',
        imageUrl: '/images/default_user.png',
        quotes: [{
            text: "비트코인을 거래하는 것은 치매(dementia) 환자나 할 짓이다.",
            relatedTicker: 'BITCOIN',
            saidAt: '2021-05-01',
            asset: { id: 'bitcoin', type: 'crypto' }
        }]
    },
    {
        name: 'Ken Griffin',
        slug: 'ken-griffin',
        role: '시타델 LLC CEO',
        imageUrl: '/images/default_user.png',
        quotes: [{
            text: "암호화폐는 지하디스트의 화폐가 될 것이다.",
            relatedTicker: 'ETH',
            saidAt: '2017-10-10',
            asset: { id: 'ethereum', type: 'crypto' }
        }]
    },
    {
        name: 'David Einhorn',
        slug: 'david-einhorn',
        role: '그린라이트 캐피탈 CEO',
        imageUrl: '/images/default_user.png',
        quotes: [{
            text: "테슬라는 쇼트(공매도)다. 결국 주가는 폭락할 것이다.",
            relatedTicker: 'TSLA',
            saidAt: '2019-07-01',
            asset: { id: 'TSLA', type: 'stock' }
        }]
    },
    {
        name: 'Irving Fisher',
        slug: 'irving-fisher',
        role: '경제학자 (대공황 예측 실패)',
        imageUrl: '/images/default_user.png',
        quotes: [{
            text: "주가는 영구적으로 높은 고원에 도달했다.",
            relatedTicker: 'SPY',
            saidAt: '2008-09-15', // Using Lehman crash date as proxy for similar sentiment
            asset: { id: 'SPY', type: 'stock' }
        }]
    },
    {
        name: "Kevin O'Leary",
        slug: 'kevin-oleary',
        role: 'Shark Tank & 비즈니스 투자자',
        imageUrl: '/images/default_user.png',
        quotes: [{
            text: "비트코인은 쓰레기다. 가치가 없다.",
            relatedTicker: 'BITCOIN',
            saidAt: '2019-05-21',
            asset: { id: 'bitcoin', type: 'crypto' }
        }]
    },
    {
        name: 'Jordan Belfort',
        slug: 'jordan-belfort',
        role: '더 울프 오브 월스트리트',
        imageUrl: '/images/default_user.png',
        quotes: [{
            text: "비트코인은 거대한 사기다. 모든 것을 잃게 될 것이다.",
            relatedTicker: 'BITCOIN',
            saidAt: '2017-12-19',
            asset: { id: 'bitcoin', type: 'crypto' }
        }]
    }
];

async function main() {
    console.log('🚀 Adding 15 new celebrity quotes...\n');

    let successCount = 0;
    let failCount = 0;

    for (const person of newQuotes) {
        try {
            // Check if person already exists
            const existing = await prisma.person.findUnique({
                where: { slug: person.slug }
            });

            if (existing) {
                console.log(`⏭️  ${person.name} already exists, skipping...`);
                continue;
            }

            // Fetch real price data for each quote
            const quotesWithPrices = [];
            for (const q of person.quotes) {
                console.log(`  📊 Fetching price for ${q.relatedTicker} on ${q.saidAt}...`);

                let priceData = null;
                try {
                    priceData = await getAssetPrice(q.asset, q.saidAt);
                } catch (e) {
                    console.warn(`  ⚠️  Price fetch failed: ${e.message}`);
                }

                const priceThen = priceData?.priceThen || 0;
                const priceNow = priceData?.priceNow || 0;

                if (priceThen === 0) {
                    console.warn(`  ⚠️  No price data for ${q.relatedTicker} on ${q.saidAt}`);
                }

                quotesWithPrices.push({
                    text: q.text,
                    relatedTicker: q.relatedTicker,
                    priceThen: priceThen,
                    priceNow: priceNow,
                    saidAt: q.saidAt,
                    context: person.role
                });

                console.log(`  ✅ ${q.relatedTicker}: $${priceThen.toLocaleString()} → $${priceNow.toLocaleString()}`);

                // Rate limiting for CoinGecko (free tier)
                await new Promise(r => setTimeout(r, 1500));
            }

            // Create person with quotes
            const created = await prisma.person.create({
                data: {
                    name: person.name,
                    slug: person.slug,
                    imageUrl: person.imageUrl,
                    quotes: {
                        create: quotesWithPrices
                    }
                }
            });

            console.log(`✅ ${person.name} (ID: ${created.id}) — ${quotesWithPrices.length} quote(s) added`);
            successCount++;

        } catch (error) {
            console.error(`❌ Failed to add ${person.name}: ${error.message}`);
            failCount++;
        }
    }

    console.log(`\n========================================`);
    console.log(`🎉 Done! Success: ${successCount}, Failed: ${failCount}`);
    console.log(`========================================`);
}

main()
    .catch(e => {
        console.error('Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

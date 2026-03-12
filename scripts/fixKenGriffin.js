import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import YahooFinance from 'yahoo-finance2';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const yahooFinance = new YahooFinance();

async function main() {
    const person = await prisma.person.findUnique({
        where: { slug: 'ken-griffin' },
        include: { quotes: true }
    });

    if (!person) {
        console.error('Ken Griffin not found!');
        return;
    }

    const quote = person.quotes.find(q => q.relatedTicker === 'ETH');
    if (!quote) {
        console.error('ETH quote not found for Ken Griffin!');
        return;
    }

    console.log(`Current price data: Then=${quote.priceThen}, Now=${quote.priceNow}`);

    let priceNow = 0;
    try {
        const result = await yahooFinance.quote('ETH-USD');
        priceNow = result.regularMarketPrice;
        console.log(`Fetched current ETH price: ${priceNow}`);
    } catch (e) {
        console.error('Failed to fetch current ETH price:', e.message);
        priceNow = 2600; // Fallback estimate
    }

    const priceThen = 299.0; // Historical price for 2017-10-10

    await prisma.quote.update({
        where: { id: quote.id },
        data: {
            priceThen: priceThen,
            priceNow: priceNow
        }
    });

    console.log(`✅ Updated Ken Griffin quote: $${priceThen} -> $${priceNow}`);
}

main()
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

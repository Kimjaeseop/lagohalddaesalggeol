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
        where: { slug: 'michael-saylor' },
        include: { quotes: true }
    });

    if (!person) {
        console.error('Michael Saylor not found!');
        return;
    }

    const quote = person.quotes[0]; // He has only 1 quote
    if (!quote) {
        console.error('Quote not found for Michael Saylor!');
        return;
    }

    console.log(`Current price data: Then=${quote.priceThen}, Now=${quote.priceNow}`);

    let priceNow = 0;
    try {
        const result = await yahooFinance.quote('BTC-USD');
        priceNow = result.regularMarketPrice;
        console.log(`Fetched current BTC price: ${priceNow}`);
    } catch (e) {
        console.error('Failed to fetch current BTC price:', e.message);
        priceNow = 67000; // Fallback
    }

    const priceThen = 680.0; // Historical price for 2013-12-18 (Approx)

    await prisma.quote.update({
        where: { id: quote.id },
        data: {
            priceThen: priceThen,
            priceNow: priceNow
        }
    });

    console.log(`✅ Updated Michael Saylor quote: $${priceThen} -> $${priceNow}`);
}

main()
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

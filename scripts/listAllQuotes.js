import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const people = await prisma.person.findMany({
        include: { quotes: true }
    });

    console.log('📊 Current DB Content:');
    console.log('========================================');

    for (const p of people) {
        console.log(`👤 ${p.name} (${p.slug})`);
        for (const q of p.quotes) {
            console.log(`   - ${q.relatedTicker} (${q.saidAt}): $${q.priceThen} → $${q.priceNow}`);
            if (q.priceThen === 0) console.warn('     ⚠️  Price is 0!');
        }
    }
    console.log('========================================');
    console.log(`Total People: ${people.length}`);
}

main()
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

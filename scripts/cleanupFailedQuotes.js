import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const slugsToDelete = [
    'jamie-dimon',
    'peter-schiff',
    'paul-krugman',
    'jim-cramer',
    'bill-gates',
    'mark-cuban',
    'janet-yellen',
    'ray-dalio',
    'michael-saylor',
    'charlie-munger',
    'ken-griffin',
    'david-einhorn',
    'irving-fisher',
    'kevin-oleary',
    'jordan-belfort'
];

async function main() {
    console.log('🗑️ Deleting failed entries...');
    for (const slug of slugsToDelete) {
        try {
            const person = await prisma.person.findUnique({ where: { slug } });
            if (person) {
                await prisma.quote.deleteMany({ where: { personId: person.id } });
                await prisma.person.delete({ where: { id: person.id } });
                console.log(`✅ Deleted ${person.name} (${slug})`);
            }
        } catch (e) {
            console.error(`❌ Failed to delete ${slug}: ${e.message}`);
        }
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

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
        where: {
            OR: [
                { imageUrl: '/images/default_user.png' },
                { imageUrl: '' }
            ]
        }
    });

    console.log('🖼️  People needing images:');
    people.forEach(p => {
        console.log(`- ${p.name} (${p.slug})`);
    });
}

main()
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

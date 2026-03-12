import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const slug = process.argv[2];
const imagePath = process.argv[3];

if (!slug || !imagePath) {
    console.error('Usage: node updateImage.js <slug> <imagePath>');
    process.exit(1);
}

async function main() {
    const person = await prisma.person.update({
        where: { slug: slug },
        data: { imageUrl: imagePath }
    });
    console.log(`✅ Updated image for ${person.name} (${slug}) -> ${imagePath}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

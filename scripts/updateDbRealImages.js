import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Updating database with new real image paths...');

    const updates = [
        { slug: 'pelosi', imageUrl: '/images/pelosi.jpg' },
        { slug: 'chamath', imageUrl: '/images/chamath.jpg' },
        { slug: 'roaringkitty', imageUrl: '/images/roaringkitty.jpg' },
        // Burry failed to download, keeping previous (Initials)
    ];

    for (const u of updates) {
        try {
            const person = await prisma.person.findUnique({ where: { slug: u.slug } });
            if (person) {
                await prisma.person.update({
                    where: { slug: u.slug },
                    data: { imageUrl: u.imageUrl }
                });
                console.log(`✅ Updated ${u.slug} -> ${u.imageUrl}`);
            } else {
                console.log(`⚠️ Person not found: ${u.slug}`);
            }
        } catch (e) {
            console.error(`❌ Error updating ${u.slug}:`, e);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => { await prisma.$disconnect(); await pool.end(); });

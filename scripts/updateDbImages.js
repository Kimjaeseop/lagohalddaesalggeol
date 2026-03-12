import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const updates = [
    { slug: 'roaringkitty', newImage: '/images/roaringkitty.svg' },
    { slug: 'pelosi', newImage: '/images/pelosi.svg' },
    { slug: 'chamath', newImage: '/images/chamath.svg' },
    { slug: 'burry', newImage: '/images/burry.svg' },
    // Also update any user-created profiles to use default svg if they use default png
    { isDefault: true, oldImage: '/images/default_user.png', newImage: '/images/default_user.svg' }
];

async function updateImages() {
    console.log('🔄 updating database image URLs...\n');

    for (const update of updates) {
        if (update.slug) {
            try {
                const person = await prisma.person.update({
                    where: { slug: update.slug },
                    data: { imageUrl: update.newImage }
                });
                console.log(`✅ Updated ${person.name} -> ${update.newImage}`);
            } catch (error) {
                if (error.code === 'P2025') {
                    console.log(`⚠️ Person with slug "${update.slug}" not found.`);
                } else {
                    console.error(`❌ Error updating ${update.slug}:`, error.message);
                }
            }
        } else if (update.isDefault) {
            // Bulk update for default users
            const result = await prisma.person.updateMany({
                where: { imageUrl: update.oldImage },
                data: { imageUrl: update.newImage }
            });
            console.log(`✅ Updated ${result.count} default users -> ${update.newImage}`);
        }
    }

    console.log('\n🎉 Update complete!');
    await prisma.$disconnect();
    await pool.end();
}

updateImages().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
});

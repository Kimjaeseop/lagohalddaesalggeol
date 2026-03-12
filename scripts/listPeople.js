import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const people = await prisma.person.findMany({
    select: { id: true, name: true, slug: true, imageUrl: true }
});

console.log('\n=== All People in DB ===');
people.forEach(p => {
    const hasImage = !p.imageUrl.includes('default');
    console.log(`${hasImage ? '✅' : '❌'} [ID:${p.id}] ${p.name} (slug: ${p.slug}) -> ${p.imageUrl}`);
});

console.log(`\nTotal: ${people.length} people`);
console.log(`With images: ${people.filter(p => !p.imageUrl.includes('default')).length}`);
console.log(`Without images: ${people.filter(p => p.imageUrl.includes('default')).length}`);

await prisma.$disconnect();
await pool.end();

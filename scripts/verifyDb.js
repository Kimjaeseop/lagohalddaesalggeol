import 'dotenv/config';
import prisma from '../server/db.js';

async function main() {
    console.log('🔍 Verifying DB Connection and CRUD...');
    try {
        // 1. Create a person with nested quote
        const slug = `verify-${Date.now()}`;
        const person = await prisma.person.create({
            data: {
                name: 'Verification Bot',
                slug: slug,
                imageUrl: '/images/default.png',
                quotes: {
                    create: {
                        text: 'Supabase integration works!',
                        relatedTicker: 'TEST',
                        priceThen: 100,
                        priceNow: 150,
                        saidAt: new Date().toISOString()
                    }
                }
            },
            include: { quotes: true }
        });
        console.log(`✅ Created Person (ID: ${person.id}): ${person.name}`);
        console.log(`   Quote: "${person.quotes[0].text}"`);

        // 2. Query
        const count = await prisma.person.count();
        console.log(`✅ Total People in DB: ${count}`);

        if (count > 0) {
            console.log('🚀 Verification SUCCESS');
        } else {
            throw new Error('Count is 0 after create!');
        }

    } catch (e) {
        console.error('❌ Verification Failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

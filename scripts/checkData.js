import 'dotenv/config';
import prisma from '../server/db.js';

async function main() {
    try {
        const peopleCount = await prisma.person.count();
        const quotesCount = await prisma.quote.count();
        const people = await prisma.person.findMany({
            include: { quotes: true }
        });

        console.log(`📊 Current Data Status:`);
        console.log(`- People: ${peopleCount}`);
        console.log(`- Quotes: ${quotesCount}`);

        if (peopleCount > 0) {
            console.log('\n📝 List:');
            people.forEach(p => {
                console.log(`- ${p.name} (${p.quotes.length} quotes)`);
            });
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

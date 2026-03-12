import prisma from './server/db.js';

async function cleanup() {
    // Delete quotes first (foreign key constraint)
    const q = await prisma.quote.deleteMany({ where: { personId: 1 } });
    console.log('Deleted quotes:', q.count);

    // Delete the person
    const p = await prisma.person.delete({ where: { id: 1 } });
    console.log('Deleted person:', p.name);

    process.exit(0);
}

cleanup().catch(e => { console.error(e); process.exit(1); });

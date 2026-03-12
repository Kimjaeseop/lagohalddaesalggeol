import 'dotenv/config';
import prisma from '../server/db.js';

async function clearAllCache() {
    try {
        const deleted = await prisma.analysisResult.deleteMany({});
        console.log(`✅ Cache cleared! Deleted ${deleted.count} records.`);
    } catch (e) {
        console.error('❌ Failed to clear cache:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

clearAllCache();

import prisma from '../server/db.js';

const url = 'https://www.yna.co.kr/view/AKR20240819002600087?input=1195m';

async function clearCache() {
    try {
        const result = await prisma.analysisResult.delete({
            where: { url }
        });
        console.log('✅ Deleted cached entry:', result.id);
    } catch (e) {
        console.log('Not found:', e.message);
    }
    process.exit(0);
}

clearCache();

import 'dotenv/config';
import prisma from '../server/db.js';
import { getAssetPrice } from '../server/services/price.js';

const refreshAllPrices = async () => {
    console.log('🔄 Starting price refresh...');

    const quotes = await prisma.quote.findMany({
        select: { id: true, relatedTicker: true, saidAt: true, priceNow: true }
    });

    const uniqueTickers = [...new Set(quotes.map(q => q.relatedTicker))];
    console.log(`📊 ${uniqueTickers.length} unique tickers to refresh`);

    const priceMap = {};
    for (const ticker of uniqueTickers) {
        try {
            const asset = { id: ticker, type: 'stock' };
            const today = new Date().toISOString().split('T')[0];
            const data = await getAssetPrice(asset, today);
            if (data) priceMap[ticker] = data.priceNow;
            await new Promise(r => setTimeout(r, 300));
        } catch {
            console.warn(`❌ Failed: ${ticker}`);
        }
    }

    let updated = 0;
    for (const quote of quotes) {
        const newPrice = priceMap[quote.relatedTicker];
        if (newPrice && Math.abs(newPrice - quote.priceNow) > 0.001) {
            await prisma.quote.update({
                where: { id: quote.id },
                data: { priceNow: newPrice }
            });
            updated++;
        }
    }

    console.log(`✅ Updated ${updated}/${quotes.length} quotes`);
    await prisma.$disconnect();
};

refreshAllPrices()
    .then(() => process.exit(0))
    .catch(e => { console.error(e); process.exit(1); });

import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

const tickers = [
    '277630.KS', // KODEX 200TR
    '251350.KS', // KODEX 선진국MSCI World
    '148070.KS', // KOSEF 국고채10년
    '304660.KS', // KODEX 미국채10년선물
    '411060.KS', // ACE KRX금현물 (신규상장 확인겸)
    '132030.KS'  // KODEX 골드선물(H) - 대체용
];

async function check() {
    const from = new Date();
    from.setFullYear(from.getFullYear() - 5);

    for (const ticker of tickers) {
        try {
            const result = await yahooFinance.chart(ticker, { period1: from, interval: '1mo' });
            if (result && result.quotes && result.quotes.length > 0) {
                const first = new Date(result.quotes[0].date);
                console.log(`[OK] ${ticker} : First data at ${first.toISOString().split('T')[0]} (Need ~ ${from.toISOString().split('T')[0]})`);
            } else {
                console.log(`[FAIL] ${ticker} : No quotes returned`);
            }
        } catch (e) {
            console.log(`[ERROR] ${ticker} : ${e.message}`);
        }
    }
}

check();

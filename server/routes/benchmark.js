import express from 'express';
import { getHistoricalPrices } from '../services/price.js';

const router = express.Router();

// ─── NPS Proxy ETFs ───────────────────────────────────────────────────────────
const NPS_ASSET_IDS = [
    { id: '277630.KS', name: '국내주식' }, // KODEX 200TR
    { id: '251350.KS', name: '해외주식' }, // KODEX 선진국MSCI World
    { id: '148070.KS', name: '국내채권' }, // KOSEF 국고채10년
    { id: '304660.KS', name: '해외채권' }, // KODEX 미국채10년선물
    { id: '132030.KS', name: '대체자산' }, // KODEX 골드선물(H)
];

// ─── NPS Official Published Allocation Weights by Year ───────────────────────
// Source: 국민연금공단 공시 연간 자산배분 실적 (nps.or.kr)
// Key order: 국내주식, 해외주식, 국내채권, 해외채권, 대체자산
const NPS_WEIGHTS_BY_YEAR = {
    2018: [0.193, 0.194, 0.454, 0.048, 0.109], // 2018년 말 실적
    2019: [0.180, 0.208, 0.445, 0.053, 0.112], // 2019년 말 실적
    2020: [0.212, 0.239, 0.405, 0.056, 0.086], // 2020년 말 실적
    2021: [0.184, 0.278, 0.363, 0.065, 0.108], // 2021년 말 실적
    2022: [0.167, 0.298, 0.350, 0.072, 0.111], // 2022년 말 실적
    2023: [0.156, 0.307, 0.291, 0.085, 0.159], // 2023년 말 실적
    2024: [0.151, 0.328, 0.275, 0.090, 0.154], // 2024년 말 실적
    2025: [0.181, 0.378, 0.209, 0.069, 0.160], // 2025년 말 잠정치
};

/**
 * Get the NPS allocation weights applicable for a given date.
 * Uses the end-of-year weights from the PRIOR year (i.e. allocations
 * published after year Y are effective from Jan 1 of Y+1).
 * Falls back to earliest available year if date is before 2019.
 */
const getWeightsForDate = (dateStr) => {
    const year = new Date(dateStr).getFullYear();
    // The weights for a given calendar year are taken from the PRIOR year's published data
    // (e.g., in 2020 we use 2019 year-end weights)
    const lookupYear = year - 1;
    const years = Object.keys(NPS_WEIGHTS_BY_YEAR).map(Number).sort();
    const clampedYear = Math.max(years[0], Math.min(lookupYear, years[years.length - 1]));
    return NPS_WEIGHTS_BY_YEAR[clampedYear];
};

// ─── In-memory cache ──────────────────────────────────────────────────────────
const priceCache = { data: null, lastUpdated: 0 };
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

/**
 * Fetch raw historical prices for all NPS asset ETFs.
 * Returns a map: { assetId -> [{date, price}] }
 */
const getRawPriceData = async () => {
    const now = Date.now();
    if (priceCache.data && (now - priceCache.lastUpdated < CACHE_TTL)) {
        return priceCache.data;
    }

    console.log('🔄 Fetching fresh NPS ETF price data...');
    // Fetch from 2018-01-01 to cover all historic NPS weight years
    const fromStr = '2018-01-01';

    const allData = {};
    for (const asset of NPS_ASSET_IDS) {
        const data = await getHistoricalPrices(asset.id, fromStr);
        allData[asset.id] = data;
    }

    priceCache.data = allData;
    priceCache.lastUpdated = now;
    console.log('✅ NPS price data refreshed.');
    return allData;
};

/**
 * Build a portfolio history array with annual rebalancing based on NPS published weights.
 * @param {string} startDate  - 'YYYY-MM-DD'
 * @param {string} endDate    - 'YYYY-MM-DD'
 * @param {number} amount     - Initial investment amount (KRW)
 * @returns {{ history: [{date, value}], weightsByYear: object }}
 */
const buildPortfolioHistory = async (startDate, endDate, amount) => {
    const allData = await getRawPriceData();

    // Collect all unique dates from all assets within range
    const allDatesSet = new Set();
    for (const asset of NPS_ASSET_IDS) {
        (allData[asset.id] || [])
            .filter(d => d.date >= startDate && d.date <= endDate)
            .forEach(d => allDatesSet.add(d.date));
    }

    const allDates = Array.from(allDatesSet).sort();
    if (allDates.length === 0) return { history: [], weightsByYear: {} };

    // Forward-fill prices: maintain latest known price for each asset
    const latestPrices = {};
    NPS_ASSET_IDS.forEach(a => {
        // Pre-fill from data older than startDate for the forward fill to work from day 1
        const earlierData = (allData[a.id] || []).filter(d => d.date < startDate);
        latestPrices[a.id] = earlierData.length > 0
            ? earlierData[earlierData.length - 1].price
            : null;
    });

    // Find first date where all assets have known prices
    let simStartIdx = 0;
    while (simStartIdx < allDates.length) {
        const date = allDates[simStartIdx];
        let hasAll = true;
        for (const asset of NPS_ASSET_IDS) {
            const point = (allData[asset.id] || []).find(d => d.date === date);
            if (point) latestPrices[asset.id] = point.price;
            if (latestPrices[asset.id] === null) { hasAll = false; }
        }
        if (hasAll) break;
        simStartIdx++;
    }

    if (simStartIdx >= allDates.length) return { history: [], weightsByYear: {} };

    // Initialize shares based on first day weights
    const initialDate = allDates[simStartIdx];
    let weights = getWeightsForDate(initialDate);
    let shares = {};
    NPS_ASSET_IDS.forEach((a, i) => {
        shares[a.id] = (amount * weights[i]) / latestPrices[a.id];
    });

    const weightsByYear = {};
    let lastRebalanceYear = new Date(initialDate).getFullYear();
    weightsByYear[lastRebalanceYear] = weights;

    const history = [];

    for (let i = simStartIdx; i < allDates.length; i++) {
        const date = allDates[i];
        const currentYear = new Date(date).getFullYear();

        // Update latest prices
        for (const asset of NPS_ASSET_IDS) {
            const point = (allData[asset.id] || []).find(d => d.date === date);
            if (point) latestPrices[asset.id] = point.price;
        }

        // Annual rebalancing: at the start of each new year, rebalance to published weights
        if (currentYear > lastRebalanceYear) {
            const newWeights = getWeightsForDate(date);
            // Calculate current total portfolio value
            let totalValue = 0;
            NPS_ASSET_IDS.forEach(a => { totalValue += shares[a.id] * latestPrices[a.id]; });
            // Rebalance shares
            NPS_ASSET_IDS.forEach((a, idx) => {
                shares[a.id] = (totalValue * newWeights[idx]) / latestPrices[a.id];
            });
            weights = newWeights;
            lastRebalanceYear = currentYear;
            weightsByYear[currentYear] = weights;
        }

        // Calculate daily portfolio value
        let dailyValue = 0;
        NPS_ASSET_IDS.forEach(a => { dailyValue += shares[a.id] * latestPrices[a.id]; });

        history.push({ date, value: dailyValue });
    }

    return { history, weightsByYear };
};

/**
 * Compute MDD (Maximum Drawdown) from a history array.
 */
const computeMDD = (history) => {
    let peak = 0;
    let mdd = 0;
    for (const { value } of history) {
        if (value > peak) peak = value;
        const drawdown = peak > 0 ? (peak - value) / peak : 0;
        if (drawdown > mdd) mdd = drawdown;
    }
    return mdd;
};

// ─── GET /api/benchmark/nps (Summary) ────────────────────────────────────────
router.get('/nps', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

        // Get available data range
        const rawData = await getRawPriceData();
        let allDates = [];
        for (const asset of NPS_ASSET_IDS) {
            (rawData[asset.id] || []).forEach(d => allDates.push(d.date));
        }
        allDates = [...new Set(allDates)].sort();
        const availableFrom = allDates[0] || '2018-01-01';
        const availableTo = allDates[allDates.length - 1] || today;

        // Build 1-year history for banner stats
        const { history } = await buildPortfolioHistory(oneYearAgoStr, availableTo, 1000000);

        if (!history || history.length < 2) {
            return res.status(500).json({ error: 'Insufficient data for benchmark summary' });
        }

        const startVal = history[0].value;
        const endVal = history[history.length - 1].value;

        // YTD
        const currentYear = new Date(availableTo).getFullYear();
        const ytdStartStr = `${currentYear}-01-01`;
        const ytdPoint = history.find(d => d.date >= ytdStartStr) || history[0];
        const ytdReturn = ((endVal - ytdPoint.value) / ytdPoint.value) * 100;
        const oneYearReturn = ((endVal - startVal) / startVal) * 100;

        res.json({
            success: true,
            benchmark: 'NPS',
            date: availableTo,
            ytdReturn: ytdReturn.toFixed(2),
            ytdReturnRaw: ytdReturn,
            oneYearReturn: oneYearReturn.toFixed(2),
            oneYearReturnRaw: oneYearReturn,
            availableFrom,
            availableTo,
        });

    } catch (error) {
        console.error('Benchmark summary error:', error);
        res.status(500).json({ error: 'Failed to calculate benchmark summary' });
    }
});

// ─── GET /api/benchmark/nps/simulate ─────────────────────────────────────────
// Query params:
//   amount     - Initial investment in KRW (default: 10,000,000)
//   startDate  - 'YYYY-MM-DD' (optional, overrides 'years')
//   endDate    - 'YYYY-MM-DD' (optional, defaults to most recent available)
//   years      - Shortcut: 1 | 3 | 5. Used when startDate is not provided.
router.get('/nps/simulate', async (req, res) => {
    try {
        const amount = parseFloat(req.query.amount) || 10000000;

        // Get available data range
        const rawData = await getRawPriceData();
        let allDates = [];
        for (const asset of NPS_ASSET_IDS) {
            (rawData[asset.id] || []).forEach(d => allDates.push(d.date));
        }
        allDates = [...new Set(allDates)].sort();
        const availableTo = allDates[allDates.length - 1];

        let endDate = req.query.endDate || availableTo;
        let startDate;

        if (req.query.startDate) {
            startDate = req.query.startDate;
        } else {
            const years = parseInt(req.query.years) || 1;
            const d = new Date(endDate);
            d.setFullYear(d.getFullYear() - years);
            startDate = d.toISOString().split('T')[0];
        }

        // Clamp to available range
        startDate = startDate < allDates[0] ? allDates[0] : startDate;
        endDate = endDate > availableTo ? availableTo : endDate;

        if (startDate >= endDate) {
            return res.status(400).json({ error: '시작일이 종료일보다 같거나 늦습니다.' });
        }

        const { history, weightsByYear } = await buildPortfolioHistory(startDate, endDate, amount);

        if (!history || history.length < 2) {
            return res.status(500).json({ error: '해당 기간에 충분한 데이터가 없습니다.' });
        }

        const startValue = history[0].value;
        const endValue = history[history.length - 1].value;
        const totalReturn = ((endValue - startValue) / startValue) * 100;

        const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
        const actualYears = (new Date(endDate) - new Date(startDate)) / msPerYear;
        const cagr = actualYears > 0 ? (Math.pow(endValue / startValue, 1 / actualYears) - 1) * 100 : 0;
        const mdd = computeMDD(history);

        // Sample history to max 365 points to reduce payload
        const sampledHistory = sampleArray(history, 365);

        // Format weightsByYear for frontend display
        const weightsFormatted = {};
        for (const [yr, w] of Object.entries(weightsByYear)) {
            weightsFormatted[yr] = {
                국내주식: (w[0] * 100).toFixed(1),
                해외주식: (w[1] * 100).toFixed(1),
                국내채권: (w[2] * 100).toFixed(1),
                해외채권: (w[3] * 100).toFixed(1),
                대체자산: (w[4] * 100).toFixed(1),
            };
        }

        // Current (end) weights for pie chart
        const endYear = new Date(endDate).getFullYear();
        const endYearKey = Object.keys(weightsFormatted).map(Number).filter(y => y <= endYear).sort().reverse()[0];
        const currentWeights = endYearKey ? weightsFormatted[endYearKey] : null;

        res.json({
            success: true,
            benchmark: 'NPS',
            summary: {
                initialAmount: Math.round(startValue),
                finalAmount: Math.round(endValue),
                totalReturn: totalReturn.toFixed(2),
                cagr: cagr.toFixed(2),
                mdd: (mdd * 100).toFixed(2),
                startDate: history[0].date,
                endDate: history[history.length - 1].date,
                periodYears: actualYears.toFixed(2),
            },
            history: sampledHistory.map(d => ({ date: d.date, value: Math.round(d.value) })),
            currentWeights,
            weightsByYear: weightsFormatted,
            availableFrom: allDates[0],
            availableTo,
        });

    } catch (error) {
        console.error('Benchmark simulation error:', error);
        res.status(500).json({ error: 'Failed to simulate benchmark' });
    }
});

/**
 * Sample an array to at most maxN evenly-spaced items (always include last).
 */
function sampleArray(arr, maxN) {
    if (arr.length <= maxN) return arr;
    const step = arr.length / maxN;
    const result = [];
    for (let i = 0; i < maxN - 1; i++) {
        result.push(arr[Math.floor(i * step)]);
    }
    result.push(arr[arr.length - 1]);
    return result;
}

export default router;

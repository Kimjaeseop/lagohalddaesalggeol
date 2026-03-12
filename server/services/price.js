import axios from 'axios';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Extensible Asset Map
// key: lowercase searchable term
// value: { id: API_ID, type: 'crypto' | 'stock' }
const ASSET_MAP = {
    // Crypto
    'bitcoin': { id: 'bitcoin', type: 'crypto' },
    'btc': { id: 'bitcoin', type: 'crypto' },
    '비트코인': { id: 'bitcoin', type: 'crypto' },
    'ethereum': { id: 'ethereum', type: 'crypto' },
    'eth': { id: 'ethereum', type: 'crypto' },
    '이더리움': { id: 'ethereum', type: 'crypto' },
    'doge': { id: 'dogecoin', type: 'crypto' },
    'dogecoin': { id: 'dogecoin', type: 'crypto' },
    '도지': { id: 'dogecoin', type: 'crypto' },
    'xrp': { id: 'ripple', type: 'crypto' },
    '리플': { id: 'ripple', type: 'crypto' },
    'solana': { id: 'solana', type: 'crypto' },
    'sol': { id: 'solana', type: 'crypto' },
    '솔라나': { id: 'solana', type: 'crypto' },

    // Stocks (Global)
    'tesla': { id: 'TSLA', type: 'stock' },
    '테슬라': { id: 'TSLA', type: 'stock' },
    'apple': { id: 'AAPL', type: 'stock' },
    '애플': { id: 'AAPL', type: 'stock' },
    'nvidia': { id: 'NVDA', type: 'stock' },
    '엔비디아': { id: 'NVDA', type: 'stock' },
    'microsoft': { id: 'MSFT', type: 'stock' },
    '마이크로소프트': { id: 'MSFT', type: 'stock' },
    'google': { id: 'GOOGL', type: 'stock' },
    '구글': { id: 'GOOGL', type: 'stock' },
    'amazon': { id: 'AMZN', type: 'stock' },
    '아마존': { id: 'AMZN', type: 'stock' },

    // Stocks (Korea - Yahoo Finance uses .KS for KOSPI, .KQ for KOSDAQ)
    'samsung': { id: '005930.KS', type: 'stock' },
    '삼성전자': { id: '005930.KS', type: 'stock' },
    'skhynix': { id: '000660.KS', type: 'stock' },
    '하이닉스': { id: '000660.KS', type: 'stock' },
    'kakao': { id: '035720.KS', type: 'stock' },
    '카카오': { id: '035720.KS', type: 'stock' },
    'naver': { id: '035420.KS', type: 'stock' },
    '네이버': { id: '035420.KS', type: 'stock' },

    // Benchmark ETFs
    'nps_kr_stock': { id: '277630.KS', type: 'stock' }, // KODEX 200TR
    'nps_global_stock': { id: '251350.KS', type: 'stock' }, // KODEX 선진국MSCI World
    'nps_kr_bond': { id: '148070.KS', type: 'stock' }, // KOSEF 국고채10년
    'nps_global_bond': { id: '304660.KS', type: 'stock' }, // KODEX 미국채10년선물
    'nps_alternative': { id: '132030.KS', type: 'stock' }, // KODEX 골드선물(H)
};

export const findAssetId = (text) => {
    const lower = text.toLowerCase();
    for (const [key, value] of Object.entries(ASSET_MAP)) {
        if (lower.includes(key)) {
            return value;
        }
    }
    // Return null if nothing found (let caller handle fallback)
    return null;
};

// Verify if a ticker exists and is valid
export const validateTicker = async (ticker) => {
    try {
        if (!ticker) return false;
        if (ticker.includes('-USD')) {
            // Simple check for crypto format, could check coingecko list but let's assume valid format is enough for now or try a simple fetch
            return true;
        }
        const quote = await yahooFinance.quote(ticker);
        return !!quote && !!quote.regularMarketPrice;
    } catch (e) {
        console.warn(`⚠️ Validation failed for ${ticker}: ${e.message}`);
        return false;
    }
};

// 1. CoinGecko Implementation (spot price)
const getCryptoPrice = async (coinId, dateStr) => {
    try {
        const [year, month, day] = dateStr.split('-');
        const geckoDate = `${day}-${month}-${year}`;

        const histUrl = `${COINGECKO_API}/coins/${coinId}/history?date=${geckoDate}`;
        const currentUrl = `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd`;

        const [histRes, currRes] = await Promise.all([
            axios.get(histUrl),
            axios.get(currentUrl)
        ]);

        const priceThen = histRes.data.market_data?.current_price?.usd;
        const priceNow = currRes.data[coinId]?.usd;

        if (!priceThen || !priceNow) {
            throw new Error('Price data incomplete');
        }

        return {
            ticker: coinId.toUpperCase(),
            priceThen,
            priceNow,
            currency: 'USD'
        };
    } catch (error) {
        console.warn(`CoinGecko Error for ${coinId}:`, error.message);

        // Fallback to Yahoo Finance for major cryptos
        const yahooTickerMap = {
            'bitcoin': 'BTC-USD',
            'ethereum': 'ETH-USD',
            'dogecoin': 'DOGE-USD'
        };

        const yahooTicker = yahooTickerMap[coinId];
        if (yahooTicker) {
            console.log(`🔄 Falling back to Yahoo Finance for ${coinId} (${yahooTicker})...`);
            return await getStockPrice(yahooTicker, dateStr);
        }

        return null;
    }
};

// 2. Yahoo Finance Implementation (spot price)
const getStockPrice = async (ticker, dateStr) => {
    try {
        // Yahoo Finance Historical
        const date = new Date(dateStr);
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 3); // Buffer for weekends

        // Historical query
        const queryOptions = { period1: dateStr, period2: nextDate.toISOString().split('T')[0] };
        const historical = await yahooFinance.historical(ticker, queryOptions);

        let priceThen = null;
        if (historical && historical.length > 0) {
            priceThen = historical[0].close;
        }

        // Current Price
        const quote = await yahooFinance.quote(ticker);
        const priceNow = quote.regularMarketPrice;

        if (!priceThen || !priceNow) {
            throw new Error('Stock price data incomplete');
        }

        return {
            ticker: ticker,
            priceThen,
            priceNow,
            currency: 'USD' // Usually USD for US stocks, KRW for .KS. Might need normalization.
        };

    } catch (error) {
        console.error('Yahoo Finance Error:', error.message);
        return null;
    }
};

// Main function to get price
export const getAssetPrice = async (asset, dateStr) => {
    if (asset.type === 'crypto') {
        return await getCryptoPrice(asset.id, dateStr);
    } else if (asset.type === 'stock') {
        return await getStockPrice(asset.id, dateStr);
    }
    return null;
};

// CoinGecko historical prices for chart (range-based)
// Falls back to Yahoo Finance (BTC-USD format) for data older than 365 days
const getCryptoHistoricalPrices = async (coinId, fromDate) => {
    try {
        const from = new Date(fromDate);
        const to = new Date();
        const fromTs = Math.floor(from.getTime() / 1000);
        const toTs = Math.floor(to.getTime() / 1000);

        const url = `${COINGECKO_API}/coins/${coinId}/market_chart/range?vs_currency=usd&from=${fromTs}&to=${toTs}`;
        const res = await axios.get(url);

        if (res.data && res.data.prices && res.data.prices.length > 0) {
            // CoinGecko returns [timestamp_ms, price] pairs — sample to ~100 points max
            const prices = res.data.prices;
            const step = Math.max(1, Math.floor(prices.length / 100));
            return prices
                .filter((_, i) => i % step === 0)
                .map(([ts, price]) => ({
                    date: new Date(ts).toISOString().split('T')[0],
                    price
                }));
        }
    } catch (error) {
        console.warn(`CoinGecko Historical unavailable for ${coinId}: ${error.message}`);
    }

    // Fallback: Yahoo Finance with crypto ticker format (e.g. BTC-USD)
    // This covers data older than CoinGecko's free 365-day limit
    try {
        console.log(`📈 Falling back to Yahoo Finance for ${coinId} historical data`);
        // Map CoinGecko IDs to Yahoo Finance crypto tickers
        const yahooTickerMap = {
            'bitcoin': 'BTC-USD',
            'ethereum': 'ETH-USD',
            'dogecoin': 'DOGE-USD',
            'ripple': 'XRP-USD',
            'solana': 'SOL-USD',
        };
        const yahooTicker = yahooTickerMap[coinId] || `${coinId.toUpperCase()}-USD`;
        const from = new Date(fromDate);
        const to = new Date();
        const result = await yahooFinance.chart(yahooTicker, {
            period1: from,
            period2: to,
            interval: '1wk' // weekly for long ranges
        });

        if (!result || !result.quotes || result.quotes.length === 0) {
            console.log(`No Yahoo Finance historical data for ${yahooTicker}`);
            return [];
        }

        return result.quotes.map(q => ({
            date: new Date(q.date).toISOString().split('T')[0],
            price: q.close || q.adjclose || 0
        })).filter(d => d.price > 0);
    } catch (error) {
        console.error(`Yahoo Finance Historical Error for ${coinId}:`, error.message);
        return [];
    }
};

// Historical price data for charts
export const getHistoricalPrices = async (ticker, fromDate) => {
    // Check if this is a crypto ticker by looking it up in ASSET_MAP
    const tickerLower = ticker.toLowerCase();
    const cryptoAsset = ASSET_MAP[tickerLower];
    if (cryptoAsset && cryptoAsset.type === 'crypto') {
        return await getCryptoHistoricalPrices(cryptoAsset.id, fromDate);
    }

    // Also handle direct CoinGecko IDs (e.g. 'bitcoin', 'ethereum')
    const isCryptoId = Object.values(ASSET_MAP).some(a => a.type === 'crypto' && a.id === tickerLower);
    if (isCryptoId) {
        return await getCryptoHistoricalPrices(tickerLower, fromDate);
    }

    // Default: Yahoo Finance for stocks
    try {
        const from = new Date(fromDate);
        const to = new Date();

        const queryOptions = {
            period1: from,
            period2: to,
            interval: '1d'
        };

        const result = await yahooFinance.chart(ticker, queryOptions);

        if (!result || !result.quotes || result.quotes.length === 0) {
            console.log(`No historical data for ${ticker}`);
            return [];
        }

        return result.quotes.map(q => ({
            date: new Date(q.date).toISOString().split('T')[0],
            price: q.close || q.adjclose || 0
        })).filter(d => d.price > 0);

    } catch (error) {
        console.error(`Historical Price Error for ${ticker}:`, error.message);
        return [];
    }
};

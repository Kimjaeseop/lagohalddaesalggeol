// Simple in-memory price cache with TTL
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const getCachedPrice = (ticker) => {
    const entry = cache.get(ticker);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        cache.delete(ticker);
        return null;
    }
    return entry.price;
};

export const setCachedPrice = (ticker, price) => {
    cache.set(ticker, { price, timestamp: Date.now() });
};

export const clearPriceCache = () => cache.clear();

import express from 'express';
import prisma from '../db.js';
import { scrapeArticle } from '../services/scraper.js';
import { getAssetPrice, findAssetId, getHistoricalPrices } from '../services/price.js';
import { extractTickerWithAI } from '../services/openai.js';
import { validateTicker } from '../services/price.js';
import { getTweetFromUrl, formatTweetDate, generateSlug } from '../services/twitter.js';
import adminAuth from '../middleware/adminAuth.js';


const router = express.Router();

// Get Hall of Regret (People & Quotes)
router.get('/hall-of-regret', async (req, res) => {
    try {
        const people = await prisma.person.findMany({
            include: {
                quotes: true
            }
        });

        // Backend logic to format data for frontend
        const data = people.map(person => {
            const quotes = person.quotes.map(q => {
                const ret = ((q.priceNow - q.priceThen) / q.priceThen) * 100;
                return {
                    id: q.id,
                    text: q.text,
                    date: q.saidAt,
                    ticker: q.relatedTicker,
                    priceThen: q.priceThen,
                    priceNow: q.priceNow,
                    returnRate: Math.round(ret) + '%',
                    rawReturn: ret
                };
            });

            quotes.sort((a, b) => b.rawReturn - a.rawReturn);
            const recentQuote = quotes[0];

            return {
                id: person.id,
                name: person.name,
                slug: person.slug,
                image_url: person.imageUrl,
                quotes: quotes,
                recentQuote: recentQuote,
                avgReturn: recentQuote ? recentQuote.returnRate : '0%'
            };
        });

        data.sort((a, b) => {
            const retA = a.recentQuote ? a.recentQuote.rawReturn : -Infinity;
            const retB = b.recentQuote ? b.recentQuote.rawReturn : -Infinity;
            return retB - retA;
        });

        res.json({ data });
    } catch (error) {
        console.error('Error fetching hall of regret:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

// Delete a person and their quotes (admin only)
router.delete('/hall-of-regret/person/:id', adminAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await prisma.quote.deleteMany({ where: { personId: id } });
        await prisma.person.delete({ where: { id } });
        res.json({ success: true, message: `Person ${id} deleted` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a person's image (admin only)
router.patch('/hall-of-regret/person/:id', adminAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const { imageUrl } = req.body;
    try {
        const updated = await prisma.person.update({
            where: { id },
            data: { imageUrl }
        });
        res.json({ success: true, person: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Analysis history
router.get('/analysis/history', async (req, res) => {
    try {
        const results = await prisma.analysisResult.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: { id: true, url: true, title: true, result: true, createdAt: true }
        });
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Analyze specific URL
router.post('/analyze', async (req, res) => {
    const { url, force } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        console.log(`Analyzing: ${url}`);

        // 0. Check Cache First
        const cached = !force ? await prisma.analysisResult.findUnique({
            where: { url }
        }) : null;

        if (cached) {
            const cachedData = cached.result; // { aiAnalysis, meta, primaryTicker }

            // If cache has no aiAnalysis or no summary, it's a stale/legacy entry — delete and re-analyze
            if (!cachedData?.aiAnalysis || !cachedData?.aiAnalysis?.summary) {
                console.log('🔄 Cache hit but missing aiAnalysis/summary — deleting stale cache and re-analyzing...');
                await prisma.analysisResult.delete({ where: { url } });
                // Fall through to full analysis below
            } else {
                console.log('✨ Cache Hit! Returning stored analysis.');

                const meta = cachedData.meta || { title: cached.title, date: new Date().toISOString().split('T')[0] };

                // Re-determine asset from the cached AI analysis
                let asset = null;
                const aiAnalysis = cachedData.aiAnalysis;
                if (aiAnalysis && (aiAnalysis.direct?.length || aiAnalysis.industry?.length || aiAnalysis.ripple?.length)) {
                    const primary = aiAnalysis.direct[0] || aiAnalysis.industry[0] || aiAnalysis.ripple[0];
                    if (primary) asset = { id: primary.ticker, type: 'stock' };
                }

                if (!asset && cachedData.primaryTicker) asset = { id: cachedData.primaryTicker, type: 'stock' };
                if (!asset) asset = findAssetId(cached.title) || { id: 'bitcoin', type: 'crypto' };

                const priceDataFresh = await getAssetPrice(asset, meta.date);

                const returnRate = priceDataFresh && priceDataFresh.priceThen > 0
                    ? ((priceDataFresh.priceNow - priceDataFresh.priceThen) / priceDataFresh.priceThen) * 100
                    : 0;

                return res.json({
                    success: true,
                    meta: meta,
                    aiAnalysis: cachedData.aiAnalysis,
                    result: {
                        ticker: priceDataFresh ? priceDataFresh.ticker : asset.id,
                        priceThen: priceDataFresh ? priceDataFresh.priceThen : 0,
                        priceNow: priceDataFresh ? priceDataFresh.priceNow : 0,
                        returnRate: returnRate.toFixed(2) + '%',
                        rawReturn: returnRate
                    },
                    isCached: true
                });
            }
        }


        // 1. Scrape Metadata
        const meta = await scrapeArticle(url);
        console.log('Scraped Meta:', meta);

        if (!meta.date) {
            meta.date = new Date().toISOString().split('T')[0];
        }

        // 2. Identify Asset
        // Always run AI for rich category data; local map is only a fallback for primary asset
        let localAsset = findAssetId(meta.title);
        let asset = null;
        let aiAnalysis = null;

        // Always run AI to get the full category breakdown (direct/industry/ripple/korea)
        console.log('🤖 Running AI analysis...');
        const aiResult = await extractTickerWithAI(meta.title, meta.context);

        if (aiResult) {
            console.log('🤖 AI identified categories:', Object.keys(aiResult));

            // Process and validate all categories
            const categories = ['direct', 'industry', 'ripple', 'korea'];
            const validatedResult = { direct: [], industry: [], ripple: [], korea: [] };

            for (const cat of categories) {
                if (aiResult[cat] && Array.isArray(aiResult[cat])) {
                    for (const item of aiResult[cat]) {
                        const isValid = await validateTicker(item.ticker);
                        if (isValid) {
                            validatedResult[cat].push(item);
                        } else {
                            console.log(`❌ Filtered invalid ticker: ${item.ticker}`);
                        }
                    }
                }
            }

            // Determine primary asset (first from direct, or industry, or ripple)
            let primary = validatedResult.direct[0] || validatedResult.industry[0] || validatedResult.ripple[0];

            if (primary) {
                asset = { id: primary.ticker, type: 'stock' };
            }

            // Preserve summary + implications from AI alongside validated tickers
            validatedResult.summary = aiResult.summary || [];
            validatedResult.implications = aiResult.implications || [];
            aiAnalysis = validatedResult;
        }

        // Fallback to local map if AI didn't find anything
        if (!asset && localAsset) {
            asset = localAsset;
        }

        asset = asset || { id: 'bitcoin', type: 'crypto' };
        console.log('Identified Asset:', asset);

        // 3. Fetch Price History
        let priceData = null;
        if (meta.date) {
            priceData = await getAssetPrice(asset, meta.date);
        }

        if (!priceData) {
            priceData = {
                ticker: asset.id.toUpperCase(),
                priceThen: 10000, // Fallback dummy
                priceNow: 50000
            };
        }

        // 4. Calculate Returns
        const returnRate = priceData.priceThen > 0
            ? ((priceData.priceNow - priceData.priceThen) / priceData.priceThen) * 100
            : 0;

        // 5. Save to Cache (Async)
        try {
            await prisma.analysisResult.create({
                data: {
                    url: url,
                    title: meta.title,
                    content: meta.context ? meta.context.slice(0, 500) : '', // Store truncated context
                    result: {
                        aiAnalysis: aiAnalysis,
                        meta: meta,
                        primaryTicker: asset.id
                    }
                }
            });
            console.log('💾 Valid analysis saved to cache.');
        } catch (dbError) {
            console.warn('⚠️ Failed to cache result:', dbError.message);
        }

        res.json({
            success: true,
            meta,
            aiAnalysis,
            result: {
                ticker: priceData.ticker,
                priceThen: priceData.priceThen,
                priceNow: priceData.priceNow,
                returnRate: returnRate.toFixed(2) + '%',
                rawReturn: returnRate
            },
            isCached: false
        });

    } catch (error) {
        console.error('Analysis Error:', error);
        res.status(500).json({
            error: 'Analysis failed: ' + error.message,
        });
    }
});

// Get Price Step for Interactive UI
router.post('/price', async (req, res) => {
    const { ticker, date } = req.body;

    if (!ticker || !date) {
        return res.status(400).json({ error: 'Ticker and date are required' });
    }

    try {
        // 1. Determine Asset Type
        // First check our known map (handles crypto & korean aliases)
        let asset = findAssetId(ticker);

        // If not found in map, assume it's a direct stock ticker
        if (!asset) {
            // Simple heuristic: if it contains '-', likely crypto in our context, but let's stick to stock default
            // unless it strongly looks like crypto (e.g. BTC-USD). 
            // In the AI result, we ask for standard tickers.
            asset = { id: ticker, type: 'stock' };
        }

        console.log(`📊 Fetching price for ${ticker} (${asset.id}) on ${date}`);

        // 2. Fetch Price
        let priceData = await getAssetPrice(asset, date);

        if (!priceData) {
            return res.status(404).json({ error: 'Price data not found' });
        }

        // 3. Calculate Return
        const returnRate = priceData.priceThen > 0
            ? ((priceData.priceNow - priceData.priceThen) / priceData.priceThen) * 100
            : 0;

        res.json({
            success: true,
            result: {
                ticker: priceData.ticker,
                priceThen: priceData.priceThen,
                priceNow: priceData.priceNow,
                returnRate: returnRate.toFixed(2) + '%',
                rawReturn: returnRate
            }
        });

    } catch (error) {
        console.error('Price Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch price' });
    }
});

// Get Historical Price Data for Charts
router.get('/price/history', async (req, res) => {
    const { ticker, from } = req.query;

    if (!ticker || !from) {
        return res.status(400).json({ error: 'Ticker and from date are required' });
    }

    try {
        console.log(`📈 Fetching historical prices for ${ticker} from ${from}`);
        const data = await getHistoricalPrices(ticker, from);

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'No historical data found' });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Historical Price Error:', error);
        res.status(500).json({ error: 'Failed to fetch historical prices' });
    }
});

// Save Regret to DB
router.post('/regret', async (req, res) => {
    const { name, quote, ticker, priceThen, priceNow, date } = req.body;

    if (!ticker || typeof ticker !== 'string') {
        return res.status(400).json({ error: 'Valid ticker is required' });
    }
    if (isNaN(parseFloat(priceThen)) || isNaN(parseFloat(priceNow))) {
        return res.status(400).json({ error: 'Valid price values are required' });
    }

    const sanitize = (str, maxLen = 200) =>
        str ? String(str).replace(/[<>]/g, '').slice(0, maxLen).trim() : '';

    const userName = sanitize(name, 50) || '익명의 투자자';
    const userSlug = 'user-' + Date.now();
    const userImage = '/images/default_user.png';
    const quoteText = sanitize(quote, 500) || '그때 살걸...';

    try {
        const result = await prisma.person.create({
            data: {
                name: userName,
                slug: userSlug,
                imageUrl: userImage,
                quotes: {
                    create: {
                        text: quoteText,
                        relatedTicker: ticker,
                        priceThen: parseFloat(priceThen),
                        priceNow: parseFloat(priceNow),
                        saidAt: date
                    }
                }
            }
        });
        res.json({ success: true, id: result.id });
    } catch (error) {
        console.error('Error saving regret:', error);
        res.status(500).json({ error: 'Database save error: ' + error.message });
    }
});

// ============================================
// X (Twitter) Integration - Analyze Tweet
// ============================================
router.post('/tweet/analyze', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Tweet URL is required' });
    }

    try {
        console.log(`🐦 Analyzing tweet: ${url}`);

        // 1. Fetch tweet data from Twitter API
        const tweetData = await getTweetFromUrl(url);
        console.log('📝 Tweet fetched:', tweetData.text.slice(0, 100) + '...');

        if (!tweetData.author) {
            return res.status(400).json({ error: 'Could not fetch author information' });
        }

        // 2. Format date
        const tweetDate = formatTweetDate(tweetData.createdAt);
        console.log('📅 Tweet date:', tweetDate);

        // 3. AI Analysis - Extract ticker from tweet text
        const aiResult = await extractTickerWithAI(tweetData.text, tweetData.text);
        console.log('🤖 AI Result:', aiResult);

        // Find primary ticker from AI result
        let primaryTicker = null;
        let reason = '';

        if (aiResult) {
            const allTickers = [
                ...(aiResult.direct || []),
                ...(aiResult.industry || []),
                ...(aiResult.ripple || []),
                ...(aiResult.korea || [])
            ];

            if (allTickers.length > 0) {
                // Validate first valid ticker
                for (const item of allTickers) {
                    const isValid = await validateTicker(item.ticker);
                    if (isValid) {
                        primaryTicker = item.ticker;
                        reason = item.reason || '';
                        break;
                    }
                }
            }
        }

        // Fallback if no ticker found
        if (!primaryTicker) {
            console.log('⚠️ No valid ticker found in tweet');
            return res.json({
                success: false,
                message: 'No valid stock ticker found in the tweet',
                tweet: {
                    text: tweetData.text,
                    author: tweetData.author,
                    date: tweetDate
                },
                aiAnalysis: aiResult
            });
        }

        console.log(`📈 Primary ticker: ${primaryTicker}`);

        // 4. Fetch price data
        const asset = { id: primaryTicker, type: 'stock' };
        const priceData = await getAssetPrice(asset, tweetDate);

        if (!priceData) {
            return res.status(500).json({ error: 'Failed to fetch price data' });
        }

        console.log('💰 Price data:', priceData);

        // 5. Upsert Person (author)
        const authorSlug = generateSlug(tweetData.author.username);
        let person = await prisma.person.findUnique({
            where: { slug: authorSlug }
        });

        if (!person) {
            person = await prisma.person.create({
                data: {
                    name: tweetData.author.name,
                    slug: authorSlug,
                    imageUrl: tweetData.author.profileImageUrl || '/images/default_user.png'
                }
            });
            console.log('👤 Created new person:', person.name);
        } else {
            console.log('👤 Found existing person:', person.name);
        }

        // 6. Create Quote
        const quote = await prisma.quote.create({
            data: {
                personId: person.id,
                text: tweetData.text,
                relatedTicker: primaryTicker,
                priceThen: priceData.priceThen,
                priceNow: priceData.priceNow,
                context: reason || `Tweet from ${tweetDate}`,
                saidAt: tweetDate
            }
        });

        console.log('💾 Quote saved:', quote.id);

        // 7. Calculate return
        const returnRate = priceData.priceThen > 0
            ? ((priceData.priceNow - priceData.priceThen) / priceData.priceThen) * 100
            : 0;

        res.json({
            success: true,
            person: {
                id: person.id,
                name: person.name,
                slug: person.slug,
                imageUrl: person.imageUrl
            },
            quote: {
                id: quote.id,
                text: tweetData.text,
                relatedTicker: primaryTicker,
                priceThen: priceData.priceThen,
                priceNow: priceData.priceNow,
                returnRate: returnRate.toFixed(2) + '%',
                rawReturn: returnRate,
                saidAt: tweetDate
            },
            aiAnalysis: aiResult
        });

    } catch (error) {
        console.error('❌ Tweet analysis error:', error);
        res.status(500).json({
            error: 'Tweet analysis failed: ' + error.message
        });
    }
});

export default router;

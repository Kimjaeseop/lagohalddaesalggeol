import axios from 'axios';
import * as cheerio from 'cheerio';

// Economy section of Naver News
const NEWS_SOURCE = "https://news.naver.com/main/main.naver?mode=LSD&mid=shm&sid1=101";

async function getLinks() {
    console.log('🌐 Scraping Naver Economy News...');
    try {
        const { data } = await axios.get(NEWS_SOURCE, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const $ = cheerio.load(data);
        const links = [];

        // Select article links (adjust selector based on Naver's current layout)
        $('a[href*="/article/"]').each((i, el) => {
            const href = $(el).attr('href');
            if (href && !links.includes(href)) {
                links.push(href);
            }
        });

        console.log(`✅ Found ${links.length} articles.`);
        // Return 10 random links
        return links.sort(() => 0.5 - Math.random()).slice(0, 10);
    } catch (error) {
        console.error('Failed to scrape news list:', error.message);
        return [];
    }
}

async function testAnalysis(url) {
    try {
        console.log(`\n🔍 Analyzing: ${url}`);
        const response = await axios.post('http://localhost:3000/api/analyze', { url });
        const data = response.data;

        if (data.success) {
            console.log(`📌 Title: ${data.meta.title}`);
            if (data.aiAnalysis) {
                console.log(`🤖 Top Pick: ${data.aiAnalysis.name} (${data.aiAnalysis.ticker})`);
                console.log(`💬 Reason: ${data.aiAnalysis.reason}`);
                if (data.aiAnalysis.candidates) {
                    console.log(`📋 All Candidates:`);
                    data.aiAnalysis.candidates.forEach(c => {
                        console.log(`   - ${c.name} (${c.ticker}) [${c.confidence}]`);
                    });
                }
            } else {
                console.log('⚠️ No AI Analysis (Local match or failed)');
            }
        } else {
            console.log('❌ Analysis Failed');
        }
    } catch (error) {
        console.error('❌ Error calling API:', error.message);
    }
}

async function main() {
    const links = await getLinks();
    if (links.length === 0) return;

    console.log(`🧪 Starting Deep Verification on ${links.length} articles...`);
    for (const link of links) {
        await testAnalysis(link);
        // Add small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));
    }
}

main();

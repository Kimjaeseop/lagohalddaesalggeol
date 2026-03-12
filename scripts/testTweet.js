import 'dotenv/config';
import axios from 'axios';

const testUrls = [
    'https://x.com/michaeljburry/status/1999326579411829025',
    'https://x.com/michaeljburry/status/1997752436589818353',
    'https://x.com/michaeljburry/status/1995866987226902681',
    'https://x.com/cb_doge/status/2018683718089523599'
];

async function testTweetAnalysis(url) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🐦 Testing: ${url}`);
    console.log('='.repeat(60));

    try {
        const response = await axios.post('http://localhost:3000/api/tweet/analyze', { url });
        const data = response.data;

        if (data.success) {
            console.log('✅ SUCCESS');
            console.log(`👤 Person: ${data.person.name} (@${data.person.slug})`);
            console.log(`📝 Tweet: ${data.quote.text.slice(0, 80)}...`);
            console.log(`📈 Ticker: ${data.quote.relatedTicker}`);
            console.log(`💰 Price: $${data.quote.priceThen} → $${data.quote.priceNow}`);
            console.log(`📊 Return: ${data.quote.returnRate}`);
        } else {
            console.log('⚠️ NO TICKER FOUND');
            console.log(`📝 Tweet: ${data.tweet?.text?.slice(0, 80)}...`);
            console.log(`AI Result:`, JSON.stringify(data.aiAnalysis, null, 2));
        }
    } catch (error) {
        console.error('❌ ERROR:', error.response?.data?.error || error.message);
    }
}

async function runTests() {
    console.log('🚀 Starting Twitter Analysis Tests...\n');

    // Test first URL only for quick check
    await testTweetAnalysis(testUrls[0]);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test complete. Check server logs for details.');
    process.exit(0);
}

runTests();

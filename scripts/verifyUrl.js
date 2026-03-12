import axios from 'axios';

const TEST_URL = "https://n.news.naver.com/article/016/0002593916?iid=47";

async function main() {
    console.log(`🔍 Analyzing URL: ${TEST_URL}`);
    try {
        const response = await axios.post('http://localhost:3000/api/analyze', {
            url: TEST_URL
        });

        const data = response.data;
        if (data.success) {
            console.log('✅ Analysis Success!');
            console.log('------------------------------------------------');
            console.log(`📌 Title: ${data.meta.title}`);
            if (data.aiAnalysis) {
                console.log(`🤖 AI Reason: "${data.aiAnalysis.reason}"`);
                console.log(`🎯 AI Ticker: ${data.aiAnalysis.ticker} (${data.aiAnalysis.name})`);
            } else {
                console.log('🤔 Local Analysis (No AI used)');
            }
            console.log(`💰 Result: ${data.result.ticker}`);
            console.log(`   Then: ${data.result.priceThen} | Now: ${data.result.priceNow}`);
            console.log(`   Return: ${data.result.returnRate}`);
            console.log('------------------------------------------------');
        } else {
            console.error('❌ Analysis Failed:', data);
        }

    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }
}

main();

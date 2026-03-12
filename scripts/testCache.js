import axios from 'axios';

const API_ENDPOINT = 'http://localhost:3000/api/analyze';
const TEST_URL = "https://n.news.naver.com/article/016/0002593916?iid=47";

async function runTest() {
    console.log('🔄 Request 1 (Expect Cache Miss/Fill)...');
    const start1 = Date.now();
    try {
        const res1 = await axios.post(API_ENDPOINT, { url: TEST_URL });
        console.log(`✅ Req 1 Succeeded in ${Date.now() - start1}ms. Cached: ${res1.data.isCached}`);
    } catch (e) {
        console.error('❌ Req 1 Failed:', e.message);
    }

    console.log('\n⏳ Waiting 2 seconds...\n');
    await new Promise(r => setTimeout(r, 2000));

    console.log('🔄 Request 2 (Expect Cache HIT)...');
    const start2 = Date.now();
    try {
        const res2 = await axios.post(API_ENDPOINT, { url: TEST_URL });
        console.log(`✅ Req 2 Succeeded in ${Date.now() - start2}ms. Cached: ${res2.data.isCached}`);
    } catch (e) {
        console.error('❌ Req 2 Failed:', e.message);
    }
}

runTest();

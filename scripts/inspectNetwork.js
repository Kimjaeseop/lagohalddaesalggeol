import axios from 'axios';

const TEST_URL = "https://n.news.naver.com/article/016/0002593916?iid=47";
const API_ENDPOINT = 'http://localhost:3000/api/analyze';

async function simulateDevTools() {
    console.log('🔍 [DevTools Simulation] Monitoring Network Activity...\n');

    const requestPayload = { url: TEST_URL };

    console.log('➡️ REQUEST (Payload):');
    console.log('--------------------------------------------------');
    console.log(`POST ${API_ENDPOINT}`);
    console.log('Content-Type: application/json');
    console.log(JSON.stringify(requestPayload, null, 2));
    console.log('--------------------------------------------------\n');

    try {
        const startTime = Date.now();
        const response = await axios.post(API_ENDPOINT, requestPayload);
        const duration = Date.now() - startTime;

        console.log(`⬅️ RESPONSE (Status: ${response.status} OK | Time: ${duration}ms):`);
        console.log('--------------------------------------------------');
        // Extract just the AI analysis part to focus on the new feature
        const { aiAnalysis } = response.data;

        if (aiAnalysis) {
            console.log(JSON.stringify({ aiAnalysis }, null, 2));
        } else {
            console.log(JSON.stringify(response.data, null, 2));
        }
        console.log('--------------------------------------------------');
        console.log('\n✅ Transaction Complete.');

    } catch (error) {
        console.error('❌ Request Failed:', error.message);
        if (error.response) {
            console.log('Response Data:', error.response.data);
        }
    }
}

simulateDevTools();

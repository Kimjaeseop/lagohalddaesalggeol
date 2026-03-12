import axios from 'axios';

const test = async () => {
    console.log("Testing /analyze endpoint...");
    // Use a URL that might work or at least not 404 immediately
    // Or even if it fails, we expect a resilient response now.
    const testUrl = 'https://news.ycombinator.com/'; // fast and open

    try {
        const res = await axios.post('http://localhost:3000/api/analyze', {
            url: testUrl
        });
        console.log('✅ Success! Result:', JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error('❌ Error:', e.response ? e.response.data : e.message);
    }
};
test();

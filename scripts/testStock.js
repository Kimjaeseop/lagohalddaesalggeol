import axios from 'axios';

const testStock = async () => {
    try {
        console.log('Testing Stock Analysis (Tesla)...');
        // We need a URL that will scrape a title containing "Tesla"
        // Let's use the official site or a known news URL. 
        // Or we can mock the request if we can't reliably scrape.
        // But let's try a real URL first.
        const url = 'https://www.tesla.com';

        const response = await axios.post('http://localhost:3000/api/analyze', { url });
        console.log('✅ Success! Result:', JSON.stringify(response.data, null, 2));

        if (response.data.result.ticker === 'TSLA') {
            console.log('Ticker identified correctly as TSLA');
        } else {
            console.error('❌ Ticker identification failed. Got:', response.data.result.ticker);
        }

    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }
};

testStock();

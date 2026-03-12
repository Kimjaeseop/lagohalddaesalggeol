import axios from 'axios';
import * as cheerio from 'cheerio';

export const scrapeArticle = async (url) => {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);

        const title = $('meta[property="og:title"]').attr('content') || $('title').text();
        const image = $('meta[property="og:image"]').attr('content');

        const description = $('meta[property="og:description"]').attr('content') || '';
        const bodyText = $('p').map((i, el) => $(el).text()).get().join(' ').slice(0, 1000); // First 1000 chars

        // Try multiple date selectors
        let date = $('meta[property="og:article:published_time"]').attr('content') ||
            $('meta[name="article:published_time"]').attr('content') ||
            $('meta[property="article:published_time"]').attr('content') ||
            $('time').first().attr('datetime');

        // Simple refinement if it's a full ISO string
        if (date) {
            date = date.split('T')[0];
        }

        return {
            title,
            image,
            date, // might be null
            url,
            context: `${description}\n${bodyText}`
        };
    } catch (error) {
        console.error('Scraping error:', error.message);
        // Return resilient default instead of crashing
        return {
            title: 'Unknown Article',
            image: null,
            date: null,
            url,
            context: ''
        };
    }
};

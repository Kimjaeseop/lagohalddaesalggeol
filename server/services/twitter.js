import axios from 'axios';
import 'dotenv/config';

const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

/**
 * Extract tweet ID from X/Twitter URL
 * Supports formats:
 * - https://x.com/username/status/1234567890
 * - https://twitter.com/username/status/1234567890?s=20
 */
export const extractTweetIdFromUrl = (url) => {
    const regex = /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

/**
 * Fetch tweet data by ID using Twitter API v2
 */
export const getTweetById = async (tweetId) => {
    if (!TWITTER_BEARER_TOKEN) {
        throw new Error('TWITTER_BEARER_TOKEN is not set in environment variables');
    }

    try {
        const response = await axios.get(
            `https://api.twitter.com/2/tweets/${tweetId}`,
            {
                headers: {
                    'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`
                },
                params: {
                    'tweet.fields': 'created_at,author_id,text,public_metrics',
                    'expansions': 'author_id',
                    'user.fields': 'name,username,profile_image_url'
                }
            }
        );

        const tweet = response.data.data;
        const author = response.data.includes?.users?.[0];

        return {
            id: tweet.id,
            text: tweet.text,
            createdAt: tweet.created_at,
            authorId: tweet.author_id,
            metrics: tweet.public_metrics,
            author: author ? {
                id: author.id,
                name: author.name,
                username: author.username,
                profileImageUrl: author.profile_image_url
            } : null
        };
    } catch (error) {
        if (error.response) {
            console.error('Twitter API Error:', error.response.status, error.response.data);
            throw new Error(`Twitter API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
};

/**
 * Convenience function: Get tweet data from URL
 */
export const getTweetFromUrl = async (url) => {
    const tweetId = extractTweetIdFromUrl(url);
    if (!tweetId) {
        throw new Error('Invalid Twitter/X URL. Could not extract tweet ID.');
    }
    return await getTweetById(tweetId);
};

/**
 * Convert Twitter created_at to YYYY-MM-DD format
 */
export const formatTweetDate = (createdAt) => {
    const date = new Date(createdAt);
    return date.toISOString().split('T')[0];
};

/**
 * Generate slug from username
 */
export const generateSlug = (username) => {
    return username.toLowerCase().replace(/[^a-z0-9]/g, '-');
};

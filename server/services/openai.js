import OpenAI from 'openai';
import 'dotenv/config';

const getClient = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.warn('⚠️ OPENAI_API_KEY is missing. AI features will be disabled.');
        return null;
    }
    return new OpenAI({ apiKey });
};

export const extractTickerWithAI = async (title, context = '') => {
    const openai = getClient();
    if (!openai) return null;

    try {
        console.log(`🚀 [Backend] Sending request to OpenAI API...`);
        console.log(`   - Model: gpt-4o-mini`);
        console.log(`   - Input: "${title}"`);

        const completion = await openai.chat.completions.create({
            model: "gpt-5-nano",
            messages: [
                {
                    role: "system",
                    content: `You are an intelligent financial analyst assistant.
Your goal is to analyze a news article, provide a concise summary, investment implications, and identify relevant stock tickers or cryptocurrency symbols.

Rules:
1. Return ONLY a valid JSON object.
2. Provide a "summary": an array of exactly 3 short Korean sentences summarizing the article's key points.
3. Provide "implications": an array of exactly 3 short Korean sentences about investment implications and insights.
4. Categorize the stock findings into:
   - "direct": 2-3 tickers mentioned in or directly relevant to the article.
   - "industry": 1-2 tickers representing the related industry or sector.
   - "ripple": 1-2 tickers that might be indirectly affected (competitors, suppliers, or usage).
   - "korea": 1-2 Korean domestic stocks (KOSPI/KOSDAQ) that would benefit from or be affected by the article topic. **IMPORTANT: Even if the article is about foreign companies (e.g., Tesla, Nvidia, Apple), you MUST find related Korean stocks (e.g., Samsung, LG Energy, Hyundai, SK Hynix, Kakao, etc.) that operate in the same industry or supply chain.**
5. For South Korean stocks, use "NUMBER.KS" (KOSPI) or "NUMBER.KQ" (KOSDAQ). e.g., 005930.KS
6. For US stocks, use standard tickers e.g., TSLA.
7. For Crypto, use "SYMBOL-USD" e.g., BTC-USD.
8. **IMPORTANT:** The "summary", "implications", and "reason" fields MUST be written in **Korean** (Hangul).

Output Format:
{
  "summary": ["한국어 요약 1", "한국어 요약 2", "한국어 요약 3"],
  "implications": ["한국어 시사점 1", "한국어 시사점 2", "한국어 시사점 3"],
  "direct": [ { "ticker": "...", "name": "...", "reason": "한국어로 작성된 이유..." } ],
  "industry": [ { "ticker": "...", "name": "...", "reason": "한국어로 작성된 이유..." } ],
  "ripple": [ { "ticker": "...", "name": "...", "reason": "한국어로 작성된 이유..." } ],
  "korea": [ { "ticker": "...", "name": "...", "reason": "한국어로 작성된 이유..." } ]
}`
                },
                {
                    role: "user",
                    content: `Title: "${title}"\nContext: "${context.slice(0, 1000)}"` // Limit context length
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        console.log('🤖 AI Analysis Result:', content);

        const result = JSON.parse(content);
        return result;

    } catch (error) {
        console.error('❌ OpenAI API Error:', error.message);
        return null;
    }
};

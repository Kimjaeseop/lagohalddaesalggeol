import 'dotenv/config';
import { extractTickerWithAI } from '../server/services/openai.js';

async function main() {
    console.log('🧪 Testing AI Ticker Extraction...');

    const cases = [
        {
            title: "갤럭시 S24 울트라, 역대급 사전예약... 실적 견인하나",
            context: "삼성전자가 출시한 신형 스마트폰이..."
        },
        {
            title: "아이폰 16 출시 임박, 애플 주가 영향은?",
            context: "애플의 신제품 발표가..."
        },
        {
            title: "도지코인 급등, 머스크 트윗 영향",
            context: "일론 머스크가 도지코인을 언급하며..."
        }
    ];

    for (const c of cases) {
        console.log(`\n📰 Analyzing: ${c.title}`);
        const result = await extractTickerWithAI(c.title, c.context);
        console.log('👉 Result:', result);
    }
}

main();

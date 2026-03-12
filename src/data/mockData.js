export const PEOPLE = [
    {
        id: 'musk',
        name: 'Elon Musk',
        role: 'Tesla CEO',
        image: '/images/elon.png',
        avgReturn: '+1,420%',
        recentQuote: {
            text: "Tesla stock price is too high imo",
            date: '2020-05-01',
            ticker: 'TSLA',
            priceThen: 54.00, // Split adjusted approx
            priceNow: 450.00, // Est. 2026 price
            returnRate: '+733%'
        },
        quotes: [
            {
                id: 1,
                text: "Tesla stock price is too high imo",
                date: '2020-05-01',
                ticker: 'TSLA',
                priceThen: 54.00,
                priceNow: 450.00,
                returnRate: '+733%'
            },
            {
                id: 2,
                text: "You can now buy a Tesla with Bitcoin",
                date: '2021-03-24',
                ticker: 'BTC',
                priceThen: 56000,
                priceNow: 150000,
                returnRate: '+168%'
            },
            {
                id: 3,
                text: "Gamestonk!!",
                date: '2021-01-26',
                ticker: 'GME',
                priceThen: 14.00, // Pre-squeeze huge jump
                priceNow: 25.00,
                returnRate: '+78%'
            }
        ]
    },
    {
        id: 'buffett',
        name: 'Warren Buffett',
        role: 'Berkshire Hathaway CEO',
        image: '/images/buffett.png',
        avgReturn: '+850%',
        recentQuote: {
            text: "Be fearful when others are greedy, and greedy when others are fearful.",
            date: '2008-10-16',
            ticker: 'SPY', // BRK.A/B or SPY for general market context
            priceThen: 90.00,
            priceNow: 600.00,
            returnRate: '+566%'
        },
        quotes: [
            {
                id: 1,
                text: "Be fearful when others are greedy, and greedy when others are fearful.",
                date: '2008-10-16',
                ticker: 'SPY',
                priceThen: 90.00,
                priceNow: 600.00,
                returnRate: '+566%'
            },
            {
                id: 2,
                text: "Our favorite holding period is forever.",
                date: '1988-01-01', // Coca Cola purchase era
                ticker: 'KO',
                priceThen: 2.50, // Split adjusted approx
                priceNow: 70.00,
                returnRate: '+2,700%'
            }
        ]
    },
    {
        id: 'wood',
        name: 'Cathie Wood',
        role: 'ARK Invest CEO',
        image: '/images/cathie.png',
        avgReturn: '+120%',
        recentQuote: {
            text: "Bitcoin will hit $500,000.",
            date: '2020-11-20',
            ticker: 'BTC',
            priceThen: 18000,
            priceNow: 150000,
            returnRate: '+733%'
        },
        quotes: [
            {
                id: 1,
                text: "Bitcoin will hit $500,000.",
                date: '2020-11-20',
                ticker: 'BTC',
                priceThen: 18000,
                priceNow: 150000,
                returnRate: '+733%'
            },
            {
                id: 2,
                text: "Tesla could reach $3,000.",
                date: '2021-03-19',
                ticker: 'TSLA',
                priceThen: 220.00,
                priceNow: 450.00,
                returnRate: '+104%'
            }
        ]
    }
];

export const MOCK_ANALYSIS_RESULT = {
    articleTitle: "Apple unveils the new iPhone, revolutionary AI included",
    thumbnail: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80",
    date: '2007-06-29',
    ticker: 'AAPL',
    priceThen: 3.00, // Split adjusted
    priceNow: 220.00,
    returnRate: '+7,233%',
    investAmount: 10000, // 10k KRW or USD
    currentValue: 723300
};

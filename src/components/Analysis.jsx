import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';

const Analysis = ({ url, onBack, onSaveComplete, showToast }) => {
    const [loading, setLoading] = useState(true);
    const [loadingText, setLoadingText] = useState("기사를 분석하고 있습니다...");
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [showSaveForm, setShowSaveForm] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [saveComment, setSaveComment] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    // Expandable list state
    const [expandedTickers, setExpandedTickers] = useState(new Set());
    const [tickerPrices, setTickerPrices] = useState({}); // { ticker: { priceThen, priceNow } }
    const [tickerCharts, setTickerCharts] = useState({}); // { ticker: [{ date, price }] }
    const [loadingCharts, setLoadingCharts] = useState(new Set());

    useEffect(() => {
        const analyzeUrl = async () => {
            setLoading(true);
            setError(null);

            const texts = [
                "워렌 버핏이 이 기사를 읽는 중...",
                "과거 데이터 차트를 펼치는 중...",
                "당신의 후회 비용을 계산하는 중..."
            ];
            let step = 0;
            const interval = setInterval(() => {
                setLoadingText(texts[step % texts.length]);
                step++;
            }, 1000);

            try {
                const response = await api.post('/api/analyze', { url });
                if (response.data.success) {
                    setData(response.data);
                    // Pre-fetch prices for all tickers
                    await fetchAllTickerPrices(response.data);
                } else {
                    setError("분석에 실패했습니다.");
                }
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.error || "서버와 연결할 수 없습니다.");
            } finally {
                clearInterval(interval);
                setLoading(false);
            }
        };

        if (url) {
            analyzeUrl();
        }
    }, [url]);

    const fetchAllTickerPrices = async (analysisData) => {
        if (!analysisData?.aiAnalysis) return;

        const allTickers = [
            ...(analysisData.aiAnalysis.direct || []),
            ...(analysisData.aiAnalysis.industry || []),
            ...(analysisData.aiAnalysis.ripple || []),
            ...(analysisData.aiAnalysis.korea || [])
        ];

        const pricePromises = allTickers.map(async (item) => {
            try {
                const res = await api.post('/api/price', {
                    ticker: item.ticker,
                    date: analysisData.meta.date
                });
                if (res.data.success) {
                    return { ticker: item.ticker, ...res.data.result };
                }
            } catch (e) {
                console.error(`Price fetch failed for ${item.ticker}`);
            }
            return null;
        });

        const results = await Promise.all(pricePromises);
        const priceMap = {};
        results.filter(Boolean).forEach(r => {
            priceMap[r.ticker] = r;
        });
        setTickerPrices(priceMap);
    };

    const toggleExpand = async (ticker) => {
        const newSet = new Set(expandedTickers);
        if (newSet.has(ticker)) {
            newSet.delete(ticker);
        } else {
            newSet.add(ticker);
            if (!tickerCharts[ticker] && !loadingCharts.has(ticker)) {
                setLoadingCharts(prev => new Set(prev).add(ticker));
                try {
                    const res = await api.get('/api/price/history', {
                        params: { ticker, from: data.meta.date }
                    });
                    if (res.data.success) {
                        setTickerCharts(prev => ({ ...prev, [ticker]: res.data.data }));
                    }
                } catch (e) {
                    console.error(`Chart data failed for ${ticker}`);
                } finally {
                    setLoadingCharts(prev => {
                        const n = new Set(prev);
                        n.delete(ticker);
                        return n;
                    });
                }
            }
        }
        setExpandedTickers(newSet);
    };

    const handleSave = async () => {
        const firstTicker = Object.keys(tickerPrices)[0];
        const target = tickerPrices[firstTicker];
        if (!target) return;

        try {
            await api.post('/api/regret', {
                name: saveName,
                quote: saveComment,
                ticker: target.ticker,
                priceThen: target.priceThen,
                priceNow: target.priceNow,
                date: data.meta?.date
            });
            setIsSaved(true);
            setShowSaveForm(false);
            showToast?.('시장을 움직이는 사람들에 등록되었습니다! 🎉');
            onSaveComplete?.();
        } catch (err) {
            showToast?.('저장에 실패했습니다. 다시 시도해주세요.', 'error');
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                textAlign: 'center',
                padding: '20px'
            }}>
                <div className="spinner-container" style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '40px' }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: '4px solid #333',
                        borderTopColor: 'var(--accent-color)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <style>{`
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    `}</style>
                </div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{loadingText}</h2>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>잠시만 기다려주세요</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h2 style={{ color: '#ff4444', marginBottom: '16px' }}>오류 발생</h2>
                <p style={{ color: '#888', marginBottom: '24px' }}>{error}</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                        onClick={() => { setError(null); if (url) { setLoading(true); /* re-trigger useEffect */ } }}
                        style={{ background: 'var(--accent-color)', color: '#000', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                    >
                        다시 분석하기
                    </button>
                    <button onClick={onBack} style={{ background: '#333', color: '#fff', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                        돌아가기
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { meta, aiAnalysis } = data;

    // Combine all stocks into a single list with category info
    let allStocks = [
        ...(aiAnalysis?.direct || []).map(s => ({ ...s, category: '핵심 관련주', categoryIcon: '🎯', color: '57, 255, 20' })),
        ...(aiAnalysis?.industry || []).map(s => ({ ...s, category: '관련 산업', categoryIcon: '🏭', color: '255, 200, 0' })),
        ...(aiAnalysis?.ripple || []).map(s => ({ ...s, category: '파급 효과', categoryIcon: '🌊', color: '0, 200, 255' })),
        ...(aiAnalysis?.korea || []).map(s => ({ ...s, category: '국내 관련주', categoryIcon: '🇰🇷', color: '255, 100, 100' }))
    ];

    // Fallback: if AI analysis is empty but result has ticker data, show it
    if (allStocks.length === 0 && data.result?.ticker) {
        allStocks = [{
            ticker: data.result.ticker,
            name: data.result.ticker,
            reason: '기사 분석 결과 관련된 종목입니다.',
            category: '핵심 관련주',
            categoryIcon: '🎯',
            color: '57, 255, 20'
        }];
    }

    // Currency formatting helper
    const isKoreanStock = (ticker) => ticker?.endsWith('.KS') || ticker?.endsWith('.KQ');
    const formatPrice = (price, ticker) => {
        if (!price && price !== 0) return '-';
        if (isKoreanStock(ticker)) {
            return `₩${Math.round(price).toLocaleString('ko-KR')}`;
        }
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const ExpandableStockItem = ({ item }) => {
        const isExpanded = expandedTickers.has(item.ticker);
        const priceInfo = tickerPrices[item.ticker];
        const chartData = tickerCharts[item.ticker];
        const isLoadingChart = loadingCharts.has(item.ticker);

        const returnRate = priceInfo ? priceInfo.rawReturn : 0;
        const isPositive = returnRate >= 0;

        return (
            <div style={{
                marginBottom: '12px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: `1px solid rgba(${item.color}, 0.3)`,
                background: `rgba(${item.color}, 0.05)`
            }}>
                {/* Collapsed Header */}
                <div
                    onClick={() => toggleExpand(item.ticker)}
                    style={{
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background 0.2s'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.3rem' }}>{item.categoryIcon}</span>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{item.name}</div>
                            <div style={{ fontSize: '0.85rem', color: '#888' }}>{item.ticker} · {item.category}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {priceInfo ? (
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                    {formatPrice(priceInfo.priceThen, item.ticker)} → {formatPrice(priceInfo.priceNow, item.ticker)}
                                </div>
                                <div style={{
                                    fontWeight: 'bold',
                                    color: isPositive ? 'var(--accent-color)' : '#ff4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    gap: '4px'
                                }}>
                                    {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    {priceInfo.returnRate}
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: '#666' }}>로딩중...</div>
                        )}
                        {isExpanded ? <ChevronUp size={20} color="#888" /> : <ChevronDown size={20} color="#888" />}
                    </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div style={{
                        padding: '0 16px 16px',
                        borderTop: `1px solid rgba(${item.color}, 0.2)`,
                        background: 'rgba(0,0,0,0.2)'
                    }}>
                        {/* Reason */}
                        <div style={{ padding: '16px 0' }}>
                            <div style={{ fontSize: '0.9rem', color: `rgb(${item.color})`, marginBottom: '8px', fontWeight: 'bold' }}>
                                📝 선정 이유
                            </div>
                            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#ccc' }}>
                                {item.reason}
                            </p>
                        </div>

                        {/* Chart */}
                        <div style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '0.9rem', color: `rgb(${item.color})`, marginBottom: '12px', fontWeight: 'bold' }}>
                                📈 가격 변동 차트
                            </div>
                            {isLoadingChart ? (
                                <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                    차트 로딩 중...
                                </div>
                            ) : chartData && chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={chartData}>
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10, fill: '#666' }}
                                            tickFormatter={(v) => v.slice(5)} // MM-DD
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: '#666' }}
                                            domain={['auto', 'auto']}
                                            tickFormatter={(v) => isKoreanStock(item.ticker) ? `₩${Math.round(v).toLocaleString('ko-KR')}` : `$${v}`}
                                            width={isKoreanStock(item.ticker) ? 80 : 50}
                                        />
                                        <Tooltip
                                            contentStyle={{ background: '#222', border: 'none', borderRadius: '8px' }}
                                            labelStyle={{ color: '#888' }}
                                            formatter={(value) => [formatPrice(value, item.ticker), '가격']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="price"
                                            stroke={`rgb(${item.color})`}
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                    차트 데이터 없음
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="analysis-container" style={{ paddingBottom: '40px' }}>
            <header style={{ padding: '20px' }}>
                <button onClick={onBack} style={{ color: '#fff' }}><ArrowLeft size={24} /></button>
            </header>

            <div style={{ padding: '0 20px 20px' }}>
                <div style={{ marginBottom: '8px', color: 'var(--accent-color)', fontWeight: 'bold' }}>분석 완료!</div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '20px', lineHeight: '1.3' }}>
                    그때 그 기사,<br />
                    그냥 넘기지 말았어야 해!
                </h2>

                {/* Thumbnail Card */}
                <div className="glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#333' }}>
                            {meta.image ? (
                                <img src={meta.image} alt="News" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📰</div>
                            )}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '4px' }}>{meta.date || '날짜 미상'}</div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.95rem', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {meta.title}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                {aiAnalysis?.summary && aiAnalysis.summary.length > 0 && (
                    <div className="glass-card" style={{ padding: '16px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '1.2rem' }}>📰</span>
                            <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>핵심 요약</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {aiAnalysis.summary.map((line, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    gap: '10px',
                                    alignItems: 'flex-start',
                                    fontSize: '0.92rem',
                                    lineHeight: '1.5',
                                    color: '#ddd'
                                }}>
                                    <span style={{
                                        background: 'var(--accent-color)',
                                        color: '#000',
                                        borderRadius: '50%',
                                        minWidth: '22px',
                                        height: '22px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: '800',
                                        flexShrink: 0
                                    }}>{idx + 1}</span>
                                    <span>{line}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Implications */}
                {aiAnalysis?.implications && aiAnalysis.implications.length > 0 && (
                    <div className="glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '1.2rem' }}>💡</span>
                            <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>투자 시사점</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {aiAnalysis.implications.map((line, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    gap: '10px',
                                    alignItems: 'flex-start',
                                    fontSize: '0.92rem',
                                    lineHeight: '1.5',
                                    color: '#ddd'
                                }}>
                                    <span style={{
                                        background: '#FFD700',
                                        color: '#000',
                                        borderRadius: '50%',
                                        minWidth: '22px',
                                        height: '22px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: '800',
                                        flexShrink: 0
                                    }}>{idx + 1}</span>
                                    <span>{line}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Stock List */}
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '12px', color: '#fff' }}>
                        📊 관련 종목 {allStocks.length}개
                    </h3>
                    {allStocks.map((item, idx) => (
                        <ExpandableStockItem key={`${item.ticker}-${idx}`} item={item} />
                    ))}
                </div>
            </div>

            {/* Save to Hall of Regret Section */}
            {!isSaved ? (
                <div style={{ padding: '0 20px 20px' }}>
                    {!showSaveForm ? (
                        <button
                            onClick={() => setShowSaveForm(true)}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: '2px solid var(--accent-color)',
                                color: 'var(--accent-color)',
                                padding: '16px',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>🏆</span> 명예의 전당에 박제하기
                        </button>
                    ) : (
                        <div className="glass-card" style={{ padding: '20px', border: '1px solid var(--accent-color)' }}>
                            <h3 style={{ marginBottom: '16px', fontWeight: 'bold' }}>명예의 전당 등록</h3>
                            <input
                                type="text"
                                placeholder="이름 (익명 가능)"
                                value={saveName}
                                onChange={(e) => setSaveName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    marginBottom: '12px',
                                    background: 'rgba(0,0,0,0.5)',
                                    border: '1px solid #444',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                            <textarea
                                placeholder="한마디 (e.g. 껄무새의 최후...)"
                                value={saveComment}
                                onChange={(e) => setSaveComment(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    marginBottom: '16px',
                                    background: 'rgba(0,0,0,0.5)',
                                    border: '1px solid #444',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    minHeight: '80px',
                                    resize: 'none'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setShowSaveForm(false)}
                                    style={{ flex: 1, padding: '12px', background: '#333', color: '#fff', borderRadius: '8px' }}
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSave}
                                    style={{ flex: 2, padding: '12px', background: 'var(--accent-color)', color: '#000', fontWeight: 'bold', borderRadius: '8px' }}
                                >
                                    등록하기
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ padding: '0 20px 20px', textAlign: 'center' }}>
                    <div className="glass-card" style={{ padding: '20px', background: 'rgba(57, 255, 20, 0.1)', border: '1px solid var(--accent-color)' }}>
                        <h3 style={{ color: 'var(--accent-color)', marginBottom: '8px' }}>등록 완료!</h3>
                        <p style={{ color: '#ccc', fontSize: '0.9rem' }}>당신의 후회가 역사에 기록되었습니다.</p>
                    </div>
                </div>
            )}

            <div style={{ padding: '20px' }}>
                <button onClick={onBack} style={{
                    width: '100%',
                    background: '#333',
                    color: '#fff',
                    padding: '16px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                }}>
                    다른 기사 분석하기
                </button>
            </div>
        </div>
    );
};

export default Analysis;

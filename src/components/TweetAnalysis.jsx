import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../api';

const TweetAnalysis = ({ url, onBack, onViewPerson, showToast }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const isKoreanStock = (ticker) => ticker?.endsWith('.KS') || ticker?.endsWith('.KQ');
    const formatPrice = (price, ticker) => {
        if (!price && price !== 0) return '-';
        if (isKoreanStock(ticker)) return `₩${Math.round(price).toLocaleString('ko-KR')}`;
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const analyze = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/api/tweet/analyze', { url });
            setData(res.data);
            if (res.data.success) {
                showToast?.('트윗 분석 완료! 자동으로 등록되었습니다 🐦');
            }
        } catch (err) {
            setError(err.response?.data?.error || '트윗을 분석할 수 없습니다');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (url) analyze(); }, [url]);

    const loadingTexts = [
        '트윗을 가져오는 중...',
        'AI가 종목을 분석하는 중...',
        '가격 데이터를 조회하는 중...'
    ];
    const [loadingText, setLoadingText] = useState(loadingTexts[0]);
    useEffect(() => {
        if (!loading) return;
        let i = 0;
        const t = setInterval(() => { i++; setLoadingText(loadingTexts[i % loadingTexts.length]); }, 1000);
        return () => clearInterval(t);
    }, [loading]);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '24px', animation: 'pulse 1s infinite' }}>🐦</div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{loadingText}</h2>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>잠시만 기다려주세요</p>
            <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }`}</style>
        </div>
    );

    if (error) return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
            <button onClick={onBack} style={{ position: 'absolute', top: '20px', left: '20px', color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
                <ArrowLeft size={24} />
            </button>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😵</div>
            <h2 style={{ color: '#ff4444', marginBottom: '12px' }}>분석 실패</h2>
            <p style={{ color: '#888', marginBottom: '24px', lineHeight: '1.5', maxWidth: '300px' }}>{error}</p>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={analyze} style={{ padding: '12px 20px', background: 'var(--accent-color)', color: '#000', borderRadius: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                    다시 시도
                </button>
                <button onClick={onBack} style={{ padding: '12px 20px', background: '#333', color: '#fff', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
                    돌아가기
                </button>
            </div>
        </div>
    );

    if (!data) return null;

    const { tweet, person, quote } = data;
    const isPos = (quote?.rawReturn ?? 0) >= 0;
    const rawReturn = quote?.rawReturn ?? 0;

    return (
        <div style={{ paddingBottom: '40px' }}>
            <header style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
                <button onClick={onBack} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeft size={22} />
                </button>
                <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>🐦 트윗 분석</span>
                <div style={{ width: 22 }} />
            </header>

            <div style={{ padding: '20px' }}>
                {/* Success badge */}
                {data.success && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '10px 14px', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', borderRadius: '10px' }}>
                        <span>✅</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '600' }}>
                            자동으로 시장을 움직이는 사람들에 등록되었습니다!
                        </span>
                    </div>
                )}

                {/* Tweet card */}
                <div className="glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                            🐦
                        </div>
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>
                                {person?.name || tweet?.author || '알 수 없음'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                {quote?.saidAt || '날짜 미상'}
                            </div>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#e0e0e0', fontStyle: 'italic' }}>
                        "{quote?.text || tweet?.text}"
                    </p>
                </div>

                {/* Price card */}
                {data.success && quote && (
                    <div className="glass-card" style={{ padding: '20px', marginBottom: '20px', border: `1px solid rgba(${isPos ? '57,255,20' : '255,68,68'}, 0.3)` }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '16px', color: isPos ? 'var(--accent-color)' : '#ff4444' }}>
                            💰 투자 성과 — {quote.relatedTicker}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '4px' }}>매수가</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#aaa' }}>
                                    {formatPrice(quote.priceThen, quote.relatedTicker)}
                                </div>
                            </div>
                            <div style={{ color: '#444', fontSize: '1.2rem' }}>→</div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '4px' }}>현재가</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: isPos ? 'var(--accent-color)' : '#ff4444' }}>
                                    {formatPrice(quote.priceNow, quote.relatedTicker)}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '4px' }}>수익률</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800', fontSize: '1.4rem', color: isPos ? 'var(--accent-color)' : '#ff4444' }}>
                                    {isPos ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                    {quote.returnRate}
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>100만원 투자했다면? → </span>
                            <span style={{ fontSize: '1.1rem', fontWeight: '800', color: isPos ? 'var(--accent-color)' : '#ff4444' }}>
                                {((1000000 * (quote.priceNow || 0) / (quote.priceThen || 1)) / 10000).toFixed(0)}만원
                            </span>
                        </div>
                    </div>
                )}

                {/* No ticker found */}
                {!data.success && (
                    <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔍</div>
                        <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            이 트윗에서 관련 종목을 찾을 수 없습니다.<br />투자 관련 내용이 포함된 트윗을 시도해보세요.
                        </p>
                    </div>
                )}

                {/* View person button */}
                {person && (
                    <button
                        onClick={() => onViewPerson(person)}
                        style={{
                            width: '100%',
                            marginTop: '12px',
                            padding: '16px',
                            background: 'transparent',
                            border: '2px solid var(--accent-color)',
                            color: 'var(--accent-color)',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        👤 {person.name}의 다른 어록 보기
                    </button>
                )}

                <button
                    onClick={onBack}
                    style={{
                        width: '100%',
                        marginTop: '12px',
                        padding: '16px',
                        background: '#222',
                        color: '#fff',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    다른 트윗 분석하기
                </button>
            </div>
        </div>
    );
};

export default TweetAnalysis;

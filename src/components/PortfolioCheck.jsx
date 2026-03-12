import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../api';

const PortfolioCheck = ({ onBack, showToast }) => {
    const [ticker, setTicker] = useState('');
    const [date, setDate] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [tickerError, setTickerError] = useState('');

    const isKoreanStock = (t) => t?.endsWith('.KS') || t?.endsWith('.KQ');
    const formatPrice = (price, t) => {
        if (!price && price !== 0) return '-';
        if (isKoreanStock(t)) return `₩${Math.round(price).toLocaleString('ko-KR')}`;
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleCheck = async (e) => {
        e.preventDefault();
        setTickerError('');
        if (!ticker.trim()) { setTickerError('종목 코드를 입력해주세요'); return; }
        if (!date) { setTickerError('날짜를 입력해주세요'); return; }

        setLoading(true);
        setResult(null);
        try {
            const res = await api.post('/api/price', { ticker: ticker.toUpperCase().trim(), date });
            if (res.data.success) {
                setResult({ ...res.data.result, userBuyPrice: buyPrice ? parseFloat(buyPrice) : null });
            } else {
                setTickerError('가격 데이터를 찾을 수 없습니다');
            }
        } catch (err) {
            setTickerError(err.response?.data?.error || '조회에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const isPos = (result?.rawReturn ?? 0) >= 0;
    const userReturn = result?.userBuyPrice
        ? ((result.priceNow - result.userBuyPrice) / result.userBuyPrice * 100)
        : null;

    return (
        <div style={{ paddingBottom: '40px' }}>
            <header style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
                <button onClick={onBack} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <ArrowLeft size={22} />
                </button>
                <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>🧮 포트폴리오 점검</span>
            </header>

            <div style={{ padding: '24px 20px' }}>
                <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
                    매수한 종목과 날짜를 입력하면<br />
                    지금 수익률을 계산해드립니다
                </p>

                <form onSubmit={handleCheck} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '6px' }}>
                            종목 코드 *
                        </label>
                        <input
                            type="text"
                            placeholder="예: TSLA, AAPL, 005930.KS"
                            value={ticker}
                            onChange={e => { setTicker(e.target.value); setTickerError(''); }}
                            style={{
                                width: '100%', padding: '12px 14px',
                                background: '#111', border: `1px solid ${tickerError ? '#ff4444' : '#333'}`,
                                borderRadius: '10px', color: '#fff', fontSize: '0.95rem',
                                outline: 'none', fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '6px' }}>
                            매수 날짜 *
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            style={{
                                width: '100%', padding: '12px 14px',
                                background: '#111', border: '1px solid #333',
                                borderRadius: '10px', color: '#fff', fontSize: '0.95rem',
                                outline: 'none', fontFamily: 'inherit',
                                colorScheme: 'dark'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '6px' }}>
                            실제 매수가 (선택)
                        </label>
                        <input
                            type="number"
                            placeholder="직접 입력한 가격으로 계산"
                            value={buyPrice}
                            onChange={e => setBuyPrice(e.target.value)}
                            step="any"
                            style={{
                                width: '100%', padding: '12px 14px',
                                background: '#111', border: '1px solid #333',
                                borderRadius: '10px', color: '#fff', fontSize: '0.95rem',
                                outline: 'none', fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    {tickerError && (
                        <div style={{ color: '#ff4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            ⚠️ {tickerError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '16px',
                            background: loading ? '#333' : 'var(--accent-color)',
                            color: loading ? '#666' : '#000',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading ? '계산 중...' : '수익률 계산하기 🧮'}
                    </button>
                </form>

                {/* Result */}
                {result && (
                    <div className="glass-card" style={{
                        padding: '20px',
                        border: `1px solid rgba(${isPos ? '57,255,20' : '255,68,68'}, 0.4)`
                    }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '16px', color: isPos ? 'var(--accent-color)' : '#ff4444' }}>
                            📊 계산 결과 — {result.ticker}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '4px' }}>해당 날짜 가격</div>
                                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#aaa' }}>
                                    {formatPrice(result.priceThen, result.ticker)}
                                </div>
                            </div>
                            <div style={{ color: '#444', fontSize: '1.2rem', alignSelf: 'center' }}>→</div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '4px' }}>현재가</div>
                                <div style={{ fontSize: '1rem', fontWeight: '700', color: isPos ? 'var(--accent-color)' : '#ff4444' }}>
                                    {formatPrice(result.priceNow, result.ticker)}
                                </div>
                            </div>
                        </div>

                        <div style={{
                            padding: '14px', background: 'rgba(255,255,255,0.03)',
                            borderRadius: '10px', textAlign: 'center',
                            border: '1px solid rgba(255,255,255,0.04)',
                            marginBottom: userReturn !== null ? '10px' : 0
                        }}>
                            <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '6px' }}>
                                기준일 대비 수익률
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '1.8rem', color: isPos ? 'var(--accent-color)' : '#ff4444', justifyContent: 'center' }}>
                                {isPos ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
                                {result.returnRate}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
                                100만원 투자 → <strong style={{ color: isPos ? 'var(--accent-color)' : '#ff4444' }}>
                                    {((1000000 * result.priceNow / result.priceThen) / 10000).toFixed(0)}만원
                                </strong>
                            </div>
                        </div>

                        {userReturn !== null && (
                            <div style={{
                                padding: '12px', background: 'rgba(255,255,255,0.02)',
                                borderRadius: '8px', textAlign: 'center',
                                border: '1px solid rgba(255,255,255,0.04)'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px' }}>
                                    내 매수가({formatPrice(result.userBuyPrice, result.ticker)}) 기준 수익률
                                </div>
                                <div style={{ fontWeight: '800', fontSize: '1.3rem', color: userReturn >= 0 ? 'var(--accent-color)' : '#ff4444' }}>
                                    {userReturn >= 0 ? '+' : ''}{userReturn.toFixed(1)}%
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortfolioCheck;

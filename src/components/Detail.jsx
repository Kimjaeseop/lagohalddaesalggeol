import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, TrendingUp, TrendingDown, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';

// Avatar fallback: generates initials with a color
const AvatarFallback = ({ name, size = 120 }) => {
    const initials = name
        .split(/[\s()]+/)
        .filter(w => w.length > 0)
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase();

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'];
    const colorIndex = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;

    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors[colorIndex]}, ${colors[(colorIndex + 1) % colors.length]})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.35,
            fontWeight: '800',
            color: '#fff',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
            {initials}
        </div>
    );
};

// Role badges based on slug
const getRoleBadge = (slug) => {
    const roles = {
        buffett: { label: '가치투자의 대가', emoji: '👑' },
        roaringkitty: { label: '밈스톡 전설', emoji: '🐱' },
        musk: { label: 'CEO & 비전가', emoji: '🚀' },
        wood: { label: 'ARK Invest CEO', emoji: '📊' },
        pelosi: { label: '의회 투자자', emoji: '🏛️' },
        chamath: { label: 'SPAC King', emoji: '💎' },
        burry: { label: '빅숏의 주인공', emoji: '🎯' }
    };
    return roles[slug] || { label: '투자자', emoji: '📈' };
};

// Currency formatting helper
const isKoreanStock = (ticker) => ticker?.endsWith('.KS') || ticker?.endsWith('.KQ');
const formatPrice = (price, ticker) => {
    if (!price && price !== 0) return '-';
    if (isKoreanStock(ticker)) {
        return `₩${Math.round(price).toLocaleString('ko-KR')}`;
    }
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Assign colors to quotes based on index
const QUOTE_COLORS = [
    '57, 255, 20',    // green (accent)
    '255, 200, 0',    // gold
    '0, 200, 255',    // cyan
    '255, 100, 100',  // red
    '180, 130, 255',  // purple
    '255, 160, 60',   // orange
];

const Detail = ({ person, onBack }) => {
    if (!person) return null;

    const hasImage = person.image_url && !person.image_url.includes('default');
    const role = getRoleBadge(person.slug);

    // Expandable state
    const [expandedQuotes, setExpandedQuotes] = useState(new Set());
    const [chartDataMap, setChartDataMap] = useState({});
    const [loadingCharts, setLoadingCharts] = useState(new Set());

    const toggleExpand = async (quoteId, ticker, date) => {
        const newSet = new Set(expandedQuotes);
        if (newSet.has(quoteId)) {
            newSet.delete(quoteId);
        } else {
            newSet.add(quoteId);
            // Fetch chart data if not already loaded
            if (!chartDataMap[quoteId] && !loadingCharts.has(quoteId)) {
                setLoadingCharts(prev => new Set(prev).add(quoteId));
                try {
                    const res = await api.get('/api/price/history', {
                        params: { ticker, from: date }
                    });
                    if (res.data.success) {
                        setChartDataMap(prev => ({ ...prev, [quoteId]: res.data.data }));
                    }
                } catch (e) {
                    console.error(`Chart data failed for ${ticker}`);
                } finally {
                    setLoadingCharts(prev => {
                        const n = new Set(prev);
                        n.delete(quoteId);
                        return n;
                    });
                }
            }
        }
        setExpandedQuotes(newSet);
    };

    const QuoteCard = ({ quote, index }) => {
        const returnPct = ((quote.priceNow - quote.priceThen) / quote.priceThen * 100);
        const isPositive = returnPct >= 0;
        const isExpanded = expandedQuotes.has(quote.id);
        const chartData = chartDataMap[quote.id];
        const isLoadingChart = loadingCharts.has(quote.id);
        const color = QUOTE_COLORS[index % QUOTE_COLORS.length];

        return (
            <div style={{
                marginBottom: '12px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: `1px solid rgba(${color}, 0.3)`,
                background: `rgba(${color}, 0.05)`
            }}>
                {/* Collapsed Header — same as Analysis page */}
                <div
                    onClick={() => toggleExpand(quote.id, quote.ticker, quote.date)}
                    style={{
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background 0.2s'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: '#000',
                            background: `rgb(${color})`,
                            padding: '2px 10px',
                            borderRadius: '10px',
                            flexShrink: 0
                        }}>
                            {quote.ticker}
                        </span>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {quote.text.length > 40 ? quote.text.slice(0, 40) + '…' : quote.text}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>📅 {quote.date}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '8px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                {formatPrice(quote.priceThen, quote.ticker)} → {formatPrice(quote.priceNow, quote.ticker)}
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
                                {quote.returnRate || `${isPositive ? '+' : ''}${returnPct.toFixed(1)}%`}
                            </div>
                        </div>
                        {isExpanded ? <ChevronUp size={20} color="#888" /> : <ChevronDown size={20} color="#888" />}
                    </div>
                </div>

                {/* Expanded Content — same as Analysis page */}
                {isExpanded && (
                    <div style={{
                        padding: '0 16px 16px',
                        borderTop: `1px solid rgba(${color}, 0.2)`,
                        background: 'rgba(0,0,0,0.2)'
                    }}>
                        {/* Quote Bubble */}
                        <div style={{ padding: '16px 0' }}>
                            <div style={{ fontSize: '0.9rem', color: `rgb(${color})`, marginBottom: '8px', fontWeight: 'bold' }}>
                                💬 어록
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '14px',
                                borderRadius: '12px',
                                position: 'relative'
                            }}>
                                <p style={{
                                    fontStyle: 'italic',
                                    lineHeight: '1.6',
                                    fontSize: '0.95rem',
                                    color: '#e0e0e0'
                                }}>
                                    "{quote.text}"
                                </p>
                            </div>
                        </div>

                        {/* Context */}
                        {quote.context && (
                            <div style={{ paddingBottom: '12px' }}>
                                <div style={{ fontSize: '0.9rem', color: `rgb(${color})`, marginBottom: '8px', fontWeight: 'bold' }}>
                                    📝 맥락
                                </div>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#ccc' }}>
                                    {quote.context}
                                </p>
                            </div>
                        )}

                        {/* Price Detail */}
                        <div style={{ paddingBottom: '12px' }}>
                            <div style={{ fontSize: '0.9rem', color: `rgb(${color})`, marginBottom: '8px', fontWeight: 'bold' }}>
                                💰 투자 성과
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '12px',
                                padding: '16px',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '4px' }}>매수가</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#aaa' }}>
                                        {formatPrice(quote.priceThen, quote.ticker)}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', color: '#666', fontSize: '1.2rem' }}>→</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '4px' }}>현재가</div>
                                    <div style={{
                                        fontSize: '1.1rem',
                                        fontWeight: '700',
                                        color: isPositive ? 'var(--accent-color)' : '#ff4444'
                                    }}>
                                        {formatPrice(quote.priceNow, quote.ticker)}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '4px' }}>수익률</div>
                                    <div style={{
                                        fontSize: '1.3rem',
                                        fontWeight: '800',
                                        color: isPositive ? 'var(--accent-color)' : '#ff4444'
                                    }}>
                                        {isPositive ? '+' : ''}{returnPct.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                            {/* Hypothetical Investment */}
                            <div style={{
                                marginTop: '8px',
                                padding: '12px',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '8px',
                                textAlign: 'center',
                                border: '1px solid rgba(255,255,255,0.04)'
                            }}>
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>100만원 투자했다면? → </span>
                                <span style={{
                                    fontSize: '1.2rem',
                                    fontWeight: '800',
                                    color: isPositive ? 'var(--accent-color)' : '#ff4444'
                                }}>
                                    {((1000000 * quote.priceNow / quote.priceThen) / 10000).toFixed(0)}만원
                                </span>
                            </div>
                        </div>

                        {/* Chart — same as Analysis page */}
                        <div style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '0.9rem', color: `rgb(${color})`, marginBottom: '12px', fontWeight: 'bold' }}>
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
                                            tickFormatter={(v) => v.slice(5)}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: '#666' }}
                                            domain={['auto', 'auto']}
                                            tickFormatter={(v) => isKoreanStock(quote.ticker) ? `₩${Math.round(v).toLocaleString('ko-KR')}` : `$${v}`}
                                            width={isKoreanStock(quote.ticker) ? 80 : 50}
                                        />
                                        <Tooltip
                                            contentStyle={{ background: '#222', border: 'none', borderRadius: '8px' }}
                                            labelStyle={{ color: '#888' }}
                                            formatter={(value) => [formatPrice(value, quote.ticker), '가격']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="price"
                                            stroke={`rgb(${color})`}
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
        <div className="detail-container" style={{ paddingBottom: '40px' }}>
            {/* Header */}
            <header style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <button onClick={onBack} style={{ color: '#fff', padding: '4px' }}><ArrowLeft size={22} /></button>
                <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{person.name}</span>
                <button style={{ color: '#fff', padding: '4px' }}><Share2 size={20} /></button>
            </header>

            {/* Cover / Profile */}
            <div style={{
                padding: '24px 20px',
                textAlign: 'center',
                background: 'linear-gradient(180deg, rgba(57,255,20,0.03) 0%, transparent 100%)'
            }}>
                <div style={{
                    width: '100px',
                    height: '100px',
                    margin: '0 auto 14px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid rgba(57,255,20,0.3)',
                    boxShadow: '0 0 24px rgba(57,255,20,0.15)'
                }}>
                    {hasImage ? (
                        <img
                            src={person.image_url}
                            alt={person.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <AvatarFallback name={person.name} size={100} />
                    )}
                </div>

                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '4px' }}>{person.name}</h2>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.85rem',
                    color: '#888',
                    marginBottom: '16px'
                }}>
                    <span>{role.emoji}</span>
                    <span>{role.label}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '8px' }}>
                    <div className="glass-card" style={{
                        padding: '10px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <TrendingUp size={16} style={{ color: 'var(--accent-color)' }} />
                        <span style={{ color: '#888', fontSize: '0.85rem' }}>평균 수익률</span>
                        <span className="neon-text" style={{ fontSize: '1.2rem', fontWeight: '800' }}>{person.avgReturn}</span>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '16px',
                    marginTop: '12px',
                    fontSize: '0.8rem',
                    color: '#666'
                }}>
                    <span>📝 {person.quotes?.length || 0}개 어록</span>
                    <span>📊 {[...new Set(person.quotes?.map(q => q.ticker))].length || 0}개 종목</span>
                </div>
            </div>

            {/* Timeline — Analysis page style */}
            <div style={{
                padding: '20px',
                background: '#111',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                minHeight: '50vh'
            }}>
                <h3 style={{
                    marginBottom: '16px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '1.1rem'
                }}>
                    <Calendar size={18} style={{ color: 'var(--accent-color)' }} />
                    투자 타임라인 · {person.quotes?.length || 0}개
                </h3>

                {person.quotes && person.quotes.length > 0 ? (
                    person.quotes.map((quote, idx) => (
                        <QuoteCard key={quote.id} quote={quote} index={idx} />
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        등록된 어록이 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Detail;

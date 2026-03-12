import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import api from '../api';

const AvatarFallback = ({ name, size = 40 }) => {
    const initials = name.split(/[\s()]+/).filter(w => w.length > 0).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'];
    const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors[idx]}, ${colors[(idx + 1) % colors.length]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.35, fontWeight: '800', color: '#fff', flexShrink: 0
        }}>{initials}</div>
    );
};

const MEDAL = ['🥇', '🥈', '🥉'];

const Ranking = ({ onNavigate }) => {
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL | POS | NEG

    useEffect(() => {
        Promise.all([
            api.get('/api/hall-of-regret').then(res => res.data.data).catch(() => []),
            api.get('/api/benchmark/nps').then(res => res.data).catch(() => null)
        ]).then(([peopleData, npsData]) => {
            let combined = [...peopleData];
            if (npsData) {
                combined.push({
                    id: 'nps-benchmark',
                    name: '대한민국 연기금',
                    avgReturn: (npsData.oneYearReturnRaw >= 0 ? '+' : '') + npsData.oneYearReturn + '%',
                    recentQuote: {
                        ticker: 'NPS 전략적 자산배분 (1년)',
                        rawReturn: npsData.oneYearReturnRaw
                    },
                    isBenchmark: true,
                    image_url: '' // Will use fallback
                });
            }
            // Sort by descending return
            combined.sort((a, b) => (b.recentQuote?.rawReturn || 0) - (a.recentQuote?.rawReturn || 0));
            setPeople(combined);
        }).finally(() => setLoading(false));
    }, []);

    const filtered = people.filter(p => {
        if (!p.recentQuote) return false;
        const r = p.recentQuote.rawReturn;
        if (filter === 'POS') return r >= 0;
        if (filter === 'NEG') return r < 0;
        return true;
    });

    const filters = [
        { key: 'ALL', label: '전체' },
        { key: 'POS', label: '수익 📈' },
        { key: 'NEG', label: '손실 📉' },
    ];

    return (
        <div style={{ padding: '20px', paddingBottom: '80px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '20px' }}>
                📈 수익률 랭킹
            </h1>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {filters.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            background: filter === f.key ? 'var(--accent-color)' : 'rgba(255,255,255,0.08)',
                            color: filter === f.key ? '#000' : '#aaa',
                            fontWeight: filter === f.key ? '700' : '500',
                            fontSize: '0.85rem',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>랭킹 로딩 중...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filtered.map((person, idx) => {
                        const r = person.recentQuote?.rawReturn ?? 0;
                        const isPos = r >= 0;
                        const hasImg = person.image_url && !person.image_url.includes('default');
                        const isCardBenchmark = person.isBenchmark;

                        return (
                            <div
                                key={person.id}
                                className="glass-card"
                                onClick={() => isCardBenchmark ? onNavigate('HISTORY', { tab: 'NPS' }) : onNavigate('DETAIL', person)}
                                style={{
                                    padding: '14px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    border: isCardBenchmark ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.06)',
                                    background: isCardBenchmark ? 'linear-gradient(135deg, rgba(57, 255, 20, 0.05), rgba(0,0,0,0))' : undefined,
                                    transition: 'border-color 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = isCardBenchmark ? 'var(--accent-color)' : 'rgba(57,255,20,0.3)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = isCardBenchmark ? 'var(--accent-color)' : 'rgba(255,255,255,0.06)'}
                            >
                                {/* Rank */}
                                <div style={{ width: '28px', textAlign: 'center', fontSize: idx < 3 ? '1.3rem' : '0.9rem', color: idx < 3 ? undefined : '#555', fontWeight: '700', flexShrink: 0 }}>
                                    {idx < 3 ? MEDAL[idx] : `${idx + 1}`}
                                </div>

                                {/* Avatar */}
                                {hasImg ? (
                                    <img src={person.image_url} alt={person.name}
                                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                ) : (
                                    <div style={{ position: 'relative' }}>
                                        <AvatarFallback name={person.name} size={40} />
                                        {isCardBenchmark && (
                                            <div style={{ position: 'absolute', bottom: -4, right: -4, background: '#000', borderRadius: '50%', padding: '2px', fontSize: '10px' }}>
                                                🇰🇷
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{person.name}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {person.recentQuote?.ticker}
                                    </div>
                                </div>

                                {/* Return */}
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', fontWeight: '800', fontSize: '1.1rem', color: isPos ? 'var(--accent-color)' : '#ff4444' }}>
                                        {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {person.avgReturn}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {filtered.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
                            해당 조건의 인물이 없습니다
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Ranking;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, TrendingUp, ChevronRight } from 'lucide-react';
import api from '../api';
import { SkeletonCard, SkeletonFeatured } from './Skeleton';

const AvatarFallback = ({ name, size = 48 }) => {
    const initials = name.split(/[\s()]+/).filter(w => w.length > 0).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'];
    const colorIndex = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors[colorIndex]}, ${colors[(colorIndex + 1) % colors.length]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.35, fontWeight: '800', color: '#fff', flexShrink: 0,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}>{initials}</div>
    );
};

const Home = ({ onNavigate, onAnalyze, dataVersion, onMenuOpen }) => {
    const [url, setUrl] = useState('');
    const [urlError, setUrlError] = useState('');
    const [people, setPeople] = useState([]);
    const [randomSubset, setRandomSubset] = useState([]);
    const [viewMode, setViewMode] = useState('PARTIAL');
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const scrollRef = useRef(null);

    const [benchmark, setBenchmark] = useState(null);

    const shufflePeople = useCallback((data) => {
        const src = data || people;
        if (src.length <= 3) { setRandomSubset(src); return; }
        const shuffled = [...src].sort(() => 0.5 - Math.random());
        setRandomSubset(shuffled.slice(0, 3));
    }, [people]);

    const fetchData = useCallback(() => {
        setLoading(true);
        setFetchError(null);

        api.get('/api/hall-of-regret')
            .then(res => {
                const data = res.data.data;
                setPeople(data);
                shufflePeople(data);
            })
            .catch(() => setFetchError('데이터를 불러오지 못했습니다'))
            .finally(() => setLoading(false));

        api.get('/api/benchmark/nps')
            .then(res => setBenchmark(res.data))
            .catch(() => console.warn('Failed to load benchmark summary'));

    }, [dataVersion, shufflePeople]);

    useEffect(() => { fetchData(); }, [dataVersion]);

    // IntersectionObserver for carousel indicator sync
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        const cards = container.querySelectorAll('.featured-card');
        if (cards.length === 0) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveCardIndex(parseInt(entry.target.dataset.index, 10));
                    }
                });
            },
            { root: container, threshold: 0.6 }
        );
        cards.forEach(card => observer.observe(card));
        return () => observer.disconnect();
    }, [people]);

    // URL validation
    const validateUrl = (input) => {
        if (!input.trim()) return 'URL을 입력해주세요';
        try {
            const parsed = new URL(input);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return 'http:// 또는 https://로 시작하는 URL을 입력해주세요';
            }
        } catch {
            return '올바른 URL 형식이 아닙니다';
        }
        return '';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const err = validateUrl(url);
        if (err) { setUrlError(err); return; }
        setUrlError('');
        onAnalyze(url);
    };

    const featured = people.slice(0, 3);
    const allPeople = people;

    return (
        <div className="home-container" style={{ padding: '20px', paddingBottom: '90px' }}>

            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    <span style={{ color: 'var(--accent-color)' }}>₿</span> 라고할때살껄
                </div>
                <button
                    onClick={onMenuOpen}
                    style={{ fontSize: '1.4rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px' }}
                >
                    ☰
                </button>
            </header>

            {/* Hero Section */}
            <section style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px', lineHeight: '1.2' }}>
                    그때 그 말 듣고<br />
                    <span className="neon-text">샀다면?</span>
                </h1>
                <p style={{ color: 'var(--secondary-text)', marginBottom: '30px' }}>
                    당신의 <strong style={{ color: '#fff' }}>후회 비용</strong>을 지금 계산해드립니다.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="glass-card" style={{
                        display: 'flex', alignItems: 'center', padding: '12px 16px',
                        border: `1px solid ${urlError ? '#ff4444' : '#333'}`,
                        transition: 'border-color 0.2s'
                    }}>
                        <span style={{ marginRight: '10px', color: '#666' }}>🔗</span>
                        <input
                            type="text"
                            placeholder="뉴스 기사 또는 X 포스트 URL"
                            value={url}
                            onChange={(e) => { setUrl(e.target.value); if (urlError) setUrlError(''); }}
                            style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', fontSize: '1rem' }}
                        />
                    </div>
                    {urlError && (
                        <div style={{ color: '#ff4444', fontSize: '0.82rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '5px', paddingLeft: '4px' }}>
                            ⚠️ {urlError}
                        </div>
                    )}
                    {/* Source hint */}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', fontSize: '0.78rem', color: '#555' }}>
                        <span>📰 뉴스 기사</span>
                        <span>·</span>
                        <span>🐦 X(트위터) 포스트</span>
                    </div>
                    <button
                        type="submit"
                        style={{
                            background: 'var(--accent-color)', color: '#000', fontWeight: 'bold',
                            padding: '16px', borderRadius: '12px', fontSize: '1.1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            border: 'none', cursor: 'pointer'
                        }}
                    >
                        분석 시작하기 <ArrowRight size={20} />
                    </button>
                </form>
            </section>

            {/* Error State */}
            {fetchError && (
                <div style={{ textAlign: 'center', padding: '40px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>😵</div>
                    <p style={{ color: '#888', marginBottom: '16px' }}>{fetchError}</p>
                    <button onClick={fetchData} style={{ background: 'var(--accent-color)', color: '#000', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                        다시 시도하기
                    </button>
                </div>
            )}

            {!fetchError && (
                <>
                    {/* NPS Benchmark Banner */}
                    {benchmark && (
                        <div
                            className="glass-card"
                            style={{
                                padding: '16px 20px', marginBottom: '32px', cursor: 'pointer', display: 'flex',
                                justifyContent: 'space-between', alignItems: 'center',
                                background: 'linear-gradient(135deg, rgba(57, 255, 20, 0.05), rgba(0, 0, 0, 0))',
                                border: '1px solid rgba(57, 255, 20, 0.3)',
                                borderRadius: '16px'
                            }}
                            onClick={() => onNavigate('HISTORY', { tab: 'NPS' })}
                        >
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '0.05em' }}>
                                    🔥 신규 기능
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>국민연금처럼 투자했다면?</div>
                                <div style={{ fontSize: '0.85rem', color: '#ccc' }}>
                                    1년 전 대비
                                    <span style={{
                                        color: benchmark.oneYearReturnRaw >= 0 ? '#ff4d4d' : '#4d79ff',
                                        fontWeight: '800', marginLeft: '6px', fontSize: '0.95rem'
                                    }}>
                                        {benchmark.oneYearReturnRaw >= 0 ? '+' : ''}{benchmark.oneYearReturn}%
                                    </span>
                                </div>
                            </div>
                            <div style={{ background: 'rgba(57, 255, 20, 0.1)', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ArrowRight size={20} color="var(--accent-color)" />
                            </div>
                        </div>
                    )}

                    {/* Featured Cards - Horizontal Scroll */}
                    <section style={{ marginBottom: '28px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '1.2rem', borderLeft: '4px solid var(--accent-color)', paddingLeft: '12px' }}>시장을 움직이는 사람들</h2>
                        </div>

                        {loading ? (
                            <div style={{ display: 'flex', gap: '12px', overflowX: 'hidden', paddingBottom: '12px' }}>
                                <SkeletonFeatured />
                            </div>
                        ) : (
                            <>
                                <div
                                    ref={scrollRef}
                                    className="hall-of-regret-scroll"
                                    style={{
                                        display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px',
                                        scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
                                        scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: 'smooth'
                                    }}
                                >
                                    <style>{`.hall-of-regret-scroll::-webkit-scrollbar { display: none; }`}</style>

                                    {featured.map((person, idx) => (
                                        <div
                                            key={person.id}
                                            className="featured-card glass-card"
                                            data-index={idx}
                                            style={{
                                                minWidth: 'calc(100% - 40px)', maxWidth: 'calc(100% - 40px)',
                                                height: '280px', padding: '20px', position: 'relative',
                                                overflow: 'hidden', cursor: 'pointer', scrollSnapAlign: 'center',
                                                scrollSnapStop: 'always', flexShrink: 0, borderRadius: '20px',
                                                border: idx === 0 ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.1)'
                                            }}
                                            onClick={() => onNavigate('DETAIL', person)}
                                        >
                                            <div style={{
                                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                                backgroundImage: `url(${person.image_url})`,
                                                backgroundSize: 'cover', backgroundPosition: 'center',
                                                filter: 'brightness(0.5) blur(2px)', zIndex: 0, transform: 'scale(1.1)'
                                            }} />
                                            <div style={{
                                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                                background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%)', zIndex: 1
                                            }} />
                                            <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                <div>
                                                    {idx === 0 && (
                                                        <div style={{ background: 'var(--accent-color)', display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', marginBottom: '10px', color: '#000', fontWeight: 'bold' }}>
                                                            🏆 BEST 수익률
                                                        </div>
                                                    )}
                                                    <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '800', marginBottom: '6px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                                        {person.name}
                                                    </div>
                                                    <p style={{ fontSize: '1rem', lineHeight: '1.4', color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 4px rgba(0,0,0,0.8)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        "{person.recentQuote?.text}"
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '12px' }}>
                                                    <span style={{ color: '#ccc', fontSize: '0.85rem' }}>그때 샀다면?</span>
                                                    <span className="neon-text" style={{ fontSize: '1.8rem', fontWeight: '800', textShadow: '0 0 10px rgba(57,255,20,0.8)' }}>
                                                        {person.avgReturn}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Carousel indicator — synced */}
                                {featured.length > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                                        {featured.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    const cards = scrollRef.current?.querySelectorAll('.featured-card');
                                                    cards?.[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                                                }}
                                                style={{
                                                    width: i === activeCardIndex ? '22px' : '6px', height: '6px',
                                                    borderRadius: '3px',
                                                    background: i === activeCardIndex ? 'var(--accent-color)' : 'rgba(255,255,255,0.2)',
                                                    transition: 'all 0.3s ease',
                                                    border: 'none', cursor: 'pointer', padding: 0
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </section>

                    {/* People Grid */}
                    <section style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h2 style={{ fontSize: '1.1rem', borderLeft: '4px solid var(--accent-color)', paddingLeft: '12px' }}>전체 인물</h2>
                            <span style={{ color: '#666', fontSize: '0.85rem' }}>{allPeople.length}명</span>
                        </div>

                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                            </div>
                        ) : allPeople.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
                                <p>아직 등록된 인물이 없습니다.<br />뉴스 기사를 분석해보세요!</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {(viewMode === 'ALL' ? allPeople : randomSubset).map((person) => {
                                        const hasImage = person.image_url && !person.image_url.includes('default');
                                        return (
                                            <div
                                                key={person.id}
                                                className="glass-card"
                                                style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.06)' }}
                                                onClick={() => onNavigate('DETAIL', person)}
                                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(57,255,20,0.3)'}
                                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                                            >
                                                {hasImage ? (
                                                    <img src={person.image_url} alt={person.name}
                                                        style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                                                ) : (
                                                    <AvatarFallback name={person.name} size={48} />
                                                )}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '3px' }}>{person.name}</div>
                                                    <div style={{ color: '#888', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {person.recentQuote?.ticker} · "{person.recentQuote?.text?.slice(0, 30)}..."
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <div className="neon-text" style={{ fontSize: '1.2rem', fontWeight: '800' }}>{person.avgReturn}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#666' }}>수익률</div>
                                                </div>
                                                <ChevronRight size={16} style={{ color: '#444', flexShrink: 0 }} />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* View Control Buttons */}
                                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                                    {viewMode === 'PARTIAL' ? (
                                        <>
                                            <button onClick={() => setViewMode('ALL')} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', cursor: 'pointer' }}>
                                                전체 인물 보기
                                            </button>
                                            <button onClick={() => shufflePeople()} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#ccc', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                                                <span>🎲</span> 다른 인물 보기
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => setViewMode('PARTIAL')} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                                            접기
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </section>

                    {/* Feature Cards */}
                    <section style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div className="glass-card" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100px', cursor: 'pointer' }}
                                onClick={() => onNavigate('RANKING')}>
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>가치투자 vs 성장주</div>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>승자는?</div>
                                </div>
                                <div style={{ color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '1rem', marginTop: '8px' }}>
                                    <TrendingUp size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    Rank
                                </div>
                            </div>
                            <div className="glass-card" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100px', cursor: 'pointer' }}
                                onClick={() => onNavigate('PORTFOLIO_CHECK')}>
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>포트폴리오 점검</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>내 종목 수익률 →</div>
                                </div>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(57,255,20,0.1)', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>🧮</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
};

export default Home;

import React from 'react';

const MyPage = ({ onNavigate }) => {
    const stats = [
        { icon: '📊', label: '분석한 기사', value: '-' },
        { icon: '⭐', label: '등록한 인물', value: '-' },
    ];

    const settings = [
        { icon: '🌙', label: '다크 모드', value: 'ON', action: null },
        { icon: '🔔', label: '알림 설정', value: '', action: null },
        { icon: 'ℹ️', label: '서비스 소개', value: '', action: () => { } },
    ];

    return (
        <div style={{ padding: '20px', paddingBottom: '80px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>
                👤 MY
            </h1>

            {/* Profile area */}
            <div className="glass-card" style={{
                padding: '24px',
                textAlign: 'center',
                marginBottom: '20px',
                background: 'linear-gradient(135deg, rgba(57,255,20,0.05), rgba(0,0,0,0))'
            }}>
                <div style={{
                    width: '72px', height: '72px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #39FF14, #00c8ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', margin: '0 auto 12px'
                }}>
                    👤
                </div>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '4px' }}>
                    익명의 투자자
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    로그인 없이 사용 중
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                {stats.map(s => (
                    <div key={s.label} className="glass-card" style={{
                        flex: 1, padding: '16px', textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{s.icon}</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-color)' }}>
                            {s.value}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
                            {s.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Shortcut */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '12px', color: '#888' }}>
                    바로가기
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        onClick={() => onNavigate('RANKING')}
                        className="glass-card"
                        style={{
                            padding: '14px 16px', textAlign: 'left', width: '100%',
                            color: '#fff', fontSize: '0.9rem', fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
                            background: 'rgba(26,26,26,0.8)'
                        }}
                    >
                        <span>📈</span> 수익률 랭킹 보기
                    </button>
                    <button
                        onClick={() => onNavigate('PORTFOLIO_CHECK')}
                        className="glass-card"
                        style={{
                            padding: '14px 16px', textAlign: 'left', width: '100%',
                            color: '#fff', fontSize: '0.9rem', fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
                            background: 'rgba(26,26,26,0.8)'
                        }}
                    >
                        <span>🧮</span> 내 포트폴리오 점검
                    </button>
                </div>
            </div>

            {/* Interest Portfolio */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '12px', color: '#888' }}>
                    관심 포트폴리오
                </h3>
                <div
                    className="glass-card"
                    onClick={() => onNavigate('HISTORY', { tab: 'NPS' })}
                    style={{
                        padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', border: '1px solid rgba(57, 255, 20, 0.3)',
                        background: 'linear-gradient(135deg, rgba(57, 255, 20, 0.05), rgba(0,0,0,0))',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(57, 255, 20, 0.6)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(57, 255, 20, 0.3)'}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ fontSize: '1.8rem', background: '#000', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🇰🇷</div>
                        <div>
                            <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#fff', marginBottom: '2px' }}>대한민국 국민연금</div>
                            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>전략적 자산배분 벤치마크</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings */}
            <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '12px', color: '#888' }}>
                    설정
                </h3>
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    {settings.map((s, i) => (
                        <div
                            key={s.label}
                            style={{
                                padding: '14px 16px',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: i < settings.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                cursor: s.action ? 'pointer' : 'default'
                            }}
                            onClick={s.action}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                                <span>{s.icon}</span>
                                <span>{s.label}</span>
                            </div>
                            {s.value && (
                                <span style={{ fontSize: '0.8rem', color: '#555' }}>{s.value}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MyPage;

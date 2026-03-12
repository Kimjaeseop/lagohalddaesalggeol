import React, { useEffect } from 'react';

const SideMenu = ({ isOpen, onClose, onNavigate }) => {
    // Close on Escape key
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const menuItems = [
        {
            group: '네비게이션', items: [
                { key: 'HOME', icon: '🏠', label: '홈' },
                { key: 'RANKING', icon: '📈', label: '랭킹' },
                { key: 'HISTORY', icon: '⏱️', label: '분석 기록' },
                { key: 'MY', icon: '👤', label: 'MY' },
            ]
        },
        {
            group: '기능', items: [
                { key: 'HOME_ANALYSIS', icon: '📰', label: '뉴스 분석' },
                { key: 'HOME_TWEET', icon: '🐦', label: 'X 트윗 분석' },
                { key: 'PORTFOLIO_CHECK', icon: '🧮', label: '포트폴리오 점검' },
            ]
        },
    ];

    return (
        <>
            {/* Dim overlay */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    zIndex: 199,
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    transition: 'opacity 0.3s ease',
                    backdropFilter: 'blur(2px)'
                }}
            />
            {/* Slide-in panel Container */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '480px',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 200,
                overflow: 'hidden'
            }}>
                {/* Slide-in panel */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                    width: '280px',
                    height: '100%',
                    background: '#0d0d0d',
                    borderLeft: '1px solid #222',
                    transition: 'transform 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '24px 0',
                    overflowY: 'auto',
                    pointerEvents: 'auto'
                }}>
                    {/* Logo */}
                    <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #1a1a1a' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>
                            <span style={{ color: 'var(--accent-color)' }}>₿</span> 라고할때살껄
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '4px' }}>
                            그때 그 말 듣고 샀다면?
                        </div>
                    </div>

                    {/* Menu groups */}
                    {menuItems.map(group => (
                        <div key={group.group} style={{ padding: '16px 0' }}>
                            <div style={{
                                padding: '0 20px 8px',
                                fontSize: '0.7rem',
                                color: '#444',
                                fontWeight: '700',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase'
                            }}>
                                {group.group}
                            </div>
                            {group.items.map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => onNavigate(item.key)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 20px',
                                        background: 'none',
                                        border: 'none',
                                        color: '#ccc',
                                        fontSize: '0.95rem',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                    <span style={{ fontSize: '1.1rem', width: '24px', textAlign: 'center' }}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    ))}

                    {/* Footer */}
                    <div style={{
                        marginTop: 'auto',
                        padding: '16px 20px',
                        borderTop: '1px solid #1a1a1a',
                        color: '#333',
                        fontSize: '0.75rem'
                    }}>
                        v1.0.0 · 라고할때살껄
                    </div>
                </div>
            </div>
        </>
    );
};

export default SideMenu;

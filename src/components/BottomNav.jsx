import React from 'react';

const BottomNav = ({ activeTab, onTabChange }) => {
    const tabs = [
        { key: 'HOME', icon: '🏠', label: '홈' },
        { key: 'RANKING', icon: '📈', label: '랭킹' },
        { key: 'HISTORY', icon: '⏱️', label: '기록' },
        { key: 'MY', icon: '👤', label: 'MY' },
    ];

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '480px',
            background: 'rgba(5,5,5,0.95)',
            borderTop: '1px solid #222',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '10px 0 14px',
            zIndex: 100,
            backdropFilter: 'blur(12px)'
        }}>
            {tabs.map(tab => {
                const active = activeTab === tab.key;
                return (
                    <button
                        key={tab.key}
                        onClick={() => onTabChange(tab.key)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '3px',
                            color: active ? 'var(--accent-color)' : '#555',
                            transition: 'color 0.2s',
                            padding: '4px 12px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{tab.icon}</span>
                        <span style={{
                            fontSize: '0.65rem',
                            fontWeight: active ? '700' : '500',
                            letterSpacing: '0.02em'
                        }}>{tab.label}</span>
                        {active && (
                            <div style={{
                                width: '4px', height: '4px',
                                borderRadius: '50%',
                                background: 'var(--accent-color)',
                                marginTop: '1px'
                            }} />
                        )}
                    </button>
                );
            })}
        </nav>
    );
};

export default BottomNav;

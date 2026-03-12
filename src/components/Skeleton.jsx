import React from 'react';

export const SkeletonPulse = ({ width = '100%', height = '20px', radius = '8px', style = {} }) => (
    <div style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        flexShrink: 0,
        ...style
    }} />
);

export const SkeletonCard = () => (
    <div className="glass-card" style={{
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        border: '1px solid rgba(255,255,255,0.06)'
    }}>
        <SkeletonPulse width="48px" height="48px" radius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SkeletonPulse width="55%" height="15px" />
            <SkeletonPulse width="40%" height="12px" />
        </div>
        <SkeletonPulse width="60px" height="24px" radius="6px" />
    </div>
);

export const SkeletonFeatured = () => (
    <div className="glass-card" style={{
        minWidth: 'calc(100% - 40px)',
        maxWidth: 'calc(100% - 40px)',
        height: '280px',
        padding: '20px',
        borderRadius: '20px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: '1px solid rgba(255,255,255,0.1)'
    }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SkeletonPulse width="90px" height="24px" radius="6px" />
            <SkeletonPulse width="65%" height="20px" />
            <SkeletonPulse width="85%" height="16px" />
            <SkeletonPulse width="70%" height="16px" />
        </div>
        <div>
            <SkeletonPulse width="100%" height="1px" radius="0" />
            <div style={{ height: '12px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SkeletonPulse width="80px" height="16px" />
                <SkeletonPulse width="100px" height="36px" radius="8px" />
            </div>
        </div>
    </div>
);

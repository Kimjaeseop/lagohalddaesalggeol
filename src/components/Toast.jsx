import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const showTimer = setTimeout(() => setVisible(true), 10);
        const hideTimer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300);
        }, duration);
        return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }, []);

    const colors = {
        success: { bg: 'rgba(57,255,20,0.15)', border: 'var(--accent-color)', icon: '✅' },
        error: { bg: 'rgba(255,68,68,0.15)', border: '#ff4444', icon: '❌' },
        info: { bg: 'rgba(0,200,255,0.15)', border: '#00c8ff', icon: 'ℹ️' }
    };
    const c = colors[type] || colors.success;

    return (
        <div style={{
            position: 'fixed',
            top: visible ? '20px' : '-120px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            transition: 'top 0.3s ease',
            padding: '14px 20px',
            borderRadius: '12px',
            background: c.bg,
            border: `1px solid ${c.border}`,
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            maxWidth: '90%',
            width: 'max-content',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }}>
            <span style={{ fontSize: '1.1rem' }}>{c.icon}</span>
            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#fff' }}>{message}</span>
        </div>
    );
};

export default Toast;

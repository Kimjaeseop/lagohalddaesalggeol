import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    textAlign: 'center',
                    padding: '20px',
                    background: '#000'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔧</div>
                    <h2 style={{ color: '#fff', marginBottom: '12px', fontSize: '1.4rem' }}>
                        문제가 발생했습니다
                    </h2>
                    <p style={{ color: '#888', marginBottom: '24px', lineHeight: '1.5' }}>
                        잠시 후 다시 시도해주세요
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            background: 'var(--accent-color)',
                            color: '#000',
                            padding: '12px 28px',
                            borderRadius: '10px',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            border: 'none'
                        }}
                    >
                        새로고침
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;

import React from 'react';
import { error as logError } from '../utils/logger';

/**
 * Stilize, lokalize fallback'li ErrorBoundary.
 *
 * Kullanım:
 *   <ErrorBoundary>
 *     <RiskyComponent />
 *   </ErrorBoundary>
 *
 * Birden fazla yerde kullanılabilir (örn. her ekran kendi boundary'sine
 * sahip olabilir; böylece bir ekran çökerse tüm uygulama düşmez).
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        logError('ErrorBoundary yakaladı:', error, errorInfo);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        // Aynı ekranı tekrar denemek için ana sayfaya dön
        if (this.props.onReset) {
            this.props.onReset();
        } else {
            // Son çare: sayfayı yeniden yükle
            try {
                window.location.reload();
            } catch {
                /* yok say */
            }
        }
    };

    render() {
        if (this.state.hasError) {
            // i18n henüz yüklenmemiş olabilir; sade ama kibar bir mesaj
            const msg = this.props.fallbackMessage || 'Bir şeyler ters gitti';
            const detail = this.props.showDetail ? (this.state.error?.message || '') : '';
            const btnLabel = this.props.buttonLabel || 'Tekrar Dene';

            return (
                <div style={{
                    minHeight: '60vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    textAlign: 'center',
                }}>
                    <div style={{
                        fontSize: '3rem',
                        marginBottom: '1rem',
                    }}>⚠️</div>
                    <h2 style={{
                        color: 'var(--text-primary, #fff)',
                        margin: '0 0 0.5rem 0',
                        fontSize: '1.25rem',
                    }}>{msg}</h2>
                    {detail && (
                        <p style={{
                            color: 'var(--text-light, #aaa)',
                            fontSize: '0.85rem',
                            margin: '0 0 1.5rem 0',
                            fontFamily: 'monospace',
                            maxWidth: '500px',
                            wordBreak: 'break-word',
                            opacity: 0.7,
                        }}>{detail}</p>
                    )}
                    <button
                        onClick={this.handleReload}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--accent-primary, #00ff88)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                        }}
                    >
                        {btnLabel}
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;

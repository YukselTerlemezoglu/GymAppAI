import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

/* eslint-disable react-refresh/only-export-components -- provider + hook + haptic ayni dosyada bilincli olarak tutuluyor */
// Kisa dokunsal geri bildirim (destekleyen cihazlarda)
export const haptic = (pattern = 15) => {
    try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    } catch { /* sessizce yut */ }
};

const ICONS = {
    success: <CheckCircle2 size={18} color="#00ff88" />,
    error: <XCircle size={18} color="#ff4d6d" />,
    info: <Info size={18} color="#00c3ff" />,
    warning: <AlertTriangle size={18} color="#ffb020" />
};

let toastId = 0;

/**
 * Toast + Confirm provider.
 * - toast.success('...') / toast.error('...') / toast.info('...') / toast.warning('...')
 * - confirmDialog({ title, message, confirmLabel, cancelLabel, danger }) -> Promise<boolean>
 * Uygulamanin neon/glass temasina uygun; mobilde ustte, kucuk ekranda tam genislik.
 */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [confirmState, setConfirmState] = useState(null);
    const confirmResolver = useRef(null);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const push = useCallback((message, type = 'info', opts = {}) => {
        const id = ++toastId;
        const duration = opts.duration ?? 2600;
        setToasts(prev => [...prev.slice(-2), { id, message, type }]);
        if (type === 'success' || type === 'error') haptic(type === 'error' ? [30, 40, 30] : 15);
        if (duration > 0) {
            setTimeout(() => dismiss(id), duration);
        }
        return id;
    }, [dismiss]);

    const toast = useMemo(() => ({
        success: (m, o) => push(m, 'success', o),
        error: (m, o) => push(m, 'error', o),
        info: (m, o) => push(m, 'info', o),
        warning: (m, o) => push(m, 'warning', o)
    }), [push]);
    const confirmDialog = useCallback((opts) => {
        return new Promise((resolve) => {
            confirmResolver.current = resolve;
            setConfirmState(opts);
        });
    }, []);

    const closeConfirm = (result) => {
        if (confirmResolver.current) {
            confirmResolver.current(result);
            confirmResolver.current = null;
        }
        setConfirmState(null);
    };

    // Confirm acikken body scroll kilidi
    useEffect(() => {
        if (!confirmState) return;
        const onKey = (e) => {
            if (e.key === 'Escape') closeConfirm(false);
            if (e.key === 'Enter') closeConfirm(true);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [confirmState]);

    const api = { toast, confirmDialog, haptic };

    return (
        <ToastContext.Provider value={api}>
            {children}

            {/* Toast stack: ustte, safe-area hesapli */}
            {createPortal(
                <div style={{
                    position: 'fixed',
                    top: 'calc(env(safe-area-inset-top, 0px) + 10px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10000,
                    width: 'min(92vw, 420px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    pointerEvents: 'none'
                }}>
                    <AnimatePresence>
                        {toasts.map(t => (
                            <motion.div
                                key={t.id}
                                layout
                                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                                transition={{ duration: 0.18 }}
                                onClick={() => dismiss(t.id)}
                                style={{
                                    pointerEvents: 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '11px 14px',
                                    borderRadius: '12px',
                                    background: 'rgba(10, 14, 22, 0.92)',
                                    border: `1px solid ${t.type === 'error' ? 'rgba(255,77,109,0.45)' : t.type === 'success' ? 'rgba(0,255,136,0.35)' : 'rgba(0,195,255,0.3)'}`,
                                    boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
                                    backdropFilter: 'blur(12px)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    WebkitBackdropFilter: 'blur(12px)'
                                }}
                            >
                                {ICONS[t.type] || ICONS.info}
                                <span style={{ flex: 1 }}>{t.message}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>,
                document.body
            )}

            {/* Themed confirm dialog */}
            {createPortal(
                <AnimatePresence>
                    {confirmState && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => closeConfirm(false)}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.65)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 10001,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '1.5rem'
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.92, y: 12, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.95, y: 8, opacity: 0 }}
                                transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: 'min(92vw, 380px)',
                                    background: 'linear-gradient(160deg, rgba(20,26,38,0.98), rgba(10,14,22,0.98))',
                                    border: `1px solid ${confirmState.danger ? 'rgba(255,77,109,0.4)' : 'rgba(0,195,255,0.35)'}`,
                                    borderRadius: '18px',
                                    padding: '1.4rem',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
                                }}
                            >
                                <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {confirmState.danger
                                        ? <AlertTriangle size={20} color="#ff4d6d" />
                                        : <Info size={20} color="#00c3ff" />}
                                    {confirmState.title}
                                </h3>
                                <p style={{ margin: '0 0 1.2rem 0', color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                    {confirmState.message}
                                </p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => { haptic(10); closeConfirm(false); }}
                                        style={{
                                            flex: 1,
                                            padding: '11px 0',
                                            borderRadius: '10px',
                                            border: '1px solid rgba(255,255,255,0.14)',
                                            background: 'rgba(255,255,255,0.06)',
                                            color: 'var(--text-primary)',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {confirmState.cancelLabel || 'Vazgeç'}
                                    </button>
                                    <button
                                        onClick={() => { haptic(15); closeConfirm(true); }}
                                        style={{
                                            flex: 1,
                                            padding: '11px 0',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: confirmState.danger
                                                ? 'linear-gradient(135deg, #ff4d6d, #c9184a)'
                                                : 'linear-gradient(135deg, #00c3ff, #0074d9)',
                                            color: '#fff',
                                            fontWeight: 700,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            boxShadow: confirmState.danger
                                                ? '0 4px 18px rgba(255,77,109,0.35)'
                                                : '0 4px 18px rgba(0,195,255,0.35)'
                                        }}
                                    >
                                        {confirmState.confirmLabel || 'Onayla'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        // Provider yoksa sessiz fallback — uygulama kırılmasın
        return {
            toast: { success: () => {}, error: () => {}, info: () => {}, warning: () => {} },
            confirmDialog: async () => window.confirm(''),
            haptic
        };
    }
    return ctx;
}
/* eslint-enable react-refresh/only-export-components */

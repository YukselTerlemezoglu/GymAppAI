import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import tr from './tr';
import en from './en';

const translations = { tr, en };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [lang, setLangState] = useState(() => {
        try {
            return localStorage.getItem('gym_app_lang') || 'tr';
        } catch {
            return 'tr';
        }
    });

    const setLang = useCallback((newLang) => {
        setLangState(newLang);
        try { localStorage.setItem('gym_app_lang', newLang); } catch { /* ozel mod/gizli modda yazma engelli olabilir */ }
    }, []);

    const t = useCallback((key, params = {}) => {
        let text = translations[lang]?.[key] || translations['tr']?.[key] || key;
        
        if (typeof text !== 'string') {
            return String(text || key);
        }

        // Handle variables like {{name}}
        Object.keys(params).forEach(param => {
            text = text.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
        });
        
        return text;
    }, [lang]);

    const contextValue = useMemo(() => ({ t, lang, setLang }), [t, lang, setLang]);

    return (
        <LanguageContext.Provider value={contextValue}>
            {children}
        </LanguageContext.Provider>
    );
}

/* eslint-disable react-refresh/only-export-components -- context + hook ayni dosyada bilincli olarak tutuluyor */
export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// Alias for convenience
export const useTranslation = useLanguage;
/* eslint-enable react-refresh/only-export-components */

import { useMemo, useSyncExternalStore } from 'react';

// Date.now() render/useMemo icinde "impure" sayilir (react-hooks/purity).
// Gunun baslangicini external store gibi okuyarak kurala uygun hale getirir.
let cachedSnapshot = null;
const listeners = new Set();
const MINUTE_MS = 60 * 1000;
let timerId = null;

function getSnapshot() {
    const todayStr = new Date().toDateString();
    if (!cachedSnapshot || cachedSnapshot.todayStr !== todayStr) {
        cachedSnapshot = { todayStr, midnight: new Date(todayStr).getTime() };
        listeners.forEach(l => l());
    }
    return cachedSnapshot;
}

function subscribe(cb) {
    listeners.add(cb);
    if (!timerId) {
        timerId = setInterval(() => getSnapshot(), 5 * MINUTE_MS);
    }
    return () => {
        listeners.delete(cb);
        if (listeners.size === 0 && timerId) {
            clearInterval(timerId);
            timerId = null;
        }
    };
}

/**
 * Bugunun gece yarisi (00:00) timestamp'ini dondurur.
 * Gun degisince bilesenleri yeniden render eder; render sirasinda
 * Date.now() cagrilmadigi icin purity kuralini ihlal etmez.
 */
export function useToday() {
    const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    return snap.midnight;
}

/** Verilen gun sayisi icin cutoff timestamp'i (bugun - days). */
export function useCutoff(days) {
    const midnight = useToday();
    return useMemo(() => midnight - days * 24 * 60 * 60 * 1000, [midnight, days]);
}

import { db, auth } from '../services/firebase';
import {
    doc, getDoc, setDoc, updateDoc, deleteDoc,
    collection, query, where, getDocs, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { log, error as logError } from './logger';

/*
 * ARKADAS SISTEMI (tamamen istemci tarafli, Firestore kurallariyla korunur)
 *
 * Koleksiyon yapisi:
 *   profiles/{uid}     -> { name, code, xp, level, updatedAt }
 *                         Herkes OKUYABILIR (lider tablosu icin), sadece sahibi yazar.
 *   requests/{toUid}_{fromUid} -> { from: uid, fromName, to: uid, createdAt }
 *                         fromUid=from olan olusturabilir; toUid kendi dokumanini
 *                         okuyup silebilir (kabul/red).
 *   friendships/{a}_{b}   (a < b alfabetik) -> { users: [a, b], createdAt }
 *                         Eslesmenin iki tarafi da olusturabilir (istek kabulunda),
 *                         sadece a veya b silebilir.
 *
 * Kod formati: 6 karakter (A-Z, 2-9; karistirilabilir harfler atlandi: 0/O, 1/I).
 */

// Karistirilabilir olmayan karakterler cikarildi
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const genCode = () => {
    let c = '';
    for (let i = 0; i < 6; i++) {
        c += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    return c;
};

const uidOrNull = () => (auth && auth.currentUser ? auth.currentUser.uid : null);

/* ---------------- PROFIL ---------------- */

/**
 * Kullanicinin profilini olusturur/gunceller. Kod ilk olusumda atanir ve
 * sonrasinda degismez (arkadaslar kodu ezberler/baglanti kurar).
 */
export const ensureProfile = async ({ name, xp, level }) => {
    const uid = uidOrNull();
    if (!uid || !db) return null;
    try {
        const ref = doc(db, 'profiles', uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            const profile = {
                name: String(name || 'Athlete').slice(0, 30),
                code: genCode(),
                xp: Number(xp) || 0,
                level: Number(level) || 1,
                updatedAt: serverTimestamp()
            };
            await setDoc(ref, profile);
            return profile;
        }
        await updateDoc(ref, { updatedAt: serverTimestamp() });
        return snap.data();
    } catch (err) {
        logError('ensureProfile:', err);
        return null;
    }
};

/** Profilin XP/seviye/isim alanlarini gunceller (arkadaslarini etkiler). */
export const publishProfile = async ({ name, xp, level, weekStats, duelTarget }) => {
    const uid = uidOrNull();
    if (!uid || !db) return;
    try {
        const ref = doc(db, 'profiles', uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            await ensureProfile({ name, xp, level });
            return;
        }
        const existing = snap.data() || {};
        const patch = {};
        if (typeof name === 'string' && name.trim()) patch.name = name.trim().slice(0, 30);
        if (Number.isFinite(Number(xp))) patch.xp = Number(xp) || 0;
        if (Number.isFinite(Number(level))) patch.level = Number(level) || 1;
        // Haftalik duello alanlari (opsiyonel): bozuk deger yazilmasin
        if (weekStats && typeof weekStats === 'object' && typeof weekStats.key === 'string') {
            const clean = {
                key: weekStats.key,
                days: Number(weekStats.days) || 0,
                volume: Number(weekStats.volume) || 0
            };
            // Hafta degmisse eski istatistigi arsivle (gecen hafta duellosu
            // sonucu boylece ezilmez; prevWeekStats tek slotluk arsivdir).
            const cur = existing.weekStats;
            if (cur && typeof cur.key === 'string' && cur.key !== clean.key) {
                patch.prevWeekStats = cur;
            }
            patch.weekStats = clean;
        }
        if (duelTarget && typeof duelTarget === 'object' && typeof duelTarget.uid === 'string' && typeof duelTarget.week === 'string') {
            patch.duelTarget = { uid: duelTarget.uid, week: duelTarget.week };
        }
        patch.updatedAt = serverTimestamp();
        await updateDoc(ref, patch);
    } catch (err) {
        logError('publishProfile:', err);
    }
};

/**
 * Duello hedefini isaretler/kaldirir (profil dokumanina yazar).
 * Karsilikli onay modeli: her iki taraf da birbirini isaretleyince duel aktif.
 */
export const setDuelTarget = async (targetUid, week) => {
    const uid = uidOrNull();
    if (!uid || !db || !targetUid || !week) return { error: 'auth' };
    try {
        await updateDoc(doc(db, 'profiles', uid), {
            duelTarget: { uid: targetUid, week },
            updatedAt: serverTimestamp()
        });
        return { ok: true };
    } catch (err) {
        logError('setDuelTarget:', err);
        return { error: 'network' };
    }
};

/** Duello hedefini kaldirir (hafta iptali). */
export const clearDuelTarget = async () => {
    const uid = uidOrNull();
    if (!uid || !db) return { error: 'auth' };
    try {
        await updateDoc(doc(db, 'profiles', uid), {
            duelTarget: null,
            updatedAt: serverTimestamp()
        });
        // Ayna da temizlenir; aksi halde Firestore ile drift olusur.
        try { localStorage.removeItem('gym_app_duel_target'); } catch { /* kota */ }
        return { ok: true };
    } catch (err) {
        logError('clearDuelTarget:', err);
        return { error: 'network' };
    }
};

/**
 * Kendi profil kaydini bir kez okur (duelTarget aynasi icin).
 * Yeni cihazda localStorage bosken Firestore'daki hedefi kurtarir.
 */
export const getMyProfile = async () => {
    const uid = uidOrNull();
    if (!uid || !db) return null;
    try {
        const snap = await getDoc(doc(db, 'profiles', uid));
        return snap.exists() ? snap.data() : null;
    } catch (err) {
        logError('getMyProfile:', err);
        return null;
    }
};

/** Kod ile profil arar. Kendi kodunu girerse hata dondurur. */
export const findByCode = async (code) => {
    if (!db) return null;
    const clean = String(code || '').trim().toUpperCase();
    if (clean.length !== 6) return { error: 'format' };
    try {
        const q = query(collection(db, 'profiles'), where('code', '==', clean));
        const snap = await getDocs(q);
        if (snap.empty) return { error: 'notfound' };
        const docSnap = snap.docs[0];
        if (docSnap.id === uidOrNull()) return { error: 'self' };
        return { profile: { uid: docSnap.id, ...docSnap.data() } };
    } catch (err) {
        logError('findByCode:', err);
        return { error: 'network' };
    }
};

/* ---------------- ISTEKLER ---------------- */

const reqId = (to, from) => `${to}_${from}`;

/** toUid kisinden gelen istegin dokumanini getirir. */
export const getIncomingRequest = async (fromUid) => {
    const uid = uidOrNull();
    if (!uid || !db) return null;
    try {
        const snap = await getDoc(doc(db, 'requests', reqId(uid, fromUid)));
        return snap.exists() ? { from: fromUid, ...snap.data() } : null;
    } catch (err) {
        logError('getIncomingRequest:', err);
        return null;
    }
};

/**
 * Kodla arkadaslik istegi gonderir.
 * - Hedef kullanici zaten arkadassa hata doner.
 * - Karsi taraftan bize gelen bekleyen istek varsa otomatik kabul edilir
 *   (karsilikli istek -> aninda eslesme, klasik UX).
 */
export const sendRequest = async (code) => {
    const uid = uidOrNull();
    if (!uid || !db) return { error: 'auth' };

    const found = await findByCode(code);
    if (found.error) return found;
    const target = found.profile;

    if (await areFriends(target.uid)) return { error: 'already' };

    // Karsi taraftan bize istek var mi? -> kabul et
    const incoming = await getIncomingRequest(target.uid);
    if (incoming) {
        await acceptRequest(target.uid);
        return { accepted: true, profile: target };
    }

    try {
        const meSnap = await getDoc(doc(db, 'profiles', uid));
        const myName = meSnap.exists() ? meSnap.data().name : 'Athlete';
        await setDoc(doc(db, 'requests', reqId(target.uid, uid)), {
            from: uid,
            fromName: String(myName).slice(0, 30),
            to: target.uid,
            createdAt: serverTimestamp()
        });
        return { sent: true, profile: target };
    } catch (err) {
        logError('sendRequest:', err);
        return { error: 'network' };
    }
};

/** Bana gelen bekleyen istekleri canli dinler (realtime). */
export const subscribeRequests = (cb) => {
    const uid = uidOrNull();
    if (!uid || !db) return () => {};
    const q = query(collection(db, 'requests'), where('to', '==', uid));
    return onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        cb(list);
    }, (err) => logError('subscribeRequests:', err));
};

/** fromUid kisinden gelen istegi kabul eder, friendship olusturur, istegi siler. */
export const acceptRequest = async (fromUid) => {
    const uid = uidOrNull();
    if (!uid || !db) return { error: 'auth' };
    try {
        const [a, b] = uid < fromUid ? [uid, fromUid] : [fromUid, uid];
        await setDoc(doc(db, 'friendships', `${a}_${b}`), {
            users: [a, b],
            createdAt: serverTimestamp()
        });
        await deleteDoc(doc(db, 'requests', reqId(uid, fromUid)));
        return { ok: true };
    } catch (err) {
        logError('acceptRequest:', err);
        return { error: 'network' };
    }
};

/** fromUid kisinden gelen istegi reddeder (dokumani siler). */
export const declineRequest = async (fromUid) => {
    const uid = uidOrNull();
    if (!uid || !db) return { error: 'auth' };
    try {
        await deleteDoc(doc(db, 'requests', reqId(uid, fromUid)));
        return { ok: true };
    } catch (err) {
        logError('declineRequest:', err);
        return { error: 'network' };
    }
};

/* ---------------- ARKADASLIK ---------------- */

const pairId = (u1, u2) => (u1 < u2 ? `${u1}_${u2}` : `${u2}_${u1}`);

export const areFriends = async (otherUid) => {
    const uid = uidOrNull();
    if (!uid || !db || !otherUid) return false;
    try {
        const snap = await getDoc(doc(db, 'friendships', pairId(uid, otherUid)));
        return snap.exists();
    } catch (err) {
        logError('areFriends:', err);
        return false;
    }
};

/** Arkadasliklarimi canli dinler. */
export const subscribeFriendships = (cb) => {
    const uid = uidOrNull();
    if (!uid || !db) return () => {};
    const q = query(collection(db, 'friendships'), where('users', 'array-contains', uid));
    return onSnapshot(q, (snap) => {
        const friendUids = snap.docs.flatMap((d) => d.data().users).filter((u) => u !== uid);
        cb(friendUids);
    }, (err) => logError('subscribeFriendships:', err));
};

/** Arkadaslarimin profil dokumanlarini ceker (lider tablosu icin). */
export const getFriendProfiles = async (friendUids) => {
    if (!db || !Array.isArray(friendUids) || friendUids.length === 0) return [];
    try {
        const snaps = await Promise.all(friendUids.map((id) => getDoc(doc(db, 'profiles', id))));
        return snaps
            .filter((s) => s.exists())
            .map((s) => ({ uid: s.id, ...s.data() }));
    } catch (err) {
        logError('getFriendProfiles:', err);
        return [];
    }
};

/** Arkadasligi kaldirir (her iki taraf da silebilir). */
export const removeFriend = async (otherUid) => {
    const uid = uidOrNull();
    if (!uid || !db) return { error: 'auth' };
    try {
        await deleteDoc(doc(db, 'friendships', pairId(uid, otherUid)));
        return { ok: true };
    } catch (err) {
        logError('removeFriend:', err);
        return { error: 'network' };
    }
};

/** Uygulamayi tamamen silme talebi icin profil dokumanini kaldirir. */
export const deleteProfile = async () => {
    const uid = uidOrNull();
    if (!uid || !db) return;
    try {
        await deleteDoc(doc(db, 'profiles', uid));
    } catch (err) {
        logError('deleteProfile:', err);
    }
};

// log bazi build'lerde kullanilmayabilir; referans kalsin
void log;

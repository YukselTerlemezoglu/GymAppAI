// Kanonik gun anahtari (YYYY-MM-DD) - HER ZAMAN yerel saat.
// new Date().toISOString().split('T')[0] UTC uretir; UTC+3'te 00:00-03:00
// arasinda "dun"un tarihini verir ve gun bazli tum mantiklari (gorev, su,
// check-in, cark, activity marks) bir saat dilimi kadar kaydirir.
// Tum uygulama bu tek fonksiyonu kullanir; deger JavaScript Date'in
// yerel bilesenlerinden olusturulur.

/**
 * Yerel tarihli gun anahtari. Date disinda string/number da kabul eder.
 * @param {Date|string|number} [date] - yoksa simdi
 * @returns {string} "YYYY-MM-DD"
 */
export function localDayKey(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export default localDayKey;
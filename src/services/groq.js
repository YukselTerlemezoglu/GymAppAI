/**
 * Groq AI Client Helper (Vercel Edge Function sürümü)
 *
 * İstek Vercel'deki /api/groq endpoint'ine gider.
 * - Firebase Auth ID Token eklenir (auth doğrulaması için)
 * - Groq API anahtarı Vercel Environment Variables'da saklanır,
 *   istemciye ASLA gönderilmez.
 *
 * Kullanım:
 *   import { generateProgram, estimateMacros } from '../services/groq';
 */

import { auth } from './firebase';
import { error as logError } from '../utils/logger';

/**
 * Firebase ID Token al (varsa).
 * Cloud Sync kullanmıyorsan token olmaz - bu durumda AI çalışmaz,
 * kullanıcıya giriş yapması için uyarı göster.
 */
async function getIdToken() {
  if (!auth || !auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch (err) {
    logError('ID token alınamadı:', err);
    return null;
  }
}

/**
 * Genel AI isteği. Diğer yüksek-seviye fonksiyonlar bunu kullanır.
 * @param {Object} params
 * @param {'program'|'nutrition'} params.kind
 * @param {string} params.systemPrompt
 * @param {string} params.userPrompt
 * @param {number} [params.temperature=0.5]
 * @returns {Promise<Object>} parse edilmiş JSON objesi
 */
export async function callGroq({ kind, systemPrompt, userPrompt, temperature = 0.5 }) {
  const idToken = await getIdToken();
  if (!idToken) {
    const e = new Error('AI için giriş yapmalısınız.');
    e.code = 'UNAUTHENTICATED';
    throw e;
  }

  let resp;
  try {
    resp = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, kind, systemPrompt, userPrompt, temperature }),
    });
  } catch (err) {
    logError('AI servisi çağrısı başarısız:', err);
    const e = new Error('AI servisine ulaşılamaz. İnternet bağlantınızı kontrol edin.');
    e.code = 'NETWORK';
    throw e;
  }

  // HTTP seviyesi hataları semantic code'lara çevir
  if (!resp.ok) {
    let body = null;
    try { body = await resp.json(); } catch { /* json değilse yok say */ }
    const msg = body?.error || `AI servisi hatası (${resp.status}).`;
    const detail = body?.detail ? ` [${body.detail}]` : '';

    if (resp.status === 401) {
      const e = new Error('AI için giriş yapmalısınız.');
      e.code = 'UNAUTHENTICATED';
      throw e;
    }
    if (resp.status === 429) {
      const e = new Error('Çok fazla istek. Lütfen bir dakika bekleyin.');
      e.code = 'RATE_LIMIT';
      throw e;
    }
    if (resp.status === 502 || resp.status === 503) {
      const e = new Error('AI servisi geçeri olarak ulaşılamaz.');
      e.code = 'UNAVAILABLE';
      throw e;
    }
    const e = new Error(msg + detail);
    e.code = 'UNKNOWN';
    throw e;
  }

  const data = await resp.json();
  const rawContent = data?.content;
  if (typeof rawContent !== 'string' || rawContent.length === 0) {
    throw new Error('AI geçerli bir yanıt üretmedi.');
  }

  // Sunucu zaten markdown bloklarını temizliyor; client tarafında da savunma.
  const cleaned = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    const e = new Error('AI yanıtı geçerli JSON formatında değil.');
    e.cause = parseErr;
    e.raw = cleaned.slice(0, 500);
    throw e;
  }
}

/**
 * Antrenman programı üret.
 */
export async function generateProgram(ctx) {
  const { goal, days, duration, equipment, level, cardio, lang } = ctx;

  const systemPrompt =
    'You are a professional fitness coach. You must ONLY output a valid JSON object matching the requested schema. ' +
    'No other text, no markdown formatting like ```json.';

  const userPrompt =
    lang === 'tr'
      ? `Sen profesyonel bir fitness antrenörüsün. Hedef: ${goal}, Gün: ${days}, Süre: ${duration}, Ekipman: ${equipment}, Seviye: ${level}, Kardiyo: ${cardio}. JSON FORMATINDA CEVAP VER. TÜM İSİMLER TÜRKÇE OLMALI. Şema: { days: [ { dayName: string, exercises: [ { name: string, sets: number, weight: string, reps: string } ] } ] }`
      : `You are a professional fitness coach. Goal: ${goal}, Days: ${days}, Duration: ${duration}, Equipment: ${equipment}, Level: ${level}, Cardio: ${cardio}. OUTPUT IN JSON FORMAT. ALL NAMES MUST BE IN ENGLISH. Schema: { days: [ { dayName: string, exercises: [ { name: string, sets: number, weight: string, reps: string } ] } ] }`;

  const data = await callGroq({
    kind: 'program',
    systemPrompt,
    userPrompt,
    temperature: 0.5,
  });

  if (!data || !Array.isArray(data.days)) {
    throw new Error('AI geçerli bir program şeması üretmedi.');
  }

  data.isAiGenerated = true;
  return data;
}

/**
 * Bir öğünün makro değerlerini tahmin et.
 */export async function estimateMacros(mealText, lang) {
  const systemPrompt = 'You are a professional dietitian. Output JSON only.';
  const userPrompt =
    lang === 'tr'
      ? `Sen profesyonel bir diyetisyensin. Kullanıcı şu besinleri girdi: "${mealText}". Bunun ortalama kalori ve makro değerlerini (protein, karbonhidrat, yağ) gram cinsinden tahmin et. SADECE JSON. Şema: { kcal: number, protein: number, carbs: number, fat: number }`
      : `You are a professional dietitian. The user entered: "${mealText}". Estimate average calories and macro values (protein, carbs, fat) in grams. JSON ONLY. Schema: { kcal: number, protein: number, carbs: number, fat: number }`;

  const data = await callGroq({
    kind: 'nutrition',
    systemPrompt,
    userPrompt,
    temperature: 0.3,
  });

  if (!data || typeof data !== 'object') {
    throw new Error('AI geçerli bir makro tahmini üretmedi.');
  }
  return {
    kcal: Number(data.kcal) || 0,
    protein: Number(data.protein) || 0,
    carbs: Number(data.carbs) || 0,
    fat: Number(data.fat) || 0,
  };
}

/**
 * Haftalik antrenman raporu yorumu uret.
 */
export async function generateWeeklyReport(ctx) {
  const { lang, stats } = ctx;

  const systemPrompt =
    'You are a professional strength coach. You must ONLY output a valid JSON object matching the requested schema. ' +
    'No other text, no markdown formatting like ```json.';

  const userPrompt =
    lang === 'tr'
      ? `Sen profesyonel bir antrenörsün. Kullanıcının son 7 günlük özeti: ${JSON.stringify(stats)}. ` +
        'Kısa, motive edici ve somut bir rapor yaz. SADECE JSON. Şema: ' +
        '{ summary: string (2-3 cümle, performans değerlendirmesi), suggestions: string[] (gelecek hafta için 2-3 somut öneri) }'
      : `You are a professional strength coach. User last 7 days summary: ${JSON.stringify(stats)}. ` +
        'Write a short, motivating and concrete report. JSON ONLY. Schema: ' +
        '{ summary: string (2-3 sentences, performance assessment), suggestions: string[] (2-3 concrete suggestions for next week) }';

  const data = await callGroq({
    kind: 'nutrition', // mevcut izinli kind; rapor da benzer tek-cikti JSON akisi
    systemPrompt,
    userPrompt,
    temperature: 0.6,
  });

  if (!data || typeof data.summary !== 'string') {
    throw new Error('AI geçerli bir rapor üretmedi.');
  }
  return {
    summary: data.summary,
    suggestions: Array.isArray(data.suggestions) ? data.suggestions.map(String).slice(0, 3) : [],
  };
}

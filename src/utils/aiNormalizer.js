// AI'in dondurdugu weight/reps stringlerini temizler.
// Ornekler: "50kg" -> "50", "Vücut Ağırlığı" -> "BW",
// "8-12" -> "8-12", "  15 kg " -> "15", "2 x 15" -> "15"

const BODYWEIGHT_TR = ['vücut ağırlığı', 'vucut agirligi', 'vücut agırlığı', 'beden ağırlığı', 'vücut ağırlığıyla', 'bodyweight', 'body weight', 'bw', 'kendi ağırlığın', 'kendi ağırlığı'];

// Sayi gorunumlu mu? ("50", "8-12", "12,5")

/**
 * Agirlik alanini normalize eder:
 * - "50kg" / "50 kg" / "50KG"  -> "50"
 * - "Vücut Ağırlığı"           -> "BW"
 * - "8-12 kg"                  -> "8-12"
 * - Gecersiz/bos               -> "" (UI bos gosterir, kullanici girer)
 */
export const normalizeAiWeight = (raw) => {
  if (raw === null || raw === undefined) return '';
  let s = String(raw).trim();
  if (!s) return '';

  const lower = s.toLowerCase();

  // Vucut agirligi ifadeleri -> BW
  if (BODYWEIGHT_TR.some(bw => lower === bw || lower.includes(bw))) {
    return 'BW';
  }

  // "2 x 15kg" gibi tekrar ifadeleri -> sadece kg degeri (x'ten SONRAKI sayi)
  const mult = s.match(/\d+(?:[.,]\d+)?\s*[x×]\s*(\d+(?:[.,]\d+)?)/i);
  if (mult) s = mult[1];

  // Sayilari yakala (aralik destekli): "8-12 kg", "50-60kg", "12,5kg"
  const range = s.match(/(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)/);
  if (range) return `${range[1].replace(',', '.')}-${range[2].replace(',', '.')}`;

  const single = s.match(/(\d+(?:[.,]\d+)?)/);
  if (single) return single[1].replace(',', '.');

  // Sayi yok, taninmayan metin -> bos (UI kullanici girer; BW varsayimi
  // makine/kablo egzersizlerinde yanlis gorunume yol aciyordu)
  return '';
};

/**
 * Reps alanini normalize eder:
 * - "8-12" -> "8-12", "12" -> "12", "8 ila 12" -> "8-12", "maksimum" -> "MAX"
 */
export const normalizeAiReps = (raw) => {
  if (raw === null || raw === undefined) return '';
  let s = String(raw).trim();
  if (!s) return '';

  const lower = s.toLowerCase();
  if (lower.includes('maks') || lower.includes('max') || lower.includes('amrap')) return 'MAX';

  const range = s.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) return `${range[1]}-${range[2]}`;

  const ila = s.match(/(\d+)\s*(?:ila|to|ve)\s*(\d+)/i);
  if (ila) return `${ila[1]}-${ila[2]}`;

  const single = s.match(/(\d+)/);
  if (single) return single[1];

  return '';
};

/**
 * Programin tum egzersizlerini normalize eder (in-place degil, kopya dondurur).
 * Kaydetme/onizleme oncesi cagrilir.
 */
export const normalizeAiProgram = (program) => {
  if (!program || !Array.isArray(program.days)) return program;
  const cleaned = JSON.parse(JSON.stringify(program));
  cleaned.days.forEach(d => {
    (d.exercises || []).forEach((ex, i) => {
      if (!ex) return;
      ex.weight = normalizeAiWeight(ex.weight);
      ex.reps = normalizeAiReps(ex.reps);
      // Superset bayragi: sadece dogru turden ve zincirin ilk elemani olmayan
      // satirlarda yasasin; baska turleri temizle
      if (ex.supersetWithPrev === true && i > 0) {
        ex.supersetWithPrev = true;
      } else {
        delete ex.supersetWithPrev;
      }
    });
  });
  return cleaned;
};

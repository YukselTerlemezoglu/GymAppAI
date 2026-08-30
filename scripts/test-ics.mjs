// icsExport.js birim testleri — buildIcs saf fonksiyon; Node'da test edilir.
import { buildIcs } from '../src/utils/icsExport.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } };

const base = { workoutDays: [1, 3], time: '18:30', weeks: 2, title: 'Antrenman', durationMin: 75 };
const ics = buildIcs(base);

// yapi
ok(ics.startsWith('BEGIN:VCALENDAR' + "\r\n"), 'VCALENDAR ile baslar + CRLF');
ok(ics.trimEnd().endsWith('END:VCALENDAR'), 'VCALENDAR ile biter');
ok(ics.includes('VERSION:2.0'), 'VERSİYON 2.0');
ok(ics.includes('PRODID:'), 'PRODID var');

// CRLF zorunlulugu: hicbir yalin LF olmamali
ok(!/(?<!\r)\n/.test(ics), 'yalın LF yok (tumu CRLF)');

// event sayisi: 2 gun x 2 hafta = 4
ok((ics.match(/BEGIN:VEVENT/g) || []).length === 4, '4 event (2 gun x 2 hafta)');
ok((ics.match(/END:VEVENT/g) || []).length === 4, '4 END:VEVENT');

// saat dogru girdi mi: 18:30 -> T183000
ok(ics.includes('T183000'), 'saat 18:30 floating');

// alarm
ok(ics.includes('TRIGGER:-PT15M'), '15 dk once alarm');

// UID benzersizligi
const uids = ics.match(/UID:[^\r\n]+/g) || [];
ok(new Set(uids).size === uids.length, 'UIDler benzersiz');

// ozel karakter kacisi
const ics2 = buildIcs({ ...base, title: 'A;B,C\\D' });
ok(ics2.includes('SUMMARY:A\\;B\\,C\\\\D'), 'ozel karakterler kacislı');

// bos gun listesi
const ics3 = buildIcs({ workoutDays: [], time: '09:00', weeks: 1, title: 'X' });
ok((ics3.match(/BEGIN:VEVENT/g) || []).length === 0, 'bos gunler -> 0 event');

// satir katlama: 100+ karakter SUMMARY kirilmali (73 oktet)
const ics4 = buildIcs({ ...base, title: 'COK'.repeat(50) });
const longLine = ics4.split("\r\n").find(l => l.startsWith('SUMMARY:'));
ok(longLine === undefined || longLine.length <= 75, 'uzun satirlar katlanir');

console.log(`SONUC: ${pass} basarili, ${fail} basarisiz`);
process.exit(fail > 0 ? 1 : 0);
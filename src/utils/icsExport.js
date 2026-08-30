// .ics (RFC 5545) takvim dosyasi uretici - antrenman gunlerini telefon
// takvimine aktarir. iPhone Takvim + Google Calendar (Android) uyumlu.
//
// Kritik uyumluluk notlari:
// - CRLF satir sonlari ZORUNLU (RFC 5545; iOS LF-only dosyayi reddedebilir)
// - DTSTART yerel saat + TZID olmadan "floating" olur; guvenli yol UTC'dir.
//   Antrenman saati kullanicin yerel saati ama cihaz takvimi UTC'yi yerele
//   cevirir. Burada basitlik icin floating local time (VALUE=DATE-TIME, Z yok)
//   kullaniyoruz - hem iOS hem Google Calendar bunu yerel saat olarak okur.

const CRLF = "\r\n";

const pad = (n) => String(n).padStart(2, "0");

// Yerel saat floating format: 20260830T180000
function localDateTime(d) {
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// Satir katlama: RFC 5545 max 75 oktet; uzun satirlar CRLF+bosluk ile kirilir
function foldLine(line) {
    if (line.length <= 73) return line;
    const parts = [];
    let rest = line;
    parts.push(rest.slice(0, 73));
    rest = rest.slice(73);
    while (rest.length > 72) {
        parts.push(rest.slice(0, 72));
        rest = rest.slice(72);
    }
    if (rest) parts.push(rest);
    return parts.join(CRLF + " ");
}

function esc(s) {
    return String(s)
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\r\n|\r|\n/g, "\\n");
}

/**
 * Antrenman gunlerinden .ics icerigi uretir.
 * @param {{workoutDays:number[], time:string, weeks:number, title:string, durationMin:number}} opts
 * @param {string} opts.time - "18:30" formatinda yerel saat
 * @param {number[]} opts.workoutDays - 0=Pazar ... 6=Cumartesi (JS getDay uyumlu)
 */
export function buildIcs({ workoutDays, time, weeks = 8, title, durationMin = 75 }) {
    const [hh, mm] = String(time || "18:00").split(":").map(Number);
    const now = new Date();
    const stamp = localDateTime(now);

    // Ilk antrenman: bugunden itibaren ilk secili gun
    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//GymAppAI//Workout Planner//TR",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:" + esc(title || "Antrenman"),
    ];

    const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    let uidCounter = 0;

    for (let w = 0; w < weeks; w++) {
        workoutDays.forEach((d) => {
            // Bu haftanin secili gunu
            const date = new Date(now);
            const diff = (d - now.getDay() + 7) % 7;
            date.setDate(date.getDate() + diff + w * 7);
            // 00:30 gibi "gece yarisi" saatleri Number(0) verir; 0 || 18
            // tuzağına düşmemek için NaN kontrolü kullanılır.
            date.setHours(Number.isFinite(hh) ? hh : 18, Number.isFinite(mm) ? mm : 0, 0, 0);

            const start = localDateTime(date);
            const end = new Date(date.getTime() + durationMin * 60000);

            lines.push(
                "BEGIN:VEVENT",
                `UID:gymapp-${start}-${uidCounter++}@gymappai`,
                `DTSTAMP:${stamp}`,
                `DTSTART;VALUE=DATE-TIME:${start}`,
                `DTEND;VALUE=DATE-TIME:${localDateTime(end)}`,
                "SUMMARY:" + esc(`${title || "Antrenman"} (${dayNames[d]})`),
                "DESCRIPTION:" + esc("GymAppAI - antrenman gunu. Hazir misin?"),
                "BEGIN:VALARM",
                "TRIGGER:-PT15M",
                "ACTION:DISPLAY",
                "DESCRIPTION:" + esc("Antrenman saati yaklasiyor"),
                "END:VALARM",
                "END:VEVENT"
            );
        });
    }

    lines.push("END:VCALENDAR");
    return lines.map(foldLine).join(CRLF) + CRLF;
}

/**
 * .ics dosyasini indirir. iOS'ta Web Share ile dosya uygulamalarina
 * ("Takvim'e Ekle" akisi) yonlendirilir; Android/Chrome'ta download + intent.
 */
export async function downloadIcs(opts) {
    const ics = buildIcs(opts);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const fileName = "gymapp-antrenman.ics";

    if (navigator.canShare?.({ files: [new File([blob], fileName, { type: "text/calendar" })] })) {
        try {
            const file = new File([blob], fileName, { type: "text/calendar" });
            await navigator.share({ files: [file], title: fileName });
            return "shared";
        } catch (err) {
            if (err?.name === "AbortError") return "cancelled";
        }
    }

    try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        return "downloaded";
    } catch {
        return "failed";
    }
}
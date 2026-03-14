const exerciseLibrary = {
    // Push / Chest
    "Bench Press": {
        name: "Bench Press",
        muscle: "Göğüs, Ön Omuz, Triceps",
        tips: [
            "Sırtını sehpaya tam daya, belinde hafif bir kavis (arch) oluştur.",
            "Barı göz hizanda hizala ve omuz genişliğinden biraz daha açık tut.",
            "Barı indirirken dirseklerini gövdenle 45 derece açı yapacak şekilde tut.",
            "Göğsüne değdirip patlayıcı bir şekilde yukarı it."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Bench+Press"
    },
    "Incline Dumbbell Press": {
        name: "Incline Dumbbell Press",
        muscle: "Üst Göğüs, Ön Omuz",
        tips: [
            "Sehpayı 30-45 derece açıya ayarla.",
            "Dumbbell'ları göğüs hizasından omuz genişliğinde yukarı it.",
            "Tepe noktasında dambılları birbirine çaptırmadan sıkarak bekle."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Incline+Dumbbell+Press"
    },
    "Push Up": {
        name: "Push Up (Şınav)",
        muscle: "Göğüs, Ön Omuz, Triceps, Core",
        tips: [
            "Vücudun başından topuklarına kadar düz bir çizgi olmalı.",
            "Core (karın) bölgeni sıkı tutarak belinin çökmesine izin verme."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Push+Up"
    },

    // Pull / Back
    "Deadlift": {
        name: "Deadlift",
        muscle: "Sırt, Bel, Hamstring, Glutes",
        tips: [
            "Bar ayak parmaklarının hemen üzerinde olmalı.",
            "Sırtını düz tut, belini bükme! Kalçanı geriye atarak eğil.",
            "Kalkarken bacaklarından güç alarak kalçanı ve gövdeni aynı anda kaldır."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Deadlift"
    },
    "Pull Up": {
        name: "Pull Up (Barfiks)",
        muscle: "Kanat (Latissimus Dorsi), Biceps",
        tips: [
            "Tutuşun omuz genişliğinden biraz geniş olmalı.",
            "Kendini yukarı çekerken göğsünü bara yaklaştırmaya çalış.",
            "Aşağı inerken kontrollü ve yavaş in."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Pull+Up"
    },
    "Barbell Row": {
        name: "Barbell Row",
        muscle: "Sırt, Kanat, Arka Omuz",
        tips: [
            "Belin yere yaklaşık 45 derece açıda eğik olmalı.",
            "Barı karnının alt kısmına doğru, dirseklerini geride sıkıştırarak çek."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Barbell+Row"
    },

    // Legs
    "Squat": {
        name: "Squat",
        muscle: "Quadriceps, Glutes, Hamstring",
        tips: [
            "Ayakların omuz genişliğinde veya biraz daha açık olsun.",
            "Göğsünü dik tut, sanki arkandaki bir sandalyeye oturuyormuş gibi kalçanı geriye ver.",
            "Dizlerinin ayak parmak ucunu çok geçmemesine özen göster."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Squat"
    },
    "Leg Press": {
        name: "Leg Press",
        muscle: "Quadriceps, Hamstring",
        tips: [
            "Ağırlığı yukarı ittiğinde dizlerini tamamen kilitleme (hafif bükülü kalsın).",
            "Aşağı indirirken dizlerinin göğsüne doğru olabildiğince yaklaşmasına izin ver."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Leg+Press"
    },
    "Romanian Deadlift": {
        name: "Romanian Deadlift (RDL)",
        muscle: "Hamstring, Glutes",
        tips: [
            "Dizlerin sadece çok hafif bükülü olmalı, hareketi kalçanı geriye iterek yap.",
            "Arka bacaklarında gerilmeyi hissedene kadar barı diz kapağının altına indir."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Romanian+Deadlift"
    },

    // Shoulders & Arms
    "Overhead Press": {
        name: "Overhead Press / Omuz Pres",
        muscle: "Ön ve Orta Omuz, Triceps",
        tips: [
            "Ayakta veya oturarak yapılabilir. Ayaktayken Core bölgeni sıkı tut.",
            "Barı köprücük kemiğinden başlatıp başının üzerine presle."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Overhead+Press"
    },
    "Lateral Raise": {
        name: "Lateral Raise",
        muscle: "Orta Omuz",
        tips: [
            "Dumbbelleri yanlara kaldırırken dirseklerin hafif bükülü olsun.",
            "Ağırlığı omuz hızasına kadar kaldır, serçe parmağın hafifçe yukarı baksın."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Lateral+Raise"
    },
    "Bicep Curl": {
        name: "Bicep Curl",
        muscle: "Biceps (Pazu)",
        tips: [
            "Dirseklerini gövdene sabitle, sadece ön kolun hareket etsin.",
            "Belinden veya vücudundan ivme alma."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Bicep+Curl"
    },
    "Tricep Extension": {
        name: "Tricep Extension / Pushdown",
        muscle: "Triceps (Arka Kol)",
        tips: [
            "Kablo istasyonunda dirseklerini vücuduna sabitle.",
            "Aşağı doğru basarken arka kol kasını sıkarak hareketi tamamla."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Tricep+Extension"
    },

    // Core / Abs
    "Crunch": {
        name: "Crunch (Mekik)",
        muscle: "Karın Kasları (Abs)",
        tips: [
            "Belini yere tam yasla, boynunu zorlamadan sadece omuzlarını yerden kaldır.",
            "Tepe noktasında karın kaslarını sıkarak nefes ver."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Crunch"
    },
    "Plank": {
        name: "Plank",
        muscle: "Tüm Core Bölgesi",
        tips: [
            "Vücudunu düz bir çizgi halinde tut, kalçanı ne çok kaldır ne de düşür.",
            "Dirseklerin tam omuzlarının altında olmalı."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Plank"
    },

    // Additional Exercises
    "Lat Pulldown": {
        name: "Lat Pulldown",
        muscle: "Kanat (Latissimus Dorsi), Biceps",
        tips: [
            "Barı göğsünün üst kısmına doğru çekerken gövdeni hafif geriye yasla.",
            "Çekerken kürek kemiklerini birbirine yaklaştırdığını hisset."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Lat+Pulldown"
    },
    "Seated Cable Row": {
        name: "Seated Cable Row",
        muscle: "Orta ve Alt Sırt, Kanat",
        tips: [
            "Sırtını hep dik tut, öne uzanırken belini bükmemeye çalış.",
            "Ağırlığı karnına doğru çekerken göğsünü dışarı çıkar."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Seated+Cable+Row"
    },
    "Lunge": {
        name: "Lunge",
        muscle: "Quadriceps, Glutes, Hamstring",
        tips: [
            "Adım attığın bacağınla dizin dik açı (~90 derece) oluşturacak şekilde öne adım at.",
            "Arkadaki dizini hafifçe yere değdirip geri kalk."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Lunge"
    },
    "Dumbbell Fly": {
        name: "Dumbbell Fly",
        muscle: "Göğüs",
        tips: [
            "Dirseklerini hafif bükülü tut (sanki büyük bir ağaca sarılıyormuşsun gibi).",
            "Ağırlıkları omuz hizasında indirip göğsünü gererek sıkıca yukarıda birleştir."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Dumbbell+Fly"
    },
    "Face Pull": {
        name: "Face Pull",
        muscle: "Arka Omuz, Trapez",
        tips: [
            "Halatı yüzüne (göz hizana) doğru çekerken dirseklerini dışa ve geriye aç.",
            "Hareket noktasında kürek kemiklerini iyice sıkıştır."
        ],
        placeholderGif: "https://placehold.co/600x400/1a1a2e/00c3ff?text=Face+Pull"
    }
};

/**
 * Verilen egzersiz ismi için kütüphanede eşleşme arar.
 * Eğer tam eşleşme yoksa, isim içindeki kelimeleri kontrol edip en yakın olanı döndürür.
 * (Örn: "Dumbbell Incline Press" için "Incline Dumbbell Press" i bulur)
 */
export const findExerciseData = (queryName) => {
    if (!queryName) return null;
    const lowerQuery = queryName.toLowerCase();

    // 1. Exact Match (Case Insensitive)
    const exactMatchKey = Object.keys(exerciseLibrary).find(key => key.toLowerCase() === lowerQuery);
    if (exactMatchKey) return exerciseLibrary[exactMatchKey];

    // 2. Partial Match
    const partialMatchKey = Object.keys(exerciseLibrary).find(key => {
        const lowerKey = key.toLowerCase();
        // Check if query contains key or key contains query words
        return lowerQuery.includes(lowerKey) || lowerKey.includes(lowerQuery.split(' ')[0]);
    });

    if (partialMatchKey) return exerciseLibrary[partialMatchKey];

    return null;
}

export default exerciseLibrary;

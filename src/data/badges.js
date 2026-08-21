export const BADGE_LIBRARY = [
    {
        id: "first_step",
        title: "İlk Adım",
        title_en: "First Step",
        description: "İlk idmanınızı başarıyla tamamladınız. Büyük yolculuklar küçük adımlarla başlar!",
        description_en: "You've successfully completed your first workout. Great journeys start with small steps!",
        icon: "🥉",
        condition: (stats) => stats.totalWorkouts >= 1,
        progress: (stats) => `${Math.min(stats.totalWorkouts, 1)}/1`
    },
    {
        id: "iron_will",
        title: "Demir İrade",
        title_en: "Iron Will",
        description: "2 hafta üst üste haftalık hedefinize ulaştınız. Disiplin en büyük gücünüz!",
        description_en: "You've hit your weekly goal 2 weeks in a row. Discipline is your greatest strength!",
        icon: "🔥",
        condition: (stats) => stats.streak >= 2,
        progress: (stats) => `${Math.min(stats.streak, 2)}/2`
    },
    {
        id: "gym_boss",
        title: "Salonun Sefiri",
        title_en: "Gym Boss",
        description: "Toplam 10 idman tamamladınız. Artık başlangıç seviyesini geride bıraktınız.",
        description_en: "You've completed 10 workouts. You've now moved past the beginner level.",
        icon: "🏋️‍♂️",
        condition: (stats) => stats.totalWorkouts >= 10,
        progress: (stats) => `${Math.min(stats.totalWorkouts, 10)}/10`
    },
    {
        id: "ai_disciple",
        title: "Robotik Disiplin",
        title_en: "Robotic Discipline",
        description: "Yapay zeka koçunuzun yazdığı idmanı başarıyla bitirdiniz. Teknoloji ve kas gücü sentezi devrede!",
        description_en: "You've successfully finished a workout written by your AI coach. Synthesis of technology and muscle power is in effect!",
        icon: "🤖",
        condition: (stats) => stats.aiWorkoutsCompleted >= 1,
        progress: (stats) => `${Math.min(stats.aiWorkoutsCompleted, 1)}/1`
    },
    {
        id: "streak_5",
        title: "Alev Alev",
        title_en: "On Fire",
        description: "5 hafta üst üste haftalık hedef! Sizi durdurmak imkansız.",
        description_en: "5 weeks in a row hitting your weekly goal! You are unstoppable.",
        icon: "☄️",
        condition: (stats) => stats.streak >= 5,
        progress: (stats) => `${Math.min(stats.streak, 5)}/5`
    },
    {
        id: "streak_30",
        title: "Bağımlılık",
        title_en: "Addiction",
        description: "İnanılmaz! 26 hafta (yarım yıl) üst üste haftalık hedefinizi tutturdunuz.",
        description_en: "Incredible! 26 consecutive weeks (half a year) of hitting your weekly goal.",
        icon: "🌋",
        condition: (stats) => stats.streak >= 26,
        progress: (stats) => `${Math.min(stats.streak, 26)}/26`
    },
    {
        id: "workout_20",
        title: "Salonun Müdavimi",
        title_en: "Gym Regular",
        description: "Toplam 20 idmanı tamamladınız. Artık spor salonu ikinci eviniz.",
        description_en: "You've completed 20 workouts. The gym is now your second home.",
        icon: "🏛️",
        condition: (stats) => stats.totalWorkouts >= 20,
        progress: (stats) => `${Math.min(stats.totalWorkouts, 20)}/20`
    },
    {
        id: "workout_50",
        title: "Demir Yürek",
        title_en: "Iron Heart",
        description: "Toplam 50 idman! Bu azimle yapılamayacak hiçbir şey yok.",
        description_en: "50 total workouts! Nothing is impossible with this determination.",
        icon: "🛡️",
        condition: (stats) => stats.totalWorkouts >= 50,
        progress: (stats) => `${Math.min(stats.totalWorkouts, 50)}/50`
    },
    {
        id: "workout_100",
        title: "Efsane",
        title_en: "Legend",
        description: "100 idman barajını aştınız. Sen bir efsanesin!",
        description_en: "You've passed the 100-workout mark. You are a legend!",
        icon: "🌟",
        condition: (stats) => stats.totalWorkouts >= 100,
        progress: (stats) => `${Math.min(stats.totalWorkouts, 100)}/100`
    },
    {
        id: "ai_cyborg",
        title: "Sayborg",
        title_en: "Cyborg",
        description: "Yapay zeka ile tam 5 idman bitirdiniz. Siz ve algoritmalar harika bir takımsınız!",
        description_en: "You've finished 5 workouts with AI. You and the algorithms are a great team!",
        icon: "🦾",
        condition: (stats) => stats.aiWorkoutsCompleted >= 5,
        progress: (stats) => `${Math.min(stats.aiWorkoutsCompleted, 5)}/5`
    },
    // ================== YENI ROZETLER (v2) ==================
    {
        id: "streak_7",
        title: "Aylık Ateş",
        title_en: "Monthly Blaze",
        description: "4 hafta (1 ay) üst üste haftalık hedef! Mükemmel bir ay geçirdiniz.",
        description_en: "4 weeks (1 month) in a row hitting your weekly goal! A perfect month.",
        icon: "🔥",
        condition: (stats) => stats.streak >= 4,
        progress: (stats) => `${Math.min(stats.streak, 4)}/4`
    },
    {
        id: "streak_100",
        title: "Yıl Demiri",
        title_en: "Year of Iron",
        description: "52 hafta üst üste haftalık hedef. Tam bir yıl boyunca sadık kaldınız!",
        description_en: "52 consecutive weeks of hitting your weekly goal. A full year of dedication!",
        icon: "⛓️",
        condition: (stats) => stats.streak >= 52,
        progress: (stats) => `${Math.min(stats.streak, 52)}/52`
    },
    {
        id: "volume_10t",
        title: "10 Ton Kulübü",
        title_en: "10-Ton Club",
        description: "Toplam 10.000 kg ağırlık kaldırdınız. Hacim kralı olma yolundasınız!",
        description_en: "You've lifted a total of 10,000 kg. On your way to being the volume king!",
        icon: "🏗️",
        condition: (stats) => (stats.totalVolume || 0) >= 10000,
        progress: (stats) => `${Math.min(Math.round((stats.totalVolume || 0) / 100) / 10, 10)}/10 t`
    },
    {
        id: "volume_50t",
        title: "50 Ton Devi",
        title_en: "50-Ton Giant",
        description: "Toplam 50.000 kg! Kaldırdığınız ağırlık bir kamyonet doldurur.",
        description_en: "50,000 kg total! That's a pickup truck worth of weight.",
        icon: "🚛",
        condition: (stats) => (stats.totalVolume || 0) >= 50000,
        progress: (stats) => `${Math.min(Math.round((stats.totalVolume || 0) / 100) / 10, 50)}/50 t`
    },
    {
        id: "volume_100t",
        title: "Yüz Ton Kolosu",
        title_en: "100-Ton Colossus",
        description: "100.000 kg toplam hacim! Artık salonun canlı efsanesisiniz.",
        description_en: "100,000 kg total volume! You're now the gym's living legend.",
        icon: "🗿",
        condition: (stats) => (stats.totalVolume || 0) >= 100000,
        progress: (stats) => `${Math.min(Math.round((stats.totalVolume || 0) / 100) / 10, 100)}/100 t`
    },
    {
        id: "sets_1000",
        title: "Bin Set Sarpası",
        title_en: "1000-Set Summit",
        description: "Toplam 1.000 set tamamladınız. Her set sizi zirveye taşır.",
        description_en: "You've completed 1,000 total sets. Every set carries you to the top.",
        icon: "⛰️",
        condition: (stats) => (stats.totalSets || 0) >= 1000,
        progress: (stats) => `${Math.min(stats.totalSets || 0, 1000)}/1000`
    },
    {
        id: "reps_10000",
        title: "On Bin Tekrar",
        title_en: "Ten Thousand Reps",
        description: "10.000 tekrar! Her tekrar bir tuğla, duvarınız sağlam.",
        description_en: "10,000 reps! Every rep is a brick, your wall is solid.",
        icon: "🧱",
        condition: (stats) => (stats.totalReps || 0) >= 10000,
        progress: (stats) => `${Math.min(stats.totalReps || 0, 10000)}/10000`
    },
    {
        id: "variety_20",
        title: "Kas Kâşifi",
        title_en: "Muscle Explorer",
        description: "20 farklı egzersiz denediniz. Vücudunuzun her köşesini keşfediyorsunuz!",
        description_en: "You've tried 20 different exercises. You're exploring every corner of your body!",
        icon: "🧭",
        condition: (stats) => (stats.uniqueExercises || 0) >= 20,
        progress: (stats) => `${Math.min(stats.uniqueExercises || 0, 20)}/20`
    },
    {
        id: "pr_10",
        title: "Rekor Avcısı",
        title_en: "Record Hunter",
        description: "10 farklı egzersizde kişisel rekorunuzu elinizde tutuyorsunuz. Avlanmaya devam!",
        description_en: "You hold personal records in 10 different exercises. Keep hunting!",
        icon: "🎯",
        condition: (stats) => (stats.prCount || 0) >= 10,
        progress: (stats) => `${Math.min(stats.prCount || 0, 10)}/10`
    },
    {
        id: "squat_100",
        title: "Yüz Kilo Squat",
        title_en: "100 kg Squat",
        description: "Squat'ta 100 kg'ı geçtiniz! Bacak gücünüz konuşuyor.",
        description_en: "You've passed 100 kg in the squat! Your leg power speaks for itself.",
        icon: "🦵",
        condition: (stats) => {
            if (!stats.history) return false;
            return stats.history.some(w =>
                w.exercise && w.exercise.toLowerCase().includes('squat') && parseFloat(w.maxWeight) >= 100
            );
        },
        progress: () => ""
    },
    {
        id: "water_30",
        title: "Su Ustası",
        title_en: "Hydration Master",
        description: "30 farklı gün su hedefinizi tamamladınız. Kaslarınız size teşekkür ediyor!",
        description_en: "You hit your water goal on 30 different days. Your muscles thank you!",
        icon: "💧",
        condition: (stats) => (stats.waterGoalDays || 0) >= 30,
        progress: (stats) => `${Math.min(stats.waterGoalDays || 0, 30)}/30`
    },
    {
        id: "social_first",
        title: "Ekip Ruhu",
        title_en: "Team Spirit",
        description: "İlk arkadaşınızı eklediniz! Birlikte antrenman daha güçlü.",
        description_en: "You added your first friend! Training together is stronger.",
        icon: "🤝",
        condition: (stats) => (stats.friendCount || 0) >= 1,
        progress: (stats) => `${Math.min(stats.friendCount || 0, 1)}/1`
    },
    // GİZLİ BAŞARIMLAR (SECRET BADGES)
    {
        id: "night_owl",
        title: "Gece Kuşu",
        title_en: "Night Owl",
        description: "Gecenin karanlığında (00:00 - 04:00 arası) bile bahane üretmeyip idman yaptınız.",
        description_en: "You didn't make excuses and worked out even in the dark of night (00:00 - 04:00).",
        icon: "🦉",
        isSecret: true,
        condition: (stats) => {
            if (!stats.history) return false;
            return stats.history.some(w => {
                const hour = new Date(w.date).getHours();
                return hour >= 0 && hour < 4;
            });
        },
        progress: () => ""
    },
    {
        id: "early_bird",
        title: "Erkenci Kuş",
        title_en: "Early Bird",
        description: "Güneş doğarken (05:00 - 08:00 arası) kalkıp güne sporla başladınız.",
        description_en: "You woke up at sunrise (05:00 - 08:00) and started your day with sports.",
        icon: "🌅",
        isSecret: true,
        condition: (stats) => {
            if (!stats.history) return false;
            return stats.history.some(w => {
                const hour = new Date(w.date).getHours();
                return hour >= 5 && hour <= 8;
            });
        },
        progress: () => ""
    },
    {
        id: "weekend_warrior",
        title: "Hafta Sonu Savaşçısı",
        title_en: "Weekend Warrior",
        description: "Herkes dinlenirken siz Cumartesi veya Pazar günü idman yaptınız.",
        description_en: "While everyone rests, you worked out on a Saturday or Sunday.",
        icon: "🛡️",
        isSecret: true,
        condition: (stats) => {
            if (!stats.history) return false;
            return stats.history.some(w => {
                const day = new Date(w.date).getDay();
                return day === 0 || day === 6;
            });
        },
        progress: () => ""
    },
    {
        id: "century_club",
        title: "Yüzler Kulübü",
        title_en: "Century Club",
        description: "Herhangi bir egzersizde tek seferde 100 kg veya üzeri ağırlık kaldırma gücüne ulaştınız!",
        description_en: "You've reached the power to lift 100 kg or more in any exercise!",
        icon: "🦍",
        isSecret: true,
        condition: (stats) => {
            if (!stats.history) return false;
            return stats.history.some(w => w.maxWeight && parseFloat(w.maxWeight) >= 100);
        },
        progress: () => ""
    },
    {
        id: "bench_press_100",
        title: "Göğüs Şövalyesi",
        title_en: "Chest Knight",
        description: "Bench Press egzersizinde 100 kg ve üzeri bariyerini aştınız!",
        description_en: "You've crossed the 100 kg barrier in the Bench Press exercise!",
        icon: "🛡️",
        isSecret: false,
        condition: (stats) => {
            if (!stats.history) return false;
            return stats.history.some(w =>
                w.exercise && w.exercise.toLowerCase().includes('bench press') && w.maxWeight >= 100
            );
        },
        progress: () => ""
    },
    {
        id: "deadlift_150",
        title: "Yerçekimi Bükücü",
        title_en: "Gravity Bender",
        description: "Deadlift egzersizinde 150 kg ve üzeri kaldırarak tabuları yıktınız!",
        description_en: "You've broken taboos by lifting 150 kg or more in the Deadlift exercise!",
        icon: "🪐",
        isSecret: false,
        condition: (stats) => {
            if (!stats.history) return false;
            return stats.history.some(w =>
                w.exercise && w.exercise.toLowerCase().includes('deadlift') && w.maxWeight >= 150
            );
        },
        progress: () => ""
    },
    {
        id: "veteran_athlete",
        title: "Kıdemli Kaslı",
        title_en: "Veteran Athlete",
        description: "Toplam XP birikimi ile 10. Seviyeye ulaşarak antrenmanda ustalaştınız. İstikrarın sembolü!",
        description_en: "By reaching Level 10 with total XP accumulation, you've mastered training. A symbol of stability!",
        icon: "👑",
        isSecret: false,
        condition: (stats) => {
            return (stats.level || 1) >= 10;
        },
        progress: (stats) => `${Math.min(stats.level || 1, 10)}/10`
    },
    {
        id: "level_25",
        title: "Yaşayan Efsane",
        title_en: "Living Legend",
        description: "25. Seviyeye ulaştınız! Seviye eğrisi dikleşiyor ama siz daha diksiniz.",
        description_en: "You've reached Level 25! The curve gets steeper, but you're steeper.",
        icon: "🏔️",
        isSecret: false,
        condition: (stats) => (stats.level || 1) >= 25,
        progress: (stats) => `${Math.min(stats.level || 1, 25)}/25`
    },
    {
        id: "level_50",
        title: "Ölümsüz Atlet",
        title_en: "Immortal Athlete",
        description: "50. Seviye! Bu sabrı gösteren az kişi vardır. Fiziksel ve zihinsel ustalık.",
        description_en: "Level 50! Few show this patience. Physical and mental mastery.",
        icon: "⚡",
        isSecret: false,
        condition: (stats) => (stats.level || 1) >= 50,
        progress: (stats) => `${Math.min(stats.level || 1, 50)}/50`
    }
];

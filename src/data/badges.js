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
        description: "3 günlük kesintisiz idman serisi (Streak) yakaladınız. Disiplin en büyük gücünüz!",
        description_en: "You've achieved a 3-day workout streak. Discipline is your greatest strength!",
        icon: "🔥",
        condition: (stats) => stats.streak >= 3,
        progress: (stats) => `${Math.min(stats.streak, 3)}/3`
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
        description: "5 günlük kesintisiz idman serisi! Sizi durdurmak imkansız.",
        description_en: "5-day consecutive workout streak! You are unstoppable.",
        icon: "☄️",
        condition: (stats) => stats.streak >= 5,
        progress: (stats) => `${Math.min(stats.streak, 5)}/5`
    },
    {
        id: "streak_30",
        title: "Bağımlılık",
        title_en: "Addiction",
        description: "İnanılmaz! 30 gün boyunca aralıksız spor yaptınız.",
        description_en: "Incredible! You worked out for 30 consecutive days.",
        icon: "🌋",
        condition: (stats) => stats.streak >= 30,
        progress: (stats) => `${Math.min(stats.streak, 30)}/30`
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
    }
];

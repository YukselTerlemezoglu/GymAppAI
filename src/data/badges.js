export const BADGE_LIBRARY = [
    {
        id: "first_step",
        title: "İlk Adım",
        description: "İlk idmanınızı başarıyla tamamladınız. Büyük yolculuklar küçük adımlarla başlar!",
        icon: "🥉",
        condition: (stats) => stats.totalWorkouts >= 1,
        progress: (stats) => `${Math.min(stats.totalWorkouts, 1)}/1`
    },
    {
        id: "iron_will",
        title: "Demir İrade",
        description: "3 günlük kesintisiz idman serisi (Streak) yakaladınız. Disiplin en büyük gücünüz!",
        icon: "🔥",
        condition: (stats) => stats.streak >= 3,
        progress: (stats) => `${Math.min(stats.streak, 3)}/3`
    },
    {
        id: "gym_boss",
        title: "Salonun Sefiri",
        description: "Toplam 10 idman tamamladınız. Artık başlangıç seviyesini geride bıraktınız.",
        icon: "🏋️‍♂️",
        condition: (stats) => stats.totalWorkouts >= 10,
        progress: (stats) => `${Math.min(stats.totalWorkouts, 10)}/10`
    },
    {
        id: "ai_disciple",
        title: "Robotik Disiplin",
        description: "Yapay zeka koçunuzun yazdığı idmanı başarıyla bitirdiniz. Teknoloji ve kas gücü sentezi devrede!",
        icon: "🤖",
        condition: (stats) => stats.aiWorkoutsCompleted >= 1,
        progress: (stats) => `${Math.min(stats.aiWorkoutsCompleted, 1)}/1`
    },
    {
        id: "streak_5",
        title: "Alev Alev",
        description: "5 günlük kesintisiz idman serisi! Sizi durdurmak imkansız.",
        icon: "☄️",
        condition: (stats) => stats.streak >= 5,
        progress: (stats) => `${Math.min(stats.streak, 5)}/5`
    },
    {
        id: "streak_30",
        title: "Bağımlılık",
        description: "İnanılmaz! 30 gün boyunca aralıksız spor yaptınız.",
        icon: "🌋",
        condition: (stats) => stats.streak >= 30,
        progress: (stats) => `${Math.min(stats.streak, 30)}/30`
    },
    {
        id: "workout_20",
        title: "Salonun Müdavimi",
        description: "Toplam 20 idmanı tamamladınız. Artık spor salonu ikinci eviniz.",
        icon: "🏛️",
        condition: (stats) => stats.totalWorkouts >= 20,
        progress: (stats) => `${Math.min(stats.totalWorkouts, 20)}/20`
    },
    {
        id: "workout_50",
        title: "Demir Yürek",
        description: "Toplam 50 idman! Bu azimle yapılamayacak hiçbir şey yok.",
        icon: "🛡️",
        condition: (stats) => stats.totalWorkouts >= 50,
        progress: (stats) => `${Math.min(stats.totalWorkouts, 50)}/50`
    },
    {
        id: "workout_100",
        title: "Efsane",
        description: "100 idman barajını aştınız. Sen bir efsanesin!",
        icon: "🌟",
        condition: (stats) => stats.totalWorkouts >= 100,
        progress: (stats) => `${Math.min(stats.totalWorkouts, 100)}/100`
    },
    {
        id: "ai_cyborg",
        title: "Sayborg",
        description: "Yapay zeka ile tam 5 idman bitirdiniz. Siz ve algoritmalar harika bir takımsınız!",
        icon: "🦾",
        condition: (stats) => stats.aiWorkoutsCompleted >= 5,
        progress: (stats) => `${Math.min(stats.aiWorkoutsCompleted, 5)}/5`
    },
    // GİZLİ BAŞARIMLAR (SECRET BADGES)
    {
        id: "night_owl",
        title: "Gece Kuşu",
        description: "Gecenin karanlığında (00:00 - 04:00 arası) bile bahane üretmeyip idman yaptınız.",
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
        description: "Güneş doğarken (05:00 - 08:00 arası) kalkıp güne sporla başladınız.",
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
        description: "Herhangi bir egzersizde tek seferde 100 kg veya üzeri ağırlık kaldırma gücüne ulaştınız!",
        icon: "🦍",
        isSecret: true,
        condition: (stats) => {
            if (!stats.history) return false;
            return stats.history.some(w => w.maxWeight && parseFloat(w.maxWeight) >= 100);
        },
        progress: () => ""
    }
];

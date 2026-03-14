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
        id: "ai_cyborg",
        title: "Sayborg",
        description: "Yapay zeka ile tam 5 idman bitirdiniz. Siz ve algoritmalar harika bir takımsınız!",
        icon: "🦾",
        condition: (stats) => stats.aiWorkoutsCompleted >= 5,
        progress: (stats) => `${Math.min(stats.aiWorkoutsCompleted, 5)}/5`
    }
];

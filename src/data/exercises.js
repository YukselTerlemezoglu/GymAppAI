export const MUSCLE_GROUPS = [
  { id: 'chest', name: 'Göğüs', name_en: 'Chest', icon: '🎯' },
  { id: 'back', name: 'Sırt', name_en: 'Back', icon: '🦇' },
  { id: 'shoulders', name: 'Omuz', name_en: 'Shoulders', icon: '⛰️' },
  { id: 'legs', name: 'Bacak', name_en: 'Legs', icon: '🦵' },
  { id: 'arms', name: 'Kollar', name_en: 'Arms', icon: '💪' },
  { id: 'core', name: 'Merkez (Core)', name_en: 'Core', icon: '🛡️' }
];

export const EXERCISES_DB = [
  // GÖĞÜS
  {
    id: 'bench-press',
    name: 'Barbell Bench Press',
    name_en: 'Barbell Bench Press',
    muscleGroupId: 'chest',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Barbell, Sehpa',
    equipment_en: 'Barbell, Bench',
    tips: [
      'Bacaklarınızı yere sağlam basın.',
      'Sırtınızda hafif bir kavis (arch) oluşturun.',
      'Barı göğsünüzün alt hizasına yavaşça indirin ve patlayıcı bir şekilde itin.'
    ],
    tips_en: [
      'Keep your feet planted firmly on the floor.',
      'Create a slight arch in your lower back.',
      'Lower the bar slowly to your lower chest and push up explosively.'
    ]
  },
  {
    id: 'incline-db-press',
    name: 'Incline Dumbbell Press',
    name_en: 'Incline Dumbbell Press',
    muscleGroupId: 'chest',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Dumbbell, Eğimli Sehpa',
    equipment_en: 'Dumbbell, Incline Bench',
    tips: [
      'Sehpayı 30-45 derece arasına ayarlayın.',
      'Ağırlıkları omuz hizasından yukarı doğru presleyin.',
      'Tepe noktasında dambılları birbirine çok çarptırmadan göğüs kasınızı sıkın.'
    ],
    tips_en: [
      'Adjust the bench between 30-45 degrees.',
      'Press the weights up from shoulder height.',
      'Squeeze your chest muscles at the peak without clashing the dumbbells together.'
    ]
  },
  {
    id: 'cable-crossover',
    name: 'Cable Crossover',
    name_en: 'Cable Crossover',
    muscleGroupId: 'chest',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Cable Machine',
    equipment_en: 'Cable Machine',
    tips: [
      'Kabloları göğüs hizasında birleştirin.',
      'Hareketi yaparken kollarınızı çok hafif kırık tutun, kilitlemeyin.',
      'Negatif aşamada (kabloları geri bırakırken) hareketi yavaş yapın.'
    ],
    tips_en: [
      'Bring the cables together at chest height.',
      'Keep your arms slightly bent while doing the movement, do not lock them.',
      'Perform the movement slowly during the negative phase (when releasing the cables).'
    ]
  },
  
  // SIRT
  {
    id: 'pull-up',
    name: 'Pull Up (Barfiks)',
    name_en: 'Pull Up',
    muscleGroupId: 'back',
    difficulty: 'Zor',
    difficulty_en: 'Advanced',
    equipment: 'Barfiks Demiri',
    equipment_en: 'Pull-up Bar',
    tips: [
      'Ellerinizi omuz genişliğinden biraz daha açık tutun.',
      'Kendinizi çekerken göğsünüzü bara değdirmeye çalışın.',
      'Sallanmadan, kontrollü bir şekilde inip kalkın.'
    ],
    tips_en: [
      'Keep your hands slightly wider than shoulder width.',
      'Try to touch your chest to the bar when pulling yourself up.',
      'Move in a controlled manner without swinging.'
    ]
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    name_en: 'Barbell Row',
    muscleGroupId: 'back',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Barbell',
    equipment_en: 'Barbell',
    tips: [
      'Sırtınızı yere neredeyse paralel olacak şekilde eğilin.',
      'Belinizi düz tutun (kambur yapmayın).',
      'Barı karnınıza doğru çekip kürek kemiklerinizi sıkıştırın.'
    ],
    tips_en: [
      'Lean forward until your back is almost parallel to the floor.',
      'Keep your lower back straight (do not hunch).',
      'Pull the bar towards your stomach and squeeze your shoulder blades.'
    ]
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    name_en: 'Lat Pulldown',
    muscleGroupId: 'back',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Cable Machine',
    equipment_en: 'Cable Machine',
    tips: [
      'Barı geniş tutuşla kavrayın.',
      'Göğsünüzü dışarı çıkararak barı üst göğsünüze doğru çekin.',
      'Gövdenizi fazla geriye yatırmaktan kaçının.'
    ],
    tips_en: [
      'Grip the bar with a wide grip.',
      'Pull the bar towards your upper chest by pushing your chest out.',
      'Avoid leaning your torso too far back.'
    ]
  },

  // OMUZ
  {
    id: 'overhead-press',
    name: 'Overhead Press (Military Press)',
    name_en: 'Overhead Press',
    muscleGroupId: 'shoulders',
    difficulty: 'Zor',
    difficulty_en: 'Advanced',
    equipment: 'Barbell',
    equipment_en: 'Barbell',
    tips: [
      'Ayakta dururken merkez bölgenizi (core) ve kalçanızı sıkı tutun.',
      'Barı omuzlarınızın üzerinden başınızın tam üstüne itin.',
      'İterken başınızı hafifçe geriye çekip bar geçince ileri alın.'
    ],
    tips_en: [
      'Keep your core and glutes tight while standing.',
      'Press the bar from your shoulders to directly overhead.',
      'Pull your head back slightly while pressing, then move it forward once the bar passes.'
    ]
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    name_en: 'Lateral Raise',
    muscleGroupId: 'shoulders',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Dumbbell',
    equipment_en: 'Dumbbell',
    tips: [
      'Kollarınızı hafifçe bükülü tutarak ağırlıkları yana doğru kaldırın.',
      'Serçe parmağınızın yukarıda olmasına hafifçe dikkat edin (su dökme hareketi).',
      'Ağırlığı omuz seviyesinden çok yukarı kaldırmayın.'
    ],
    tips_en: [
      'Lift the weights to the sides, keeping your arms slightly bent.',
      'Slightly ensure your pinky is higher (pouring water movement).',
      'Do not lift the weight much higher than shoulder level.'
    ]
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    name_en: 'Face Pull',
    muscleGroupId: 'shoulders',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Cable Machine, Halat',
    equipment_en: 'Cable Machine, Rope',
    tips: [
      'Kabloyu yüzünüzün hizasına doğru çekin.',
      'Çekerken ellerinizi dışarıya doğru açarak arka omzunuzu sıkıştırın.',
      'Dirseklerinizin ellerinizden daha yukarıda veya aynı hizada olmasına dikkat edin.'
    ],
    tips_en: [
      'Pull the cable towards your face level.',
      'Squeeze your rear delts by opening your hands outwards as you pull.',
      'Ensure your elbows are higher than or level with your hands.'
    ]
  },

  // BACAK
  {
    id: 'squat',
    name: 'Barbell Squat',
    name_en: 'Barbell Squat',
    muscleGroupId: 'legs',
    difficulty: 'Zor',
    difficulty_en: 'Advanced',
    equipment: 'Barbell, Squat Rack',
    equipment_en: 'Barbell, Squat Rack',
    tips: [
      'Ayaklarınızı omuz genişliğinde veya biraz daha geniş açın.',
      'Göğsünüzü yukarıda tutarak hayali bir sandalyeye oturur gibi çömelin.',
      'Dizlerinizin ayak parmak uçlarını çok fazla geçmemesine özen gösterin (anatomik yapıya göre değişebilir).'
    ],
    tips_en: [
      'Open your feet shoulder-width apart or slightly wider.',
      'Squat down like sitting on an imaginary chair, keeping your chest up.',
      'Try not to let your knees go too far beyond your toes.'
    ]
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    name_en: 'Leg Press',
    muscleGroupId: 'legs',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Leg Press Makinesi',
    equipment_en: 'Leg Press Machine',
    tips: [
      'Platforma itiş yaparken dizlerinizi tamamen kilitlemekten (hyperextension) kaçının.',
      'Ağırlığı kontrollü bir şekilde indirip dizlerinizi göğsünüze yaklaştırın.',
      'Kalçanızın koltuktan kalkmasına izin vermeyin.'
    ],
    tips_en: [
      'Avoid fully locking your knees (hyperextension) while pushing the platform.',
      'Lower the weight in a controlled manner and bring your knees towards your chest.',
      'Do not let your hips lift off the seat.'
    ]
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift (RDL)',
    name_en: 'Romanian Deadlift (RDL)',
    muscleGroupId: 'legs',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Barbell / Dumbbell',
    equipment_en: 'Barbell / Dumbbell',
    tips: [
      'Dizlerinizi hafif bükülü sabitleyin.',
      'Kalçanızı geriye doğru iterek barı bacaklarınıza yakın tutarak indirin.',
      'Arka bacaklarınızda (hamstring) gerilme hissettiğinizde kalçanızı sıkarak yukarı kalkın.'
    ],
    tips_en: [
      'Keep your knees slightly bent and fixed.',
      'Push your hips back and lower the bar while keeping it close to your legs.',
      'When you feel the stretch in your hamstrings, squeeze your glutes and stand up.'
    ]
  },

  // KOLLAR
  {
    id: 'bicep-curl',
    name: 'Barbell / Dumbbell Curl',
    name_en: 'Barbell / Dumbbell Curl',
    muscleGroupId: 'arms',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Barbell / Dumbbell',
    equipment_en: 'Barbell / Dumbbell',
    tips: [
      'Dirseklerinizi vücudunuzun yanına sabitleyin ve ileri-geri oynatmayın.',
      'Sadece ön kollarınız hareket etmeli.',
      'Ağırlığı indirirken yavaş ve kontrollü olun.'
    ],
    tips_en: [
      'Fix your elbows to the sides of your body and do not swing them.',
      'Only your forearms should move.',
      'Be slow and controlled when lowering the weight.'
    ]
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    name_en: 'Tricep Pushdown',
    muscleGroupId: 'arms',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Cable Machine',
    equipment_en: 'Cable Machine',
    tips: [
      'Dirseklerinizi gövdenize bitişik tutun.',
      'Ağırlığı aşağı doğru iterken arka kol (triceps) kaslarınızı sıkın.',
      'Kabloyu yukarı bırakırken 90 derece açıyı biraz geçene kadar kontrollü bırakın.'
    ],
    tips_en: [
      'Keep your elbows close to your torso.',
      'Squeeze your triceps muscles as you push the weight down.',
      'Release the cable up in a controlled manner until it slightly passes the 90-degree angle.'
    ]
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    name_en: 'Hammer Curl',
    muscleGroupId: 'arms',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Dumbbell',
    equipment_en: 'Dumbbell',
    tips: [
      'Dambılları avuç içleriniz birbirine bakacak şekilde (çekiç tutuşu) tutun.',
      'Brachialis ve ön kol kaslarını hedeflemek için idealdir.',
      'Sallanmadan, kontrollü kaldırış yapın.'
    ],
    tips_en: [
      'Hold the dumbbells with your palms facing each other (hammer grip).',
      'Ideal for targeting the brachialis and forearm muscles.',
      'Perform a controlled lift without swinging.'
    ]
  },

  // MERKEZ (CORE)
  {
    id: 'plank',
    name: 'Plank',
    name_en: 'Plank',
    muscleGroupId: 'core',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Yok (Vücut Ağırlığı)',
    equipment_en: 'None (Bodyweight)',
    tips: [
      'Dirsekleriniz tam omuzlarınızın altında olmalı.',
      'Kalçanızı çok yukarı kaldırmayın veya aşağı düşürmeyin; vücudunuz düz bir çizgi olmalı.',
      'Karın ve kalça kaslarınızı sıkarak pozisyonu koruyun.'
    ],
    tips_en: [
      'Your elbows should be directly under your shoulders.',
      'Do not lift your hips too high or let them drop; your body should be a straight line.',
      'Maintain the position by squeezing your abdominal and glute muscles.'
    ]
  },
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    name_en: 'Cable Crunch',
    muscleGroupId: 'core',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Cable Machine, Halat',
    equipment_en: 'Cable Machine, Rope',
    tips: [
      'Dizlerinizin üzerinde durun ve halatı başınızın arkasında tutun.',
      'Belinizi bükerek göğsünüzü pelvisinize doğru yaklaştırın.',
      'Hareketi kollarınızla değil karın kaslarınızla yaptığınızdan emin olun.'
    ],
    tips_en: [
      'Stand on your knees and hold the rope behind your head.',
      'Bend your waist and bring your chest towards your pelvis.',
      'Ensure you are doing the movement with your abs, not your arms.'
    ]
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    name_en: 'Hanging Leg Raise',
    muscleGroupId: 'core',
    difficulty: 'Zor',
    difficulty_en: 'Advanced',
    equipment: 'Barfiks Demiri',
    equipment_en: 'Pull-up Bar',
    tips: [
      'Bara asılın ve sallanmamaya (momentum kullanmamaya) çalışın.',
      'Bacaklarınızı düz veya dizleriniz hafif bükülü olarak yukarı kaldırın.',
      'Hareketi yavaş ve kontrollü yaparak karın kaslarınızı maksimumda hissedin.'
    ],
    tips_en: [
      'Hang from the bar and try not to swing (do not use momentum).',
      'Lift your legs up straight or with knees slightly bent.',
      'Perform the movement slowly and controlled to feel your abs at the maximum.'
    ]
  }
];

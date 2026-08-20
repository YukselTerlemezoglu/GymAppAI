export const MUSCLE_GROUPS = [
  {
    id: 'chest',
    name: 'Göğüs',
    name_en: 'Chest',
    icon: '🎯',
    description: 'Pectoralis major (büyük göğüs kası) ve altındaki pectoralis minor\'dan oluşur. Göğüs kafesini öne kol hareketlerini içeride kontrol eder.',
    description_en: 'Consists of the pectoralis major and the underlying pectoralis minor. Controls pushing movements and arm adduction.',
    subMuscles: [
      { name: 'Clavicular Head (Üst Göğüs)', name_en: 'Clavicular Head (Upper Chest)', function: 'Omuz önü ve yukarı doğru itiş (incline hareketleri)', function_en: 'Upward-forward arm pushing (incline movements)' },
      { name: 'Sternal Head (Orta/Alt Göğüs)', name_en: 'Sternal Head (Mid/Lower Chest)', function: 'Yatay itiş ve kolları gövdeye yaklaştırma (flat/decline)', function_en: 'Horizontal pushing and arm adduction (flat/decline)' },
      { name: 'Pectoralis Minor', name_en: 'Pectoralis Minor', function: 'Kürek kemiğini öne ve aşağı çeker, postür desteği', function_en: 'Pulls the scapula forward and down, posture support' }
    ],
    trainingNote: 'Göğüs gelişimi için üst-orta-alt bölgeyi farklı açılarla çalışın. Dips ve decline hareketleri alt göğüsü, incline hareketleri üst göğüsü hedefler.',
    trainingNote_en: 'Train upper-mid-lower regions with different angles. Dips and decline target lower chest; incline movements target the upper chest.',
    weeklySets: 'Haftada 10-20 set'
  },
  {
    id: 'back',
    name: 'Sırt',
    name_en: 'Back',
    icon: '🦇',
    description: 'Vücudun en geniş kas bölgesi: latissimus dorsi (kanatlar), trapezius, rhomboids ve erector spinae\'den oluşur. Postür ve çekme hareketlerinin merkezi.',
    description_en: 'The widest muscle region: latissimus dorsi, trapezius, rhomboids, and erector spinae. Central to posture and pulling movements.',
    subMuscles: [
      { name: 'Latissimus Dorsi (Kanat)', name_en: 'Latissimus Dorsi (Lats)', function: 'Kolu aşağı ve geri çeker, V şeklindeki sırt görünümünü oluşturur', function_en: 'Pulls the arm down and back; creates the V-taper look' },
      { name: 'Trapezius (Trapez)', name_en: 'Trapezius (Traps)', function: 'Kürek kemiğini yükseltir, omuzları geri çeker, boyun desteği', function_en: 'Elevates the scapula, retracts shoulders, neck support' },
      { name: 'Rhomboids (Romboidler)', name_en: 'Rhomboids', function: 'Kürek kemiklerini sıkıştırır, sağlıklı postür için kritik', function_en: 'Squeezes the shoulder blades together; critical for healthy posture' },
      { name: 'Erector Spinae (Bel Erectörleri)', name_en: 'Erector Spinae', function: 'Omurgayı dik tutar, deadlift\'te ana yük taşıyıcı', function_en: 'Keeps the spine upright; main load bearer in deadlifts' }
    ],
    trainingNote: 'Genişlik için dikey çekmeler (pull-up, pulldown), kalınlık için yatay çekmeler (row) kullanın. Sırt antrenmanında zayıf bölge: arka omuz ve romboidler.',
    trainingNote_en: 'Use vertical pulls (pull-ups, pulldowns) for width and horizontal pulls (rows) for thickness. Weak points: rear delts and rhomboids.',
    weeklySets: 'Haftada 12-22 set'
  },
  {
    id: 'shoulders',
    name: 'Omuz',
    name_en: 'Shoulders',
    icon: '⛰️',
    description: 'Deltoid kası üç baştan (anterior, lateral, posterior) oluşur. Omuz geniş görünümün anahtarı lateral (yan) baştır.',
    description_en: 'The deltoid has three heads (anterior, lateral, posterior). The lateral head is key to wide-looking shoulders.',
    subMuscles: [
      { name: 'Anterior Deltoid (Ön Omuz)', name_en: 'Anterior Deltoid (Front)', function: 'Kolu öne kaldırma ve itiş hareketleri', function_en: 'Forward arm raises and pressing' },
      { name: 'Lateral Deltoid (Yan Omuz)', name_en: 'Lateral Deltoid (Side)', function: 'Kolu yana kaldırma; omuz genişliği görünümü', function_en: 'Lateral arm raise; shoulder width appearance' },
      { name: 'Posterior Deltoid (Arka Omuz)', name_en: 'Posterior Deltoid (Rear)', function: 'Kolu geriye çekme; postür ve sırt tamamlayıcısı', function_en: 'Pulls arm backward; posture and back complement' }
    ],
    trainingNote: 'Ön omuz bench press\'te zaten çok çalışılır; antrenmanın ağırlığını lateral ve arka omuza verin. Sağlıklı omuz için face pull şart.',
    trainingNote_en: 'Front delts already work hard in bench pressing; prioritize lateral and rear heads. Face pulls are essential for shoulder health.',
    weeklySets: 'Haftada 12-20 set (yan/arka ağırlıklı)'
  },
  {
    id: 'biceps',
    name: 'Biceps',
    name_en: 'Biceps',
    icon: '💪',
    description: 'Kolu bükme hareketinden sorumlu iki başlı kastır. Kol kalınlığının büyük kısmı aslında altındaki brachialis ve tricepsten gelir.',
    description_en: 'The two-headed arm flexor. Most arm thickness actually comes from the underlying brachialis and triceps.',
    subMuscles: [
      { name: 'Biceps Brachii (Long/Short Head)', name_en: 'Biceps Brachii (Long/Short Head)', function: 'Dirsek bükme ve avuç içi yukarı (supinasyon) çevirme', function_en: 'Elbow flexion and forearm supination' },
      { name: 'Brachialis', name_en: 'Brachialis', function: 'Dirsek bükme; bicepsin altında kolu kalınlaştırır', function_en: 'Elbow flexion; thickens the arm beneath the biceps' },
      { name: 'Brachioradialis (Ön Kol)', name_en: 'Brachioradialis (Forearm)', function: 'Nötr tutuşla (çekiç) bükme; ön kol gücü', function_en: 'Flexion with neutral grip (hammer); forearm strength' }
    ],
    trainingNote: 'Uzun baş için geniş tutuş curl, kısa baş için dar tutuş. Tam gerilme için alt pozisyonda tam açının, tepe noktasında sıkmanın faydası vardır.',
    trainingNote_en: 'Wide-grip curls target the long head; close-grip the short head. Full stretch at the bottom and squeeze at the top matter.',
    weeklySets: 'Haftada 8-14 set'
  },
  {
    id: 'triceps',
    name: 'Triceps',
    name_en: 'Triceps',
    icon: '🔨',
    description: 'Kol hacminin yaklaşık 2/3\'ünü oluşturan üç başlı kastır. Tüm itiş hareketlerinin motoru.',
    description_en: 'A three-headed muscle making up about 2/3 of arm volume. The engine of all pressing movements.',
    subMuscles: [
      { name: 'Long Head (Uzun Baş)', name_en: 'Long Head', function: 'Omuzdan geçen tek baş; overhead (baş üstü) hareketlerle tam gerilir', function_en: 'The only head crossing the shoulder; fully stretched by overhead work' },
      { name: 'Lateral Head (Yan Baş)', name_en: 'Lateral Head', function: 'Pushdown ve dip gibi hareketlerde ana güç üreticisi', function_en: 'Primary force producer in pushdowns and dips' },
      { name: 'Medial Head (Orta Baş)', name_en: 'Medial Head', function: 'Dayanıklılık ve stabilite; hafif ağırlıklı yüksek tekrarda devreye girer', function_en: 'Endurance and stability; engaged with high-rep light work' }
    ],
    trainingNote: 'Long head\'ü hedeflemek için overhead extension şart. Triceps için birleşik hareket (dips, close-grip bench) + izolasyon kombinasyonu ideal.',
    trainingNote_en: 'Overhead extensions are a must for the long head. Combine compound (dips, close-grip bench) with isolation work.',
    weeklySets: 'Haftada 8-16 set'
  },
  {
    id: 'legs',
    name: 'Bacak (Quad + Hamstring)',
    name_en: 'Legs (Quads + Hamstrings)',
    icon: '🦵',
    description: 'Vücudun en güçlü kas grubu: quadriceps (ön bacak), hamstrings (arka bacak) ve kalça birlikte çalışır.',
    description_en: 'The strongest muscle group: quadriceps (front), hamstrings (back), and glutes working together.',
    subMuscles: [
      { name: 'Quadriceps (4 başlı ön bacak)', name_en: 'Quadriceps', function: 'Dizleri düzleştirme; squat ve leg press ana motoru', function_en: 'Knee extension; main driver of squats and leg press' },
      { name: 'Hamstrings (Arka Bacak)', name_en: 'Hamstrings', function: 'Dizleri bükme ve kalçayı uzatma; sprint ve deadlift gücü', function_en: 'Knee flexion and hip extension; sprint and deadlift power' },
      { name: 'Adductors (İç Bacak)', name_en: 'Adductors', function: 'Bacakları birleştirme; derin squat stabilitesi', function_en: 'Leg adduction; deep squat stability' }
    ],
    trainingNote: 'Quad için squat/leg press, hamstring için RDL/Nordic curl. Squat derinliğinde kalça kasması yağ oranı ve mobiliteye bağlıdır.',
    trainingNote_en: 'Squats/leg press for quads; RDLs/Nordic curls for hamstrings. Squat depth depends on mobility and anatomy.',
    weeklySets: 'Haftada 12-20 set'
  },
  {
    id: 'glutes',
    name: 'Kalça (Gluteus)',
    name_en: 'Glutes',
    icon: '🍑',
    description: 'Vücudun en güçlü tek kası gluteus maximus\'tur. Kalça, atletik performans ve estetik görünümün merkezidir.',
    description_en: 'The gluteus maximus is the single strongest muscle. Glutes are central to athletic performance and aesthetics.',
    subMuscles: [
      { name: 'Gluteus Maximus (Büyük Kalça)', name_en: 'Gluteus Maximus', function: 'Kalçayı uzatma (hip extension); squat ve sprint gücü', function_en: 'Hip extension; squat and sprint power' },
      { name: 'Gluteus Medius (Orta Kalça)', name_en: 'Gluteus Medius', function: 'Kalça stabilitesi; tek bacakta denge, yürüme bozukluklarını önler', function_en: 'Hip stability; single-leg balance' },
      { name: 'Gluteus Minimus', name_en: 'Gluteus Minimus', function: 'Bacağı dışa döndürme ve stabilite', function_en: 'Leg abduction rotation and stability' }
    ],
    trainingNote: 'Hip thrust gluteus maximus\'u en yüksek aktivasyonda çalıştırır. Medius için bant yürüyüşleri ve abdüksiyon hareketleri ekleyin.',
    trainingNote_en: 'Hip thrusts maximize glute activation. Add band walks and abduction work for the medius.',
    weeklySets: 'Haftada 8-16 set'
  },
  {
    id: 'calves',
    name: 'Baldır',
    name_en: 'Calves',
    icon: '🦶',
    description: 'Gastrocnemius (üst baldır) ve soleus (alt baldır) olmak üzere iki ana kastan oluşur. Zıplama ve yürüme hareketinde ana roldedir.',
    description_en: 'Two main muscles: gastrocnemius (upper calf) and soleus (lower calf). Prime movers in jumping and walking.',
    subMuscles: [
      { name: 'Gastrocnemius (Üst Baldır)', name_en: 'Gastrocnemius', function: 'Diz düzken ayak parmak ucunda yükselme; zıplama gücü', function_en: 'Rising onto toes with straight knees; jumping power' },
      { name: 'Soleus (Alt Baldır)', name_en: 'Soleus', function: 'Diz bükülüyken çalışır; dayanıklılık ve koşu', function_en: 'Works with bent knees; endurance and running' },
      { name: 'Tibialis Anterior (Ön Baldır)', name_en: 'Tibialis Anterior', function: 'Ayağı yukarı çekme; shin splint önleme', function_en: 'Dorsiflexion; shin splint prevention' }
    ],
    trainingNote: 'Gastrocnemius için düz bacak calf raise, soleus için oturarak (diz bükük) calf raise yapın. Baldır yüksek frekans ve tam hareket açıklığı ister.',
    trainingNote_en: 'Straight-leg raises for gastrocnemius; seated (bent-knee) raises for soleus. Calves respond to frequency and full range of motion.',
    weeklySets: 'Haftada 8-16 set'
  },
  {
    id: 'core',
    name: 'Merkez (Core)',
    name_en: 'Core',
    icon: '🛡️',
    description: 'Sadece karın kasları değil: gövdeyi saran tüm sistem (rectus abdominis, obliques, transversus abdominis). Gücün merkezi ve bel sağlığı.',
    description_en: 'Not just abs: the entire torso system (rectus abdominis, obliques, transversus abdominis). The center of strength and spine health.',
    subMuscles: [
      { name: 'Rectus Abdominis (Six-Pack)', name_en: 'Rectus Abdominis (Six-Pack)', function: 'Gövdeyi öne bükme (crunch hareketi)', function_en: 'Spinal flexion (crunching)' },
      { name: 'Obliques (Yan Karın)', name_en: 'Obliques', function: 'Dönme ve yan bükülme; sporcu hareketliliği', function_en: 'Rotation and lateral flexion; athletic mobility' },
      { name: 'Transversus abdominis (Derin Karın)', name_en: 'Transversus Abdominis', function: 'İç organları tutar, iç basınç korur; doğal ağırlık kemeri', function_en: 'Holds organs, maintains intra-abdominal pressure; natural weight belt' },
      { name: 'Serratus Anterior', name_en: 'Serratus Anterior', function: 'Kürek kemiğini kaburgaya sabitler; boxercise görünümü', function_en: 'Anchors the scapula to the ribs' }
    ],
    trainingNote: 'Core için sadece crunch yetmez: anti-rotasyon (Pallof press), anti-ekstansiyon (plank, ab wheel) ve kaldırma (leg raise) çeşitliliği kullanın.',
    trainingNote_en: 'Crunches alone aren\'t enough: use anti-rotation (Pallof press), anti-extension (planks, ab wheel) and hanging raises.',
    weeklySets: 'Haftada 6-12 set (2-3 seans)'
  },
  {
    id: 'forearms',
    name: 'Ön Kol',
    name_en: 'Forearms',
    icon: '✊',
    description: 'Kavrama gücünün merkezi: flexorlar (avuç içi tarafı) ve extensorlar (el sırtı tarafı). Tüm çekiş hareketlerinde dolaylı çalışır.',
    description_en: 'The center of grip strength: flexors (palm side) and extensors (back of hand side). Worked indirectly in all pulling.',
    subMuscles: [
      { name: 'Wrist Flexors (Bilek Bükücüler)', name_en: 'Wrist Flexors', function: 'Avucu içe bükme; kavrama gücü', function_en: 'Palm flexion; grip strength' },
      { name: 'Wrist Extensors (Bilek Açıcılar)', name_en: 'Wrist Extensors', function: 'Eli geriye kaldırma; tenisçi dirseğini dengeler', function_en: 'Hand extension; balances against tennis elbow' },
      { name: 'Brachioradialis', name_en: 'Brachioradialis', function: 'Çekiç tutuşunda devreye girer; ön kolun en görünür kası', function_en: 'Engaged in hammer grip; most visible forearm muscle' }
    ],
    trainingNote: 'Kavrama gücü deadlift ve pull-up\'ı doğrudan etkiler. Wrist curl + reverse curl + farmer\'s carry üçlüsü yeterli hacim verir.',
    trainingNote_en: 'Grip strength directly affects deadlifts and pull-ups. Wrist curls + reverse curls + farmer\'s carries provide sufficient volume.',
    weeklySets: 'Haftada 4-8 direkt set'
  }
];

export const EXERCISES_DB = [
  // ==================== GÖĞÜS ====================
  {
    id: 'bench-press',
    name: 'Barbell Bench Press',
    name_en: 'Barbell Bench Press',
    muscleGroupId: 'chest',
    type: 'compound',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Barbell, Sehpa',
    equipment_en: 'Barbell, Bench',
    primaryMuscles: ['Göğüs (orta)'],
    primaryMuscles_en: ['Chest (mid)'],
    secondaryMuscles: ['Ön Omuz', 'Triceps'],
    secondaryMuscles_en: ['Front Delts', 'Triceps'],
    repRange: '5-8 (güç) / 8-12 (hipertrofi)',
    repRange_en: '5-8 (strength) / 8-12 (hypertrophy)',
    tips: [
      'Bacaklarınızı yere sağlam basın, kalçanız sehpada sabit kalsın.',
      'Sırtınızda hafif bir kavis (arch) oluşturun, küreklerinizi sıkıştırın.',
      'Barı göğsünüzün alt hizasına yavaşça indirin ve patlayıcı bir şekilde itin.'
    ],
    tips_en: [
      'Plant your feet firmly and keep hips on the bench.',
      'Create a slight arch and squeeze your shoulder blades.',
      'Lower the bar slowly to your lower chest and press explosively.'
    ],
    commonMistakes: [
      'Dirsekleri 90 derece tam açmak (omuz stresi)',
      'Barı göğse sektirmek (momentum hilesi)',
      'Ayağı havada kalkmak'
    ],
    commonMistakes_en: [
      'Flaring elbows to 90° (shoulder stress)',
      'Bouncing the bar off the chest',
      'Lifting hips off the bench'
    ]
  },
  {
    id: 'incline-db-press',
    name: 'Incline Dumbbell Press',
    name_en: 'Incline Dumbbell Press',
    muscleGroupId: 'chest',
    type: 'compound',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Dumbbell, Eğimli Sehpa',
    equipment_en: 'Dumbbell, Incline Bench',
    primaryMuscles: ['Göğüs (üst)'],
    primaryMuscles_en: ['Chest (upper)'],
    secondaryMuscles: ['Ön Omuz', 'Triceps'],
    secondaryMuscles_en: ['Front Delts', 'Triceps'],
    repRange: '8-12',
    repRange_en: '8-12',
    tips: [
      'Sehpayı 30-45 derece arasına ayarlayın.',
      'Ağırlıkları omuz hizasından yukarı doğru presleyin.',
      'Tepe noktasında dambılları birbirine çok çarptırmadan göğüs kasınızı sıkın.'
    ],
    tips_en: [
      'Set the bench between 30-45 degrees.',
      'Press the weights up from shoulder height.',
      'Squeeze your chest at the top without clashing the dumbbells.'
    ],
    commonMistakes: [
      'Sehpa açısını 45 dereceden fazla yapmak (ön omuz devralır)',
      'Aşırı kilo ile hareket açıklığını azaltmak'
    ],
    commonMistakes_en: [
      'Setting the angle above 45° (front delts take over)',
      'Shortening range of motion with excess weight'
    ]
  },
  {
    id: 'cable-crossover',
    name: 'Cable Crossover',
    name_en: 'Cable Crossover',
    muscleGroupId: 'chest',
    type: 'isolation',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Cable Machine',
    equipment_en: 'Cable Machine',
    primaryMuscles: ['Göğüs'],
    primaryMuscles_en: ['Chest'],
    secondaryMuscles: ['Ön Omuz'],
    secondaryMuscles_en: ['Front Delts'],
    repRange: '12-15',
    repRange_en: '12-15',
    tips: [
      'Kabloları göğüs hizasında birleştirin.',
      'Hareketi yaparken kollarınızı çok hafif kırık tutun, kilitlemeyin.',
      'Negatif aşamada (kabloları geri bırakırken) hareketi yavaş yapın.'
    ],
    tips_en: [
      'Bring the cables together at chest height.',
      'Keep arms slightly bent; never lock them.',
      'Move slowly during the negative phase.'
    ],
    commonMistakes: [
      'Ağırlığı çok abartıp gövdeyi sallamak',
      'Kolları tam düz tutarak dirsek stresi yaratmak'
    ],
    commonMistakes_en: [
      'Swinging the torso with too much weight',
      'Fully straightening arms and stressing elbows'
    ]
  },
  {
    id: 'chest-dips',
    name: 'Chest Dips',
    name_en: 'Chest Dips',
    muscleGroupId: 'chest',
    type: 'compound',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Dip Barları',
    equipment_en: 'Dip Bars',
    primaryMuscles: ['Göğüs (alt)'],
    primaryMuscles_en: ['Chest (lower)'],
    secondaryMuscles: ['Triceps', 'Ön Omuz'],
    secondaryMuscles_en: ['Triceps', 'Front Delts'],
    repRange: '6-12',
    repRange_en: '6-12',
    tips: [
      'Gövdenizi öne eğin (göğüs vurgusu için).',
      'İnerken dirsekler omuzdan hafif dışarı açılsın.',
      'Alt pozisyonda kontrollü durun, çömme hissi yaşayın.'
    ],
    tips_en: [
      'Lean your torso forward to emphasize the chest.',
      'Let elbows flare slightly past the shoulders.',
      'Pause at the bottom under control.'
    ],
    commonMistakes: [
      'Gövde dik kalınca triceps devralır',
      'Çok derine inmek (omuz ağrısı)'
    ],
    commonMistakes_en: [
      'Staying upright turns it into a triceps move',
      'Dipping too deep (shoulder pain)'
    ]
  },
  {
    id: 'pushup',
    name: 'Push Up (Şınav)',
    name_en: 'Push Up',
    muscleGroupId: 'chest',
    type: 'compound',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Yok (Vücut Ağırlığı)',
    equipment_en: 'None (Bodyweight)',
    primaryMuscles: ['Göğüs'],
    primaryMuscles_en: ['Chest'],
    secondaryMuscles: ['Triceps', 'Ön Omuz', 'Core'],
    secondaryMuscles_en: ['Triceps', 'Front Delts', 'Core'],
    repRange: '12-25+',
    repRange_en: '12-25+',
    tips: [
      'Vücudunuz baştan topuklara tek düz çizgi olsun.',
      'Kalçanızı düşürmeyin, core\'u sıkı tutun.',
      'Elleri göğüs hizasından biraz geniş yerleştirin.'
    ],
    tips_en: [
      'Keep your body a straight line from head to heels.',
      'Don\'t let hips sag; brace your core.',
      'Place hands slightly wider than chest level.'
    ],
    commonMistakes: [
      'Kalçayı yukarı kaldırıp çadır yapmak',
      'Boynu öne uzatmak',
      'Yarım tekrar'
    ],
    commonMistakes_en: [
      'Piking the hips up',
      'Craning the neck forward',
      'Half reps'
    ]
  },

  // ==================== SIRT ====================
  {
    id: 'pull-up',
    name: 'Pull Up (Barfiks)',
    name_en: 'Pull Up',
    muscleGroupId: 'back',
    type: 'compound',
    difficulty: 'Zor',
    difficulty_en: 'Advanced',
    equipment: 'Barfiks Demiri',
    equipment_en: 'Pull-up Bar',
    primaryMuscles: ['Latissimus (Kanat)'],
    primaryMuscles_en: ['Lats'],
    secondaryMuscles: ['Biceps', 'Arka Omuz', 'Core'],
    secondaryMuscles_en: ['Biceps', 'Rear Delts', 'Core'],
    repRange: '5-12',
    repRange_en: '5-12',
    tips: [
      'Ellerinizi omuz genişliğinden biraz daha açık tutun.',
      'Kendinizi çekerken göğsünüzü bara değdirmeye çalışın.',
      'Sallanmadan, kontrollü bir şekilde inip kalkın.'
    ],
    tips_en: [
      'Grip slightly wider than shoulder width.',
      'Try to touch your chest to the bar.',
      'Move controlled, no swinging.'
    ],
    commonMistakes: [
      'Kipping (salınım) yapmadan önce strict form öğrenmemek',
      'Yarım tekrarla seti bitirmek',
      'Çene bara değmeden saymak'
    ],
    commonMistakes_en: [
      'Kipping before strict form',
      'Ending sets with half reps',
      'Counting reps before the chin clears the bar'
    ]
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    name_en: 'Barbell Row',
    muscleGroupId: 'back',
    type: 'compound',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Barbell',
    equipment_en: 'Barbell',
    primaryMuscles: ['Sırt (orta)', 'Latissimus'],
    primaryMuscles_en: ['Mid Back', 'Lats'],
    secondaryMuscles: ['Biceps', 'Arka Omuz', 'Bel Erectörleri'],
    secondaryMuscles_en: ['Biceps', 'Rear Delts', 'Erector Spinae'],
    repRange: '6-10',
    repRange_en: '6-10',
    tips: [
      'Sırtınızı yere neredeyse paralel olacak şekilde eğilin.',
      'Belinizi düz tutun (kambur yapmayın).',
      'Barı karnınıza doğru çekip kürek kemiklerinizi sıkıştırın.'
    ],
    tips_en: [
      'Lean until your back is nearly parallel to the floor.',
      'Keep your lower back flat (no hunching).',
      'Pull the bar toward your stomach and squeeze the shoulder blades.'
    ],
    commonMistakes: [
      'Ağırlığı sırtlara değil kollarla çekmek',
      'Gövdeyi dikleştirerek ölü çekişe çevirmek',
      'Bel çukuru (rounded back) omurga için tehlikeli'
    ],
    commonMistakes_en: [
      'Pulling with arms instead of the back',
      'Raising the torso and turning it into a deadlift',
      'Rounding the back — dangerous for the spine'
    ]
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    name_en: 'Lat Pulldown',
    muscleGroupId: 'back',
    type: 'compound',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Cable Machine',
    equipment_en: 'Cable Machine',
    primaryMuscles: ['Latissimus (Kanat)'],
    primaryMuscles_en: ['Lats'],
    secondaryMuscles: ['Biceps', 'Arka Omuz'],
    secondaryMuscles_en: ['Biceps', 'Rear Delts'],
    repRange: '8-12',
    repRange_en: '8-12',
    tips: [
      'Barı geniş tutuşla kavrayın.',
      'Göğsünüzü dışarı çıkararak barı üst göğsünüze doğru çekin.',
      'Gövdenizi fazla geriye yatırmaktan kaçının.'
    ],
    tips_en: [
      'Use a wide grip.',
      'Pull to your upper chest with the chest proud.',
      'Avoid leaning too far back.'
    ],
    commonMistakes: [
      'Barı enseden çekmek (klavikula stresi)',
      'Momentumla geriye sallanmak'
    ],
    commonMistakes_en: [
      'Pulling behind the neck (shoulder stress)',
      'Swinging back with momentum'
    ]
  },
  {
    id: 'deadlift',
    name: 'Deadlift (Ölü Çekiş)',
    name_en: 'Deadlift',
    muscleGroupId: 'back',
    type: 'compound',
    difficulty: 'Zor',
    difficulty_en: 'Advanced',
    equipment: 'Barbell',
    equipment_en: 'Barbell',
    primaryMuscles: ['Bel Erectörleri', 'Hamstring', 'Gluteus'],
    primaryMuscles_en: ['Erector Spinae', 'Hamstrings', 'Glutes'],
    secondaryMuscles: ['Trapezius', 'Latissimus', 'Ön Kol'],
    secondaryMuscles_en: ['Traps', 'Lats', 'Forearms'],
    repRange: '3-6 (güç)',
    repRange_en: '3-6 (strength)',
    tips: [
      'Bar ayak parmaklarının hemen üzerinde dursun.',
      'Kalçayı geriye iterek sırtı nötr tutun, belden bükülmeyin.',
      'Kalkarken bacak ve kalçadan güç alın, barı bacağınıza yakın çekin.'
    ],
    tips_en: [
      'Keep the bar over your mid-foot.',
      'Hinge back with a neutral spine; never round the lower back.',
      'Drive with legs and hips, keeping the bar close.'
    ],
    commonMistakes: [
      'Yuvarlak sırt (kambur) ile çekmek — omurga için en tehlikelisi',
      'Barı vücuttan uzak tutmak',
      'Tepede aşırı geriye yaslanmak'
    ],
    commonMistakes_en: [
      'Pulling with a rounded back — the most dangerous error',
      'Letting the bar drift away',
      'Hyperextending at the top'
    ]
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    name_en: 'Seated Cable Row',
    muscleGroupId: 'back',
    type: 'compound',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Cable Machine',
    equipment_en: 'Cable Machine',
    primaryMuscles: ['Sırt (orta)', 'Romboidler'],
    primaryMuscles_en: ['Mid Back', 'Rhomboids'],
    secondaryMuscles: ['Biceps', 'Arka Omuz'],
    secondaryMuscles_en: ['Biceps', 'Rear Delts'],
    repRange: '10-12',
    repRange_en: '10-12',
    tips: [
      'Dizleri hafif bükülü tutun, gövde dik.',
      'Kürekleri sıkıştırıp 1 saniye bekleyin.',
      'Ağırlığı kontrollü bırakın, gövdeyi ileri fazla eğmeyin.'
    ],
    tips_en: [
      'Keep knees slightly bent and torso upright.',
      'Squeeze the shoulder blades for a full second.',
      'Return under control; don\'t rock forward excessively.'
    ],
    commonMistakes: [
      'Gövdeyi ileri-geri sallamak',
      'Omuzları kulaklara çekmek'
    ],
    commonMistakes_en: [
      'Rocking the torso back and forth',
      'Shrugging shoulders to ears'
    ]
  },
  {
    id: 'face-pull-back',
    name: 'Face Pull',
    name_en: 'Face Pull',
    muscleGroupId: 'back',
    type: 'isolation',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Cable Machine, Halat',
    equipment_en: 'Cable Machine, Rope',
    primaryMuscles: ['Arka Omuz', 'Romboidler'],
    primaryMuscles_en: ['Rear Delts', 'Rhomboids'],
    secondaryMuscles: ['Trapezius (alt)', 'Rotator Manşet'],
    secondaryMuscles_en: ['Lower Traps', 'Rotator Cuff'],
    repRange: '12-20',
    repRange_en: '12-20',
    tips: [
      'Kabloyu yüzünüzün hizasına çekin.',
      'Çekerken ellerinizi dışa açıp arka omuzu sıkın.',
      'Dirsekler ellerden yukarıda olsun.'
    ],
    tips_en: [
      'Pull toward face level.',
      'Rotate hands outward, squeezing rear delts.',
      'Keep elbows above the hands.'
    ],
    commonMistakes: [
      'Çok ağır kilo ile formu bozmak',
      'Sadece kollarla çekmek'
    ],
    commonMistakes_en: [
      'Going too heavy and breaking form',
      'Pulling with arms only'
    ]
  },

  // ==================== OMUZ ====================
  {
    id: 'overhead-press',
    name: 'Overhead Press (Military Press)',
    name_en: 'Overhead Press',
    muscleGroupId: 'shoulders',
    type: 'compound',
    difficulty: 'Zor',
    difficulty_en: 'Advanced',
    equipment: 'Barbell',
    equipment_en: 'Barbell',
    primaryMuscles: ['Ön Omuz', 'Yan Omuz'],
    primaryMuscles_en: ['Front & Side Delts'],
    secondaryMuscles: ['Triceps', 'Core'],
    secondaryMuscles_en: ['Triceps', 'Core'],
    repRange: '5-8 (güç) / 8-12 (hipertrofi)',
    repRange_en: '5-8 (strength) / 8-12 (hypertrophy)',
    tips: [
      'Core ve kalçayı sıkı tutun, kambur olmadan dik durun.',
      'Barı başınızın tam üstüne, kulak hizasına itin.',
      'İterken çeneyi hafif geri alıp bar geçince öne alın.'
    ],
    tips_en: [
      'Brace core and glutes; stay tall.',
      'Press the bar overhead to ear level.',
      'Move the chin back as the bar passes.'
    ],
    commonMistakes: [
      'Beli aşırı kavistirerek göğüs presine çevirmek',
      'Barı öne değil tepeye itmemek'
    ],
    commonMistakes_en: [
      'Excessively arching into an incline press',
      'Pressing forward instead of straight up'
    ]
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    name_en: 'Lateral Raise',
    muscleGroupId: 'shoulders',
    type: 'isolation',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Dumbbell',
    equipment_en: 'Dumbbell',
    primaryMuscles: ['Yan Omuz'],
    primaryMuscles_en: ['Side Delts'],
    secondaryMuscles: ['Trapezius'],
    secondaryMuscles_en: ['Traps'],
    repRange: '12-20',
    repRange_en: '12-20',
    tips: [
      'Kolları hafif bükülü tutarak yana kaldırın.',
      'Serçe parmak hafif yukarıda (su dökme hissi).',
      'Omuz seviyesini çok geçmeyin.'
    ],
    tips_en: [
      'Raise to the sides with slightly bent arms.',
      'Lead with the pinky slightly (pouring water).',
      'Don\'t go far past shoulder level.'
    ],
    commonMistakes: [
      'Trapezius ile omuz silkmek',
      'Ağırlığı sallayarak fırlatmak'
    ],
    commonMistakes_en: [
      'Shrugging with traps',
      'Swinging the weight up'
    ]
  },
  {
    id: 'face-pull',
    name: 'Rear Delt Face Pull',
    name_en: 'Rear Delt Face Pull',
    muscleGroupId: 'shoulders',
    type: 'isolation',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Cable Machine, Halat',
    equipment_en: 'Cable Machine, Rope',
    primaryMuscles: ['Arka Omuz'],
    primaryMuscles_en: ['Rear Delts'],
    secondaryMuscles: ['Romboidler', 'Rotator Manşet'],
    secondaryMuscles_en: ['Rhomboids', 'Rotator Cuff'],
    repRange: '12-20',
    repRange_en: '12-20',
    tips: [
      'Kabloyu yüz hizasına çekin.',
      'Elleri dışa açarak arka omuzu sıkın.',
      'Dirsekler ellerden yüksek dursun.'
    ],
    tips_en: [
      'Pull toward face level.',
      'Open the hands out, squeezing rear delts.',
      'Keep elbows above hands.'
    ],
    commonMistakes: [
      'Aşırı kilo ile form bozulması',
      'Dirseklerin düşmesi'
    ],
    commonMistakes_en: [
      'Too much weight ruining form',
      'Letting elbows drop'
    ]
  },
  {
    id: 'arnold-press',
    name: 'Arnold Press',
    name_en: 'Arnold Press',
    muscleGroupId: 'shoulders',
    type: 'compound',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Dumbbell',
    equipment_en: 'Dumbbell',
    primaryMuscles: ['Ön Omuz', 'Yan Omuz'],
    primaryMuscles_en: ['Front & Side Delts'],
    secondaryMuscles: ['Triceps'],
    secondaryMuscles_en: ['Triceps'],
    repRange: '8-12',
    repRange_en: '8-12',
    tips: [
      'Avuçlar içe bakarken başlayın, iterken dışa çevirin.',
      'Dönüşü kontrollü yapın.',
      'Tepede kilitlemeden önce kası sıkın.'
    ],
    tips_en: [
      'Start palms-in, rotate out as you press.',
      'Control the rotation.',
      'Squeeze before locking out.'
    ],
    commonMistakes: [
      'Dönüşü çok hızlı yapmak',
      'Aşırı kilo ile omuz stresi'
    ],
    commonMistakes_en: [
      'Rotating too fast',
      'Shoulder stress from excess weight'
    ]
  },

  // ==================== BICEPS ====================
  {
    id: 'bicep-curl',
    name: 'Barbell / Dumbbell Curl',
    name_en: 'Barbell / Dumbbell Curl',
    muscleGroupId: 'biceps',
    type: 'isolation',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Barbell / Dumbbell',
    equipment_en: 'Barbell / Dumbbell',
    primaryMuscles: ['Biceps'],
    primaryMuscles_en: ['Biceps'],
    secondaryMuscles: ['Ön Kol'],
    secondaryMuscles_en: ['Forearms'],
    repRange: '8-12',
    repRange_en: '8-12',
    tips: [
      'Dirsekleri gövdeye sabitleyin, ileri-geri oynatmayın.',
      'Sadece ön kollar hareket etmeli.',
      'İndirirken yavaş ve kontrollü olun.'
    ],
    tips_en: [
      'Pin elbows to your sides.',
      'Only the forearms should move.',
      'Lower slowly under control.'
    ],
    commonMistakes: [
      'Gövdeyi sallayarak momentum almak',
      'Dirsekleri öne götürmek'
    ],
    commonMistakes_en: [
      'Swaying the torso for momentum',
      'Letting elbows drift forward'
    ]
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    name_en: 'Hammer Curl',
    muscleGroupId: 'biceps',
    type: 'isolation',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Dumbbell',
    equipment_en: 'Dumbbell',
    primaryMuscles: ['Brachialis', 'Brachioradialis'],
    primaryMuscles_en: ['Brachialis', 'Brachioradialis'],
    secondaryMuscles: ['Biceps'],
    secondaryMuscles_en: ['Biceps'],
    repRange: '10-12',
    repRange_en: '10-12',
    tips: [
      'Avuç içleri birbirine baksın (çekiç tutuşu).',
      'Kol kalınlığı (brachialis) için idealdir.',
      'Kontrollü kaldırın, sallanmayın.'
    ],
    tips_en: [
      'Palms face each other (hammer grip).',
      'Great for arm thickness (brachialis).',
      'Lift controlled, no swinging.'
    ],
    commonMistakes: [
      'Hızlı tempoda formu kaybetmek',
      'Dirseklerin yana açılması'
    ],
    commonMistakes_en: [
      'Losing form at speed',
      'Elbows flaring out'
    ]
  },
  {
    id: 'incline-db-curl',
    name: 'Incline Dumbbell Curl',
    name_en: 'Incline Dumbbell Curl',
    muscleGroupId: 'biceps',
    type: 'isolation',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Dumbbell, Eğimli Sehpa',
    equipment_en: 'Dumbbell, Incline Bench',
    primaryMuscles: ['Biceps (uzun baş)'],
    primaryMuscles_en: ['Biceps (long head)'],
    secondaryMuscles: ['Ön Kol'],
    secondaryMuscles_en: ['Forearms'],
    repRange: '10-12',
    repRange_en: '10-12',
    tips: [
      'Sehpayı 45-60 dereceye ayarlayın.',
      'Kollar aşağı sarkık dursun, tam gerilme alın.',
      'Acele etmeyin; uzun baş tam gerilmeye ihtiyaç duyar.'
    ],
    tips_en: [
      'Set the bench to 45-60 degrees.',
      'Let arms hang for a full stretch.',
      'No rush; the long head needs stretch.'
    ],
    commonMistakes: [
      'Dirsekleri kaldırıp gerilme kaybetmek',
      'Çok ağır kilo ile yarım tekrar'
    ],
    commonMistakes_en: [
      'Raising elbows and losing the stretch',
      'Half reps with heavy weight'
    ]
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl',
    name_en: 'Preacher Curl',
    muscleGroupId: 'biceps',
    type: 'isolation',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Preacher Sehpası, EZ Bar',
    equipment_en: 'Preacher Bench, EZ Bar',
    primaryMuscles: ['Biceps (kısa baş)'],
    primaryMuscles_en: ['Biceps (short head)'],
    secondaryMuscles: ['Brachialis'],
    secondaryMuscles_en: ['Brachialis'],
    repRange: '10-12',
    repRange_en: '10-12',
    tips: [
      'Koltuk altlarını pad\'e dayayın.',
      'Tam açılın ama dirseği aşırı zorlamayın.',
      'Tepe noktasında 1 saniye sıkın.'
    ],
    tips_en: [
      'Plant armpits on the pad.',
      'Extend fully without hyperextending elbows.',
      'Squeeze one second at the top.'
    ],
    commonMistakes: [
      'Kolları pad\'den ayırmak',
      'Alt pozisyonda anlık bırakmak'
    ],
    commonMistakes_en: [
      'Lifting arms off the pad',
      'Dropping quickly at the bottom'
    ]
  },

  // ==================== TRICEPS ====================
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    name_en: 'Tricep Pushdown',
    muscleGroupId: 'triceps',
    type: 'isolation',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Cable Machine',
    equipment_en: 'Cable Machine',
    primaryMuscles: ['Triceps (yan/orta baş)'],
    primaryMuscles_en: ['Triceps (lateral/medial head)'],
    secondaryMuscles: [],
    secondaryMuscles_en: [],
    repRange: '10-15',
    repRange_en: '10-15',
    tips: [
      'Dirsekleri gövdeye bitişik tutun.',
      'İterken triceps\'i tepede sıkın.',
      'Yukarı kontrollü bırakın, 90 deregeyi biraz geçene kadar.'
    ],
    tips_en: [
      'Keep elbows glued to your torso.',
      'Squeeze hard at the bottom.',
      'Return controlled slightly past 90°.'
    ],
    commonMistakes: [
      'Dirseklerin öne çıkması',
      'Gövdeyle birlikte eğilerek itmek'
    ],
    commonMistakes_en: [
      'Elbows drifting forward',
      'Leaning into the push with bodyweight'
    ]
  },
  {
    id: 'overhead-extension',
    name: 'Overhead Tricep Extension',
    name_en: 'Overhead Tricep Extension',
    muscleGroupId: 'triceps',
    type: 'isolation',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Dumbbell / Cable',
    equipment_en: 'Dumbbell / Cable',
    primaryMuscles: ['Triceps (uzun baş)'],
    primaryMuscles_en: ['Triceps (long head)'],
    secondaryMuscles: [],
    secondaryMuscles_en: [],
    repRange: '10-12',
    repRange_en: '10-12',
    tips: [
      'Ağırlığı başınızın arkasından indirin.',
      'Uzun baş ancak overhead pozisyonda tam gerilir.',
      'Dirsekler ileri baksın, dışa açılmasın.'
    ],
    tips_en: [
      'Lower the weight behind your head.',
      'The long head only fully stretches overhead.',
      'Keep elbows pointing forward.'
    ],
    commonMistakes: [
      'Dirseklerin açılması',
      'Aşırı kilo ile bel kavislenmesi'
    ],
    commonMistakes_en: [
      'Elbows flaring',
      'Excess arching with heavy weight'
    ]
  },
  {
    id: 'skullcrusher',
    name: 'Skull Crusher (EZ Bar)',
    name_en: 'Skull Crusher (EZ Bar)',
    muscleGroupId: 'triceps',
    type: 'isolation',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'EZ Bar',
    equipment_en: 'EZ Bar',
    primaryMuscles: ['Triceps'],
    primaryMuscles_en: ['Triceps'],
    secondaryMuscles: [],
    secondaryMuscles_en: [],
    repRange: '8-12',
    repRange_en: '8-12',
    tips: [
      'Barı alna değil, başın üstü arkasına indirin.',
      'Dirsekler sabit ve yukarı baksın.',
      'Eklemleri korumak için kontrollü tempo.'
    ],
    tips_en: [
      'Lower behind the forehead, not to it.',
      'Elbows stay fixed and pointing up.',
      'Controlled tempo protects the joints.'
    ],
    commonMistakes: [
      'Dirseklerin gövdeye yaklaşması',
      'Hızlı indirme (eklem stresi)'
    ],
    commonMistakes_en: [
      'Elbows drifting toward the torso',
      'Fast lowering (joint stress)'
    ]
  },
  {
    id: 'close-grip-bench',
    name: 'Close-Grip Bench Press',
    name_en: 'Close-Grip Bench Press',
    muscleGroupId: 'triceps',
    type: 'compound',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Barbell, Sehpa',
    equipment_en: 'Barbell, Bench',
    primaryMuscles: ['Triceps'],
    primaryMuscles_en: ['Triceps'],
    secondaryMuscles: ['Göğüs', 'Ön Omuz'],
    secondaryMuscles_en: ['Chest', 'Front Delts'],
    repRange: '6-10',
    repRange_en: '6-10',
    tips: [
      'Eller omuz genişliğinde veya biraz dar.',
      'Barı alt göğüse doğru indirin.',
      'Dirsekleri gövdeye yakın tutun.'
    ],
    tips_en: [
      'Hands shoulder-width or slightly narrower.',
      'Lower the bar to the lower chest.',
      'Keep elbows tucked.'
    ],
    commonMistakes: [
      'Çok dar tutuş (bilek stresi)',
      'Dirseklerin açılması (bench press\'e dönüşür)'
    ],
    commonMistakes_en: [
      'Ultra-narrow grip (wrist stress)',
      'Elbows flaring (turns into a bench press)'
    ]
  },

  // ==================== BACAK ====================
  {
    id: 'squat',
    name: 'Barbell Squat',
    name_en: 'Barbell Squat',
    muscleGroupId: 'legs',
    type: 'compound',
    difficulty: 'Zor',
    difficulty_en: 'Advanced',
    equipment: 'Barbell, Squat Rack',
    equipment_en: 'Barbell, Squat Rack',
    primaryMuscles: ['Quadriceps', 'Gluteus'],
    primaryMuscles_en: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstring', 'Core', 'Adductor'],
    secondaryMuscles_en: ['Hamstrings', 'Core', 'Adductors'],
    repRange: '5-8 (güç) / 8-12 (hipertrofi)',
    repRange_en: '5-8 (strength) / 8-12 (hypertrophy)',
    tips: [
      'Ayaklar omuz genişliğinde, parmaklar hafif dışa.',
      'Göğsü yukarı tutarak sandalyeye oturur gibi çömelin.',
      'Kalça ve diz aynı anda uzayarak kalkın.'
    ],
    tips_en: [
      'Feet shoulder-width, toes slightly out.',
      'Sit back with the chest proud.',
      'Drive up extending hips and knees together.'
    ],
    commonMistakes: [
      'Dizlerin içe çökmesi (valgus)',
      'Topukların kalkması',
      'Göğsün öne düşmesi'
    ],
    commonMistakes_en: [
      'Knees caving in (valgus)',
      'Heels lifting',
      'Chest collapsing forward'
    ]
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    name_en: 'Leg Press',
    muscleGroupId: 'legs',
    type: 'compound',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Leg Press Makinesi',
    equipment_en: 'Leg Press Machine',
    primaryMuscles: ['Quadriceps'],
    primaryMuscles_en: ['Quadriceps'],
    secondaryMuscles: ['Gluteus', 'Hamstring'],
    secondaryMuscles_en: ['Glutes', 'Hamstrings'],
    repRange: '8-15',
    repRange_en: '8-15',
    tips: [
      'İterken dizleri tam kilitlemeyin.',
      'Kontrollü indirip dizleri göğse yaklaştırın.',
      'Kalça koltuktan kalkmasın.'
    ],
    tips_en: [
      'Don\'t lock the knees at the top.',
      'Lower controlled, knees toward the chest.',
      'Keep hips glued to the seat.'
    ],
    commonMistakes: [
      'Belin koltuktan ayrılması (tehlike)',
      'Aşırı kilo ile yarım tekrar',
      'Ellerin dizde kullanılması'
    ],
    commonMistakes_en: [
      'Lower back peeling off the seat (danger)',
      'Half reps with too much weight',
      'Hands helping the knees'
    ]
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift (RDL)',
    name_en: 'Romanian Deadlift (RDL)',
    muscleGroupId: 'legs',
    type: 'compound',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Barbell / Dumbbell',
    equipment_en: 'Barbell / Dumbbell',
    primaryMuscles: ['Hamstring', 'Gluteus'],
    primaryMuscles_en: ['Hamstrings', 'Glutes'],
    secondaryMuscles: ['Bel Erectörleri', 'Ön Kol'],
    secondaryMuscles_en: ['Erector Spinae', 'Forearms'],
    repRange: '8-12',
    repRange_en: '8-12',
    tips: [
      'Dizler hafif bükülü sabit kalsın.',
      'Kalçayı geri itip barı bacağa yakın indirin.',
      'Hamstring\'de gerilme hissedince sıkarak kalkın.'
    ],
    tips_en: [
      'Keep knees slightly bent and fixed.',
      'Hinge back, bar close to the legs.',
      'When you feel the hamstring stretch, squeeze up.'
    ],
    commonMistakes: [
      'Squat gibi çömelerek inmek',
      'Barı bacaklardan uzaklaştırmak',
      'Sırtı yuvarlamak'
    ],
    commonMistakes_en: [
      'Squatting instead of hinging',
      'Letting the bar drift away',
      'Rounding the back'
    ]
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    name_en: 'Bulgarian Split Squat',
    muscleGroupId: 'legs',
    type: 'compound',
    difficulty: 'Zor',
    difficulty_en: 'Advanced',
    equipment: 'Dumbbell, Sehpa',
    equipment_en: 'Dumbbell, Bench',
    primaryMuscles: ['Quadriceps', 'Gluteus'],
    primaryMuscles_en: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstring', 'Core'],
    secondaryMuscles_en: ['Hamstrings', 'Core'],
    repRange: '8-12 (bacak başına)',
    repRange_en: '8-12 (per leg)',
    tips: [
      'Arka ayak sehpada, ön ayak 60-70 cm önde.',
      'Gövde dik kalsın ya da hafif öne eğilsin (gluteus vurgusu).',
      'Ön diz parmak hizasını az geçsin.'
    ],
    tips_en: [
      'Rear foot on the bench, front foot 60-70 cm ahead.',
      'Stay upright or lean slightly forward for glutes.',
      'Front knee just past the toes.'
    ],
    commonMistakes: [
      'Çok uzun adım atıp denge kaybı',
      'Gövdeyi aşırı eğmek'
    ],
    commonMistakes_en: [
      'Overstriding and losing balance',
      'Excessive torso lean'
    ]
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    name_en: 'Leg Extension',
    muscleGroupId: 'legs',
    type: 'isolation',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Leg Extension Makinesi',
    equipment_en: 'Leg Extension Machine',
    primaryMuscles: ['Quadriceps'],
    primaryMuscles_en: ['Quadriceps'],
    secondaryMuscles: [],
    secondaryMuscles_en: [],
    repRange: '12-15',
    repRange_en: '12-15',
    tips: [
      'Diz makinenin pivotuyla hizalı olsun.',
      'Tepede 1 saniye kası sıkın.',
      'Ağırlik bırakırken yavaş olun.'
    ],
    tips_en: [
      'Align knees with the machine pivot.',
      'Squeeze one second at the top.',
      'Slow on the way down.'
    ],
    commonMistakes: [
      'Gövdeyi kaldırarak yardım almak',
      'Aşırı kilo ile sallamak'
    ],
    commonMistakes_en: [
      'Lifting the hips for help',
      'Swinging heavy weight'
    ]
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl (Oturarak/Yatarak)',
    name_en: 'Leg Curl (Seated/Lying)',
    muscleGroupId: 'legs',
    type: 'isolation',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Leg Curl Makinesi',
    equipment_en: 'Leg Curl Machine',
    primaryMuscles: ['Hamstring'],
    primaryMuscles_en: ['Hamstrings'],
    secondaryMuscles: ['Baldir (gastrocnemius)'],
    secondaryMuscles_en: ['Calves (gastrocnemius)'],
    repRange: '10-15',
    repRange_en: '10-15',
    tips: [
      'Kalçayı paddede sabit tutun.',
      'Kontrollü bırakın, anlık düşürmeyin.',
      'Tam açıklıkla çalışın.'
    ],
    tips_en: [
      'Keep hips pressed down.',
      'Control the negative.',
      'Use full range of motion.'
    ],
    commonMistakes: [
      'Kalçanın kalkması',
      'Yarım tekrar'
    ],
    commonMistakes_en: [
      'Hips rising',
      'Half reps'
    ]
  },

  // ==================== KALÇA ====================
  {
    id: 'hip-thrust',
    name: 'Barbell Hip Thrust',
    name_en: 'Barbell Hip Thrust',
    muscleGroupId: 'glutes',
    type: 'compound',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Barbell, Sehpa',
    equipment_en: 'Barbell, Bench',
    primaryMuscles: ['Gluteus Maximus'],
    primaryMuscles_en: ['Gluteus Maximus'],
    secondaryMuscles: ['Hamstring', 'Core'],
    secondaryMuscles_en: ['Hamstrings', 'Core'],
    repRange: '8-12',
    repRange_en: '8-12',
    tips: [
      'Kürek kemikleri sehpada dayansın.',
      'Tepede kalçayı sıkıp çene göğse baksın.',
      'Dizler ayak bileği hizasında dursun.'
    ],
    tips_en: [
      'Rest the shoulder blades on the bench.',
      'Squeeze the glutes hard at the top, ribs down.',
      'Knees stacked over the ankles at the top.'
    ],
    commonMistakes: [
      'Aşırı bel kavisi ile beli çalıştırmak',
      'Tepede tam kilitlenmemek'
    ],
    commonMistakes_en: [
      'Hyperextending the lower back',
      'Not fully locking out the hips'
    ]
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    name_en: 'Glute Bridge',
    muscleGroupId: 'glutes',
    type: 'isolation',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Yok / Dumbbell',
    equipment_en: 'None / Dumbbell',
    primaryMuscles: ['Gluteus Maximus'],
    primaryMuscles_en: ['Gluteus Maximus'],
    secondaryMuscles: ['Hamstring', 'Core'],
    secondaryMuscles_en: ['Hamstrings', 'Core'],
    repRange: '12-20',
    repRange_en: '12-20',
    tips: [
      'Topuklara yakın durun, kalçayı yukarı sıkın.',
      'Tepede 1-2 saniye tutun.',
      'Bel değil kalça çalışıyor olmalı.'
    ],
    tips_en: [
      'Heels close; drive the hips up by squeezing.',
      'Hold 1-2 seconds at the top.',
      'Feel it in glutes, not low back.'
    ],
    commonMistakes: [
      'Aşırı bel kavisi',
      'Ayakları uzak tutmak (hamstring devralır)'
    ],
    commonMistakes_en: [
      'Excessive arch',
      'Feet too far (hamstrings take over)'
    ]
  },
  {
    id: 'cable-kickback',
    name: 'Cable Glute Kickback',
    name_en: 'Cable Glute Kickback',
    muscleGroupId: 'glutes',
    type: 'isolation',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Cable Machine, Ayak Bileği Manşonu',
    equipment_en: 'Cable Machine, Ankle Strap',
    primaryMuscles: ['Gluteus Maximus'],
    primaryMuscles_en: ['Gluteus Maximus'],
    secondaryMuscles: ['Hamstring'],
    secondaryMuscles_en: ['Hamstrings'],
    repRange: '12-15 (bacak başına)',
    repRange_en: '12-15 (per leg)',
    tips: [
      'Bacak geriye sıkıştırıp 1 saniye tutun.',
      'Gövde sabit kalsın, momentum yok.',
      'Hafif kilo ile kas zihinsel bağlantısı kurun.'
    ],
    tips_en: [
      'Squeeze back and hold one second.',
      'Torso stable, no momentum.',
      'Light weight for the mind-muscle connection.'
    ],
    commonMistakes: [
      'Beli eğerek hareketi büyütmek',
      'Aşırı kilo ile sallanmak'
    ],
    commonMistakes_en: [
      'Arching the back to fake range',
      'Swinging heavy weight'
    ]
  },
  {
    id: 'hip-abduction',
    name: 'Hip Abduction (Bant/Makine)',
    name_en: 'Hip Abduction (Band/Machine)',
    muscleGroupId: 'glutes',
    type: 'isolation',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Bant / Abduction Makinesi',
    equipment_en: 'Band / Abduction Machine',
    primaryMuscles: ['Gluteus Medius'],
    primaryMuscles_en: ['Gluteus Medius'],
    secondaryMuscles: ['Gluteus Minimus'],
    secondaryMuscles_en: ['Gluteus Minimus'],
    repRange: '15-20',
    repRange_en: '15-20',
    tips: [
      'Gövde hafif öne eğik tutun (medius aktivasyonu).',
      'Kontrollü açıp kontrollü kapatın.',
      'Tek bacak versiyonları dengeyi de geliştirir.'
    ],
    tips_en: [
      'Lean forward slightly for medius activation.',
      'Open and close under control.',
      'Single-leg versions add balance.'
    ],
    commonMistakes: [
      'Aşırı kilo ile gövdeyi döndürmek',
      'Yarım açıklık'
    ],
    commonMistakes_en: [
      'Rotating the torso with heavy weight',
      'Partial range'
    ]
  },

  // ==================== BALDIR ====================
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    name_en: 'Standing Calf Raise',
    muscleGroupId: 'calves',
    type: 'isolation',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Calf Makinesi / Dumbbell',
    equipment_en: 'Calf Machine / Dumbbell',
    primaryMuscles: ['Gastrocnemius'],
    primaryMuscles_en: ['Gastrocnemius'],
    secondaryMuscles: ['Soleus'],
    secondaryMuscles_en: ['Soleus'],
    repRange: '10-15',
    repRange_en: '10-15',
    tips: [
      'Tam gerilmeye inin (topuk aşağı).',
      'Tepede 1-2 saniye sıkın.',
      'Dizler kilitli değil, hafif yumuşak.'
    ],
    tips_en: [
      'Drop the heels for a full stretch.',
      'Squeeze 1-2 seconds at the top.',
      'Knees soft, never locked.'
    ],
    commonMistakes: [
      'Hızlı zıplama tarzı tekrarlar',
      'Yarım açıklık'
    ],
    commonMistakes_en: [
      'Bouncy, jump-style reps',
      'Partial range'
    ]
  },
  {
    id: 'seated-calf-raise',
    name: 'Seated Calf Raise',
    name_en: 'Seated Calf Raise',
    muscleGroupId: 'calves',
    type: 'isolation',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Seated Calf Makinesi',
    equipment_en: 'Seated Calf Machine',
    primaryMuscles: ['Soleus'],
    primaryMuscles_en: ['Soleus'],
    secondaryMuscles: ['Gastrocnemius'],
    secondaryMuscles_en: ['Gastrocnemius'],
    repRange: '15-20',
    repRange_en: '15-20',
    tips: [
      'Oturarak çalışmak soleus\'u izole eder.',
      'Yavaş tempo: 2 saniye yukarı, 3 saniye aşağı.',
      'Diz bükülü olduğu için gastrocnemius devre dışı kalır.'
    ],
    tips_en: [
      'The seated position isolates the soleus.',
      'Slow tempo: 2s up, 3s down.',
      'Bent knees disengage the gastrocnemius.'
    ],
    commonMistakes: [
      'Ayak parmaklarıyla itmek (bilek stresi)',
      'Çok hızlı tekrar'
    ],
    commonMistakes_en: [
      'Pushing through toes (ankle stress)',
      'Rushing reps'
    ]
  },

  // ==================== CORE ====================
  {
    id: 'plank',
    name: 'Plank',
    name_en: 'Plank',
    muscleGroupId: 'core',
    type: 'isometry',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Yok (Vücut Ağırlığı)',
    equipment_en: 'None (Bodyweight)',
    primaryMuscles: ['Core (transversus)'],
    primaryMuscles_en: ['Core (transversus)'],
    secondaryMuscles: ['Omuz', 'Gluteus'],
    secondaryMuscles_en: ['Shoulders', 'Glutes'],
    repRange: '30-90 saniye',
    repRange_en: '30-90 seconds',
    tips: [
      'Dirsekler tam omuz altında.',
      'Vücut düz çizgi; kalça yukarı veya aşağı değil.',
      'Karın ve kalçayı sıkarak pozisyonu koruyun.'
    ],
    tips_en: [
      'Elbows directly under the shoulders.',
      'Straight line; no piking or sagging.',
      'Hold by squeezing abs and glutes.'
    ],
    commonMistakes: [
      'Kalçanın düşmesi',
      'Nefesi tutmak',
      'Boynu yukarı uzatmak'
    ],
    commonMistakes_en: [
      'Hips sagging',
      'Holding the breath',
      'Craning the neck'
    ]
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    name_en: 'Hanging Leg Raise',
    muscleGroupId: 'core',
    type: 'isolation',
    difficulty: 'Zor',
    difficulty_en: 'Advanced',
    equipment: 'Barfiks Demiri',
    equipment_en: 'Pull-up Bar',
    primaryMuscles: ['Karın (alt bölge)'],
    primaryMuscles_en: ['Lower Abs'],
    secondaryMuscles: ['Hip Flexor', 'Ön Kol'],
    secondaryMuscles_en: ['Hip Flexors', 'Forearms'],
    repRange: '8-15',
    repRange_en: '8-15',
    tips: [
      'Sallanmadan, kontrollü çalışın.',
      'Kalçayı hafif kıvırarak bacakları yukarı alın.',
      'Dizler bükülü versiyonla başlayın.'
    ],
    tips_en: [
      'No swinging; stay controlled.',
      'Curl the pelvis slightly as you raise.',
      'Start with bent knees.'
    ],
    commonMistakes: [
      'Momentumla sallanmak',
      'Sadece kalça fleksörüyle kaldırmak'
    ],
    commonMistakes_en: [
      'Using momentum',
      'Raising with hip flexors only'
    ]
  },
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    name_en: 'Cable Crunch',
    muscleGroupId: 'core',
    type: 'isolation',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Cable Machine, Halat',
    equipment_en: 'Cable Machine, Rope',
    primaryMuscles: ['Rectus Abdominis'],
    primaryMuscles_en: ['Rectus Abdominis'],
    secondaryMuscles: ['Obliques'],
    secondaryMuscles_en: ['Obliques'],
    repRange: '12-15',
    repRange_en: '12-15',
    tips: [
      'Dizler üstünde durun, halat başın arkasında.',
      'Belinizi bükerek göğsü pelvise yaklaştırın.',
      'Kollarla değil karınla hareket edin.'
    ],
    tips_en: [
      'Kneel with the rope behind your head.',
      'Flex the spine, bringing chest to pelvis.',
      'Crunch with abs, not arms.'
    ],
    commonMistakes: [
      'Kalçadan eğilmek (hip hinge)',
      'Kollarla çekmek'
    ],
    commonMistakes_en: [
      'Hinging at the hips',
      'Pulling with the arms'
    ]
  },
  {
    id: 'ab-wheel',
    name: 'Ab Wheel Rollout',
    name_en: 'Ab Wheel Rollout',
    muscleGroupId: 'core',
    type: 'compound',
    difficulty: 'Zor',
    difficulty_en: 'Advanced',
    equipment: 'Ab Wheel',
    equipment_en: 'Ab Wheel',
    primaryMuscles: ['Core (anti-ekstansiyon)'],
    primaryMuscles_en: ['Core (anti-extension)'],
    secondaryMuscles: ['Latissimus', 'Omuz'],
    secondaryMuscles_en: ['Lats', 'Shoulders'],
    repRange: '8-12',
    repRange_en: '8-12',
    tips: [
      'Bel çukuruna düşmeden (anti-ekstansiyon) ileri açılın.',
      'Kalçayı hafif geriye tucked tutun.',
      'Diz üstünden başlayın, yeterince güçlenince ayakta yapın.'
    ],
    tips_en: [
      'Roll out without letting the back arch.',
      'Keep the hips slightly tucked.',
      'Start from the knees; progress to standing.'
    ],
    commonMistakes: [
      'Belin çökmesi (lumbar stres)',
      'Aşırı açılıp kontrolü kaybetmek'
    ],
    commonMistakes_en: [
      'Lower back sagging (lumbar stress)',
      'Rolling too far, losing control'
    ]
  },
  {
    id: 'russian-twist',
    name: 'Russian Twist',
    name_en: 'Russian Twist',
    muscleGroupId: 'core',
    type: 'isolation',
    difficulty: 'Orta',
    difficulty_en: 'Intermediate',
    equipment: 'Dumbbell / Plaka',
    equipment_en: 'Dumbbell / Plate',
    primaryMuscles: ['Obliques'],
    primaryMuscles_en: ['Obliques'],
    secondaryMuscles: ['Rectus Abdominis'],
    secondaryMuscles_en: ['Rectus Abdominis'],
    repRange: '12-20 (taraf başına)',
    repRange_en: '12-20 (per side)',
    tips: [
      'Gövdeyi 45 derece geriye yatırın.',
      'Dönüşü gövdeyle yapın, sadece kollarla değil.',
      'Kontrollü tempo ile yapın.'
    ],
    tips_en: [
      'Lean back to 45 degrees.',
      'Rotate with the torso, not just arms.',
      'Use a controlled tempo.'
    ],
    commonMistakes: [
      'Aşırı hızla momentumla dönmek',
      'Bel ağrısı varsa derin açı'
    ],
    commonMistakes_en: [
      'Rushing with momentum',
      'Deep lean if you have back issues'
    ]
  },

  // ==================== ÖN KOL ====================
  {
    id: 'wrist-curl',
    name: 'Wrist Curl',
    name_en: 'Wrist Curl',
    muscleGroupId: 'forearms',
    type: 'isolation',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Dumbbell / Barbell',
    equipment_en: 'Dumbbell / Barbell',
    primaryMuscles: ['Wrist Flexors'],
    primaryMuscles_en: ['Wrist Flexors'],
    secondaryMuscles: [],
    secondaryMuscles_en: [],
    repRange: '15-20',
    repRange_en: '15-20',
    tips: [
      'Ön kolayı sehpaya ya da bacağınıza dayayın.',
      'Tam açıklıkla hafif kilo kullanın.',
      'Yavaş tempo ile kavrama gücünü artırın.'
    ],
    tips_en: [
      'Rest forearms on a bench or thighs.',
      'Light weight, full range.',
      'Slow tempo builds grip strength.'
    ],
    commonMistakes: [
      'Aşırı kilo ile bileği zorlamak',
      'Yarım tekrar'
    ],
    commonMistakes_en: [
      'Overloading the wrist',
      'Half reps'
    ]
  },
  {
    id: 'reverse-curl',
    name: 'Reverse Curl',
    name_en: 'Reverse Curl',
    muscleGroupId: 'forearms',
    type: 'isolation',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Barbell / Dumbbell',
    equipment_en: 'Barbell / Dumbbell',
    primaryMuscles: ['Wrist Extensors', 'Brachioradialis'],
    primaryMuscles_en: ['Wrist Extensors', 'Brachioradialis'],
    secondaryMuscles: ['Biceps'],
    secondaryMuscles_en: ['Biceps'],
    repRange: '12-15',
    repRange_en: '12-15',
    tips: [
      'Avuçlar yere baksın (prone tutuş).',
      'Dirsekler sabit, kontrollü kaldırın.',
      'Tepede bileği hafif yukarı kıvırın.'
    ],
    tips_en: [
      'Palms facing down (pronated).',
      'Elbows fixed; lift controlled.',
      'Curl the wrist slightly at the top.'
    ],
    commonMistakes: [
      'Bileği aşağı bırakmak',
      'Aşırı kilo ile form kaybı'
    ],
    commonMistakes_en: [
      'Letting the wrist collapse',
      'Form breakdown with heavy weight'
    ]
  },
  {
    id: 'farmers-carry',
    name: 'Farmer\'s Carry',
    name_en: 'Farmer\'s Carry',
    muscleGroupId: 'forearms',
    type: 'compound',
    difficulty: 'Başlangıç',
    difficulty_en: 'Beginner',
    equipment: 'Dumbbell / Kettlebell',
    equipment_en: 'Dumbbell / Kettlebell',
    primaryMuscles: ['Kavrama (Ön Kol)'],
    primaryMuscles_en: ['Grip (Forearms)'],
    secondaryMuscles: ['Trapezius', 'Core', 'Core stabilite'],
    secondaryMuscles_en: ['Traps', 'Core', 'Core stability'],
    repRange: '30-60 saniye yürüyüş',
    repRange_en: '30-60 second walks',
    tips: [
      'Omuzlar geri ve aşağı, dik durun.',
      'Ağırlıkları sallamadan taşıyın.',
      'Adımlar kısa ve kontrollü olsun.'
    ],
    tips_en: [
      'Shoulders back and down, stay tall.',
      'Carry without swinging.',
      'Short, controlled steps.'
    ],
    commonMistakes: [
      'Omuzları kulaklara çekmek',
      'Gövdeyi yana eğmek'
    ],
    commonMistakes_en: [
      'Shrugging shoulders up',
      'Leaning to one side'
    ]
  }
];

export const getExercisesByMuscle = (muscleId) =>
  EXERCISES_DB.filter(ex => ex.muscleGroupId === muscleId);

export const getMuscleGroup = (muscleId) =>
  MUSCLE_GROUPS.find(mg => mg.id === muscleId);

// ============================================================
// Egzersiz eslestirme (tek kaynak): substring yerine
// normalize edilmis tam ad + alias eslestirmesi.
// ============================================================

const ALIASES = {
  'bench-press': ['bench press', 'bench', 'barbell press', 'dumbbell bench press', 'db bench press'],
  'incline-db-press': ['incline press', 'incline bench press'],
  'cable-crossover': ['crossover', 'cable fly', 'fly', 'dumbbell fly', 'pec deck'],
  'chest-dips': ['dips', 'chest dip'],
  'pushup': ['push up', 'pushup', 'sinav', 'sınav', 'şınav'],
  'pull-up': ['pull up', 'pullup', 'barfiks', 'chin up', 'chinup'],
  'barbell-row': ['row', 'barbell row', 'bent over row'],
  'lat-pulldown': ['lat pulldown', 'pulldown', 'pulldown machine'],
  'deadlift': ['deadlift', 'dead lift', 'olu cekis', 'ölü çekiş', 'conventional deadlift'],
  'seated-cable-row': ['cable row', 'seated row'],
  'face-pull-back': ['face pull'],
  'overhead-press': ['overhead press', 'military press', 'omuz press', 'shoulder press', 'ohp'],
  'lateral-raise': ['lateral raise', 'side raise', 'side lateral raise', 'yanraise'],
  'face-pull': ['rear delt face pull', 'reverse fly', 'rear delt fly'],
  'arnold-press': ['arnold'],
  'bicep-curl': ['bicep curl', 'curl', 'dumbbell curl', 'barbell curl', 'standing curl'],
  'hammer-curl': ['hammer'],
  'incline-db-curl': ['incline curl'],
  'preacher-curl': ['preacher', 'scott curl'],
  'tricep-pushdown': ['tricep pushdown', 'pushdown', 'tricep extension', 'triceps pushdown', 'cable pushdown'],
  'overhead-extension': ['overhead extension', 'tricep overhead extension', 'db extension'],
  'skullcrusher': ['skull crusher', 'skullcrusher', 'french press', 'lying extension'],
  'close-grip-bench': ['close grip bench', 'close grip press', 'cg bench'],
  'squat': ['squat', 'back squat', 'barbell squat', 'front squat'],
  'leg-press': ['leg press'],
  'romanian-deadlift': ['romanian deadlift', 'rdl', 'stiff leg deadlift'],
  'bulgarian-split-squat': ['bulgarian', 'split squat', 'lunge', 'forward lunge', 'walking lunge'],
  'leg-extension': ['leg extension', 'extensions'],
  'leg-curl': ['leg curl', 'hamstring curl', 'lying leg curl'],
  'hip-thrust': ['hip thrust', 'barbell hip thrust'],
  'glute-bridge': ['glute bridge', 'bridge'],
  'cable-kickback': ['kickback', 'glute kickback'],
  'hip-abduction': ['abduction', 'abductor'],
  'standing-calf-raise': ['calf raise', 'calf raises', 'standing calf'],
  'seated-calf-raise': ['seated calf'],
  'plank': ['plank', 'front plank'],
  'hanging-leg-raise': ['leg raise', 'hanging leg raises', 'leg raises', 'knee raise'],
  'cable-crunch': ['crunch', 'cable crunch', 'karin crunch'],
  'ab-wheel': ['ab wheel', 'rollout', 'ab roller'],
  'russian-twist': ['russian twist', 'twist'],
  'wrist-curl': ['wrist curl', 'wrist curls'],
  'reverse-curl': ['reverse wrist curl'],
  'farmers-carry': ['farmers walk', 'farmers carry', 'farmer carry']
};

// Türkce karakterleri latincelestir ve noktalama/isaretleri temizle
export const normalizeName = (s) => String(s || '')
  .toLowerCase()
  .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
  .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
  .replace(/İ/g, 'i').replace(/i\u0307/g, 'i')
  .replace(/[^a-z0-9 ]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// On-islenmis arama indeksi (id, normalize edilmis adlar)
const _lookup = EXERCISES_DB.map(ex => ({
  ex,
  names: [ex.name, ex.name_en, ...(ALIASES[ex.id] || [])]
    .filter(Boolean)
    .map(normalizeName)
}));

/**
 * Isimden egzersizi bul. Once tam eslesme (ad + alias),
 * sonra kelime bazli eslesme (sorgunun TUM kelimeleri adda geciyorsa).
 * Bulunamazsa null doner — tahmin yurutme YOK.
 */
export function findExerciseByName(query) {
  if (!query) return null;
  const q = normalizeName(query);
  if (!q) return null;

  // 1) Tam eslesme
  for (const { ex, names } of _lookup) {
    if (names.includes(q)) return ex;
  }

  // 2) Kelime bazli eslesme (tek kelimelik sorgularda guvensiz oldugu icin 2+ kelime sart)
  const qWords = q.split(' ');
  if (qWords.length >= 2) {
    for (const { ex, names } of _lookup) {
      if (names.some(n => qWords.every(w => n.includes(w)))) return ex;
    }
  }

  return null;
}

// Radar/kas analizi icin kelime-siniri (word boundary) tabanli yedek eslesme.
// 'lat' artik 'lateral' icinde yakalanamaz; sadece bagimsiz kelime olarak.
const _KEYWORD_FALLBACK = [
  // Cok kelimeli ozel durumlar once
  ['leg raise', 'core'], ['leg curl', 'legs'], ['leg extension', 'legs'], ['leg press', 'legs'],
  ['calf raise', 'calves'], ['hip thrust', 'glutes'], ['face pull', 'back'],
  ['good morning', 'back'], ['hip thrust', 'glutes'],
  ['nordic curl', 'legs'], ['glute ham', 'legs'],
  // Omuz
  ['overhead', 'shoulders'], ['military', 'shoulders'], ['lateral', 'shoulders'],
  ['shoulder', 'shoulders'], ['omuz', 'shoulders'], ['raise', 'shoulders'], ['delt', 'shoulders'], ['arnold', 'shoulders'],
  ['upright row', 'shoulders'],
  // Gogus
  ['bench', 'chest'], ['fly', 'chest'], ['chest', 'chest'], ['gogus', 'chest'], ['sinav', 'chest'], ['pushup', 'chest'], ['push up', 'chest'], ['crossover', 'chest'], ['dip', 'chest'],
  ['pec deck', 'chest'], ['butterfly', 'chest'], ['pullover', 'chest'], ['pull over', 'chest'],
  // Sirt
  ['pulldown', 'back'], ['barfiks', 'back'], ['pullup', 'back'], ['pull up', 'back'], ['deadlift', 'back'],
  ['row', 'back'], ['lat', 'back'], ['back', 'back'], ['sirt', 'back'], ['shrug', 'back'], ['trap', 'back'],
  ['hyperextension', 'back'], ['back extension', 'back'], ['chin up', 'back'], ['chinup', 'back'],
  ['trapez', 'back'], ['cekilis', 'back'], ['dominant', 'back'],
  // Bacak
  ['squat', 'legs'], ['lunge', 'legs'], ['rdl', 'legs'], ['romanian', 'legs'], ['leg', 'legs'],
  ['bacak', 'legs'], ['quad', 'legs'], ['hamstring', 'legs'], ['calf', 'calves'], ['baldir', 'calves'],
  ['hack squat', 'legs'], ['sumo', 'legs'],
  // Kalca
  ['glute', 'glutes'], ['hip', 'glutes'], ['abduction', 'glutes'], ['kalca', 'glutes'], ['kickback', 'glutes'],
  ['glute bridge', 'glutes'],
  // Kollar
  ['tricep', 'triceps'], ['bicep', 'biceps'], ['pushdown', 'triceps'], ['skullcrusher', 'triceps'],
  ['hammer', 'biceps'], ['preacher', 'biceps'], ['curl', 'biceps'], ['arm', 'biceps'], ['kol', 'biceps'],
  ['wrist', 'forearms'], ['grip', 'forearms'], ['farmers', 'forearms'], ['dead hang', 'forearms'],
  // Core
  ['plank', 'core'], ['crunch', 'core'], ['situp', 'core'], ['sit up', 'core'], ['abs', 'core'],
  ['core', 'core'], ['karin', 'core'], ['mekik', 'core'], ['twist', 'core'], ['rollout', 'core'],
  ['mountain climber', 'core'], ['climber', 'core'], ['hanging knee', 'core'],
  // Tek kelimelik dogrudan grup adlari (AI bazen boyle uretir)
  ['triceps', 'triceps'], ['biceps', 'biceps'], ['forearm', 'forearms'],
  // En genel (en son)
  ['press', 'chest'], ['push', 'chest'], ['extension', 'triceps'], ['carry', 'forearms']
];

/**
 * Verilen egzersiz adi icin kas grup ID'sini dondurur.
 * Once veritabani eslestirmesi, sonra kelime-siniri yedegi.
 * Hiçbir sey bulunamazsa null.
 */
export function findMuscleGroupIdForExercise(query) {
  const db = findExerciseByName(query);
  if (db) return db.muscleGroupId;

  const q = normalizeName(query);
  if (!q) return null;

  for (const [keyword, group] of _KEYWORD_FALLBACK) {
    const re = new RegExp(`\\b${keyword}\\b`);
    if (re.test(q)) return group;
  }
  return null;
}

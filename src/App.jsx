import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Play, Plus, ArrowLeft, Trash2, Check, Bot, Activity, Cloud, Wand2, Timer, PersonStanding } from 'lucide-react';
import useLocalStorage from './hooks/useLocalStorage';
import ErrorBoundary from './components/ErrorBoundary';
import AICoachOnboarding from './components/aicoach/AICoachOnboarding';
import CustomProgramBuilder from './components/dashboard/CustomProgramBuilder';
import ActiveWorkoutView from './components/workout/ActiveWorkoutView';
import ScoreTracker from './components/dashboard/ScoreTracker';
import CoachInsightFeed from './components/dashboard/CoachInsightFeed';
import WorkoutCalendar from './components/dashboard/WorkoutCalendar';
import StrengthCurves from './components/dashboard/StrengthCurves';
import CheckInModal from './components/dashboard/CheckInModal';
import ProgramWizard from './components/workout/ProgramWizard';
import SeasonCard from './components/dashboard/SeasonCard';
import DailyQuestsCard from './components/dashboard/DailyQuestsCard';
import { seasonInfo, SEASON_EPOCH, leagueForSP } from './utils/season';
import SavedProgramPreview from './components/dashboard/SavedProgramPreview';
import WorkoutProgressCharts from './components/dashboard/WorkoutProgressCharts';
import WorkoutHeatmap from './components/dashboard/WorkoutHeatmap';
import StrengthStandards from './components/dashboard/StrengthStandards';
import WeeklyAiReport from './components/dashboard/WeeklyAiReport';
import WorkoutTemplates from './components/dashboard/WorkoutTemplates';
import RecoveryWidget from './components/dashboard/RecoveryWidget';
import BodyTracker from './components/profile/BodyTracker';
import NutritionTracker from './components/nutrition/NutritionTracker';
import NutritionSummary from './components/dashboard/NutritionSummary';
import WaterTrackerWidget from './components/dashboard/WaterTrackerWidget';
import PrHistoryPage from './components/dashboard/PrHistoryPage';
import BottomNav from './components/ui/BottomNav';
import OnboardingOverlay from './components/ui/OnboardingOverlay';
import { ToastProvider, useToast } from './components/ui/ToastProvider';
import { startReminderTicker } from './utils/notificationScheduler';
import HiitTimerView from './components/workout/HiitTimerView';
import MobilityView from './components/workout/MobilityView';
import LevelUpModal from './components/ui/LevelUpModal';
import ShopPage from './components/shop/ShopPage';
import EvolutionModal from './components/shop/EvolutionModal';
import BadgeUnlockModal from './components/ui/BadgeUnlockModal';
import AdminPanel from './components/admin/AdminPanel';
import AnatomyLibrary from './components/anatomy/AnatomyLibrary';
import AuthScreen from './components/auth/AuthScreen';
import { BADGE_LIBRARY } from './data/badges';
import { applyTheme } from './data/themes';
import { migrateLevelData, levelProgress } from './utils/levelSystem';
import { countAllTimePRs } from './utils/prTracker';
import { subscribeFriendships } from './utils/friends';
import { calcWeeklyStreak } from './utils/consistency';
import { getActive } from './utils/inventory';
import { getWheelState } from './utils/gacha';
import './App.css';
import { getRank } from './utils/ranks';import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { error as logError, log as logInfo } from './utils/logger';

function AppContent() {
  const { t, lang } = useLanguage();
  const { haptic } = useToast();
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'workout' | 'aicoach' | 'activeAiWorkout' | 'auth'
  const [currentUser, setCurrentUser] = useState(null);
  const [hasOnboarded, setHasOnboarded] = useLocalStorage('gym_app_onboarded', false);

  useEffect(() => {
    if (!auth) return;
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
      });
      return () => unsubscribe();
    } catch (err) {
      logError("Firebase auth error:", err);
    }
  }, []);

  const profileClickTimeout = useRef(null);

  // Cleanup: eğer kullanıcı tek tıkladıktan sonra component unmount olursa,
  // bekleyen timeout state'i güncellemeye çalışmasın.
  useEffect(() => {
    return () => {
      if (profileClickTimeout.current !== null) {
        clearTimeout(profileClickTimeout.current);
        profileClickTimeout.current = null;
      }
    };
  }, []);

  // Profil kartina artik tek tikla navigasyon YOK (alt nav var);
  // sadece cift tikla admin paneline giris korunuyor.
  const handleProfileClick = () => {
    if (profileClickTimeout.current !== null) {
      // Cift tik -> admin paneli
      clearTimeout(profileClickTimeout.current);
      profileClickTimeout.current = null;
      setCurrentView('admin');
    } else {
      profileClickTimeout.current = setTimeout(() => {
        profileClickTimeout.current = null;
      }, 300);
    }
  };

  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showBadgeUnlockModal, setShowBadgeUnlockModal] = useState(null);

  const [userName, setUserName] = useLocalStorage('gym_app_user_name', 'Athlete');

  const [userCoins, setUserCoins] = useLocalStorage('gym_app_coins', 0);
  const [unlockedThemes, setUnlockedThemes] = useLocalStorage('gym_app_unlocked_themes', ['default']);
  const [activeTheme, setActiveTheme] = useLocalStorage('gym_app_theme', 'default');

  // Storage State
  const [workoutHistory, setWorkoutHistory] = useLocalStorage('gym_app_history', []);
  // lastWorkoutDate yalnizca yazilir (ActiveWorkoutView setLastWorkoutDate);
  // okuma tarafı yok, bu yuzden destructure edilmemis birakilir.
  const [, setLastWorkoutDate] = useLocalStorage('gym_app_last_date', null);
  const [savedAiProgram, setSavedAiProgram] = useLocalStorage('gym_app_ai_program', null);
  const [userXP, setUserXP] = useLocalStorage('gym_app_xp', 0);
  const [userLevel, setUserLevel] = useLocalStorage('gym_app_level', 1);
  const [pinnedBadges, setPinnedBadges] = useLocalStorage('gym_app_pinned_badges', []);
  const [unlockedBadges, setUnlockedBadges] = useLocalStorage('gym_app_unlocked_badges', []);

  // Haftalik hedef: kac gun antrenman (dinlenme gunleri seriyi bozmaz)
  const [weeklyGoal, setWeeklyGoal] = useLocalStorage('gym_app_weekly_goal', 3);

  // --- DUKKAN EKONOMI STATE'LERI ---
  // Envanter (boost stoklari), kozmetikler, dostlar, pity, cark.
  const [inventory, setInventory] = useLocalStorage('gym_app_inventory', {});
  const [ownedCosmetics, setOwnedCosmetics] = useLocalStorage('gym_app_cosmetics', []);
  const [activeCosmetics, setActiveCosmetics] = useLocalStorage('gym_app_cosmetics_active', {});
  const [buddyCollection, setBuddyCollection] = useLocalStorage('gym_app_buddies', {});
  const [activeBuddyId, setActiveBuddyId] = useLocalStorage('gym_app_buddy_active', null);
  const [gachaPity, setGachaPity] = useLocalStorage('gym_app_gacha_pity', {});
  const [wheelState, setWheelState] = useLocalStorage('gym_app_wheel', null);
  // FAZ 1d: gunluk check-in (ruh hali + agri haritasi) — opsiyonel
  const [checkinData, setCheckinData] = useLocalStorage('gym_app_checkin', null);
  // FAZ 5a: sezon durumu (SP + lig + gecmis)
  const [seasonData, setSeasonData] = useLocalStorage('gym_app_season', null);
  // FAZ 5b: gunluk gorev tahsil durumu
  const [questsData, setQuestsData] = useLocalStorage('gym_app_quests', null);
  // DoN (Double or Nothing): gunluk zincir hakki + istatistik
  const [donData, setDonData] = useLocalStorage('gym_app_don', null);
  // Gorev baglami: bugun mobilite/HIIT akisi tamamlandi mi (isaretler)
  // Yazma islemi MobilityView/HiitTimerView dogrudan localStorage'a yapar;
  // burada sadece okunan deger gorevlere beslenir.
  const [activityMarks] = useLocalStorage('gym_app_activity_marks', null);
  // FAZ 3: program sihirbazi
  const [showWizard, setShowWizard] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  // Evrim kutlamasi: { buddyId, newXp } / null (antrenman + dukkan ortak)
  const [buddyEvolution, setBuddyEvolution] = useState(null);

  // STREAK ARTIK TURETILMIS DEGER: workoutHistory'den haftalik seri hesaplanir.
  // Eskiden gunluk Duolingo serisi saklaniyordu; artik ayri depolama yok.
  // DONDURUCU: hedefi kacirilan haftayi stok varsa otomatik korur; harcanan
  // dondurucular freezeData'ya yazilir (ayni hafta tekrar harcanmaz).
  const [freezeData, setFreezeData] = useLocalStorage('gym_app_freeze', { weeks: [] });
  const freezeKey = (freezeData?.weeks || []).join(',');
  const { streak, weeksThisWeek, freezeUsed } = React.useMemo(
    () => calcWeeklyStreak(workoutHistory, weeklyGoal, { weeks: freezeData?.weeks || [], stock: inventory?.freeze ?? 0 }),
    // freezeKey ile referans degismelerine karsi stabil bagimlilik
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workoutHistory, weeklyGoal, freezeKey, inventory?.freeze]
  );

  // Hesap sirasinda sanal harcanan donduruculari kalici yap + stoktan dus
  useEffect(() => {
    if (!freezeUsed || freezeUsed.length === 0) return;
    setFreezeData((prev) => ({ weeks: [...new Set([...(prev?.weeks || []), ...freezeUsed])].slice(-52) }));
    setInventory((prev) => {
      const cur = (prev && prev.freeze) || 0;
      if (cur <= 0) return prev;
      const next = { ...prev };
      const used = freezeUsed.length;
      if (cur - used <= 0) delete next.freeze; else next.freeze = cur - used;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sadece yeni harcama olunca
  }, [freezeUsed.join(',')]);

  // --- FAZ 1d yardimcilari: check-in veri yapisi ---
  // checkinData: { entries: [{ date, mood, pain }] } — en yeni ilk
  const todayStr = new Date().toISOString().split('T')[0];
  const checkinToday = (data) => {
    const e = data?.entries?.[0];
    if (!e) return false;
    return (new Date(e.date).toISOString().split('T')[0]) === todayStr;
  };
  const checkinToPainData = (data) => {
    const e = data?.entries?.[0];
    if (!e || !e.pain) return null;
    const vals = Object.values(e.pain).map(v => parseInt(v) || 0);
    if (vals.length === 0) return null;
    const maxLevel = Math.max(...vals);
    const maxRegion = Object.keys(e.pain).find(k => (parseInt(e.pain[k]) || 0) === maxLevel);
    return { pain: e.pain, maxLevel, maxRegion };
  };
  const saveCheckIn = (entry, data, setter) => {
    setter({ entries: [entry, ...(data?.entries || [])].slice(0, 60) });
  };

  // FAZ 5a: sezon baslatma + sezon degistiyse rollover. Ilk acilista sezon 1'e kayit.
  const season = seasonInfo(SEASON_EPOCH);
  useEffect(() => {
    if (!seasonData) {
      setSeasonData({ seasonNumber: season.number, seasonSP: 0, totalSP: 0, league: 'bronze', history: [] });
    } else if (seasonData.seasonNumber !== season.number) {
      // yeni sezon: SP sifirla, totalSP'ye ekle, lig koru (dusus yok)
      const total = (seasonData.totalSP || 0) + (seasonData.seasonSP || 0);
      setSeasonData({
        seasonNumber: season.number,
        seasonSP: 0,
        totalSP: total,
        league: leagueForSP(total).id,
        history: [...(seasonData.history || []), { season: seasonData.seasonNumber, sp: seasonData.seasonSP || 0, league: seasonData.league || 'bronze' }]
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season.number]);

  const [completedDays, setCompletedDays] = useLocalStorage('gym_app_completed_days', []);
  const [lastResetDate, setLastResetDate] = useLocalStorage('gym_app_last_reset_date', null);

  // UI / Routing State
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [dashboardTab, setDashboardTab] = useLocalStorage('gym_app_dashboard_tab', 'today');
  const [activeAiWorkoutDayIdx, setActiveAiWorkoutDayIdx] = useLocalStorage('gym_app_active_day_idx', null);
  const [activeAiWorkoutDayParams, setActiveAiWorkoutDayParams] = useLocalStorage('gym_app_active_day_params', null);

  // Nutrition State for Dashboard Summary
  const [nutritionData] = useLocalStorage('gym_app_nutrition_v2', {});

  // --- THEME EFFECT ---
  // Eski 90 satırlık if/else zinciri yerine lookup tablosu.
  // Yeni tema eklemek için src/data/themes.js düzenlenir; bu effect sabit.
  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  // --- SEVIYE SISTEMI MIGRASYONU (v1 dogrusal -> v2 egrisel) ---
  // Tek seferlik: eski (level, xp) ikilisini toplam XP'ye cevirip yeni
  // egriden seviye bulur. Kullanici XP kaybetmez, seviye ancak yukselir.
  const [levelSysVersion, setLevelSysVersion] = useLocalStorage('gym_app_level_sys_version', 0);
  useEffect(() => {
    if (levelSysVersion >= 2) return;
    const migrated = migrateLevelData(userLevel, userXP, levelSysVersion);
    if (migrated) {
      setUserLevel(migrated.level);
      setUserXP(migrated.xp);
    }
    setLevelSysVersion(2);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tek seferlik migrasyon
  }, [levelSysVersion]);

  // --- ARKADAS SAYISI (rozet: Ekip Ruhu) ---
  // FriendsCard kendi aboneligini tuttugu icin burada hafif bir dinleyici
  // acilir; sadece girisli kullanici icin calisir. Cikista senkron setState
  // yerine abonelik 0'la savunmasiz kalir; rozet kosulu 0 kabul eder.
  const [friendCountForBadges, setFriendCountForBadges] = useState(0);
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeFriendships((uids) => setFriendCountForBadges(uids.length));
    return () => unsub();
  }, [currentUser]);

  // --- PWA HATIRLATMA TICKER'I ---
  // Uygulama acikken antrenman/su hatirlatmalarini kontrol eder
  useEffect(() => {
    const stop = startReminderTicker();
    return stop;
  }, []);

  // --- DAVET LINKI (?add=KOD) ---
  // Arkadas linkiyle gelen kullanici giris yaptiginda kodu isle:
  // profil olustur, koda sahip kisiye otomatik arkadaslik istegi gonder,
  // URL'den parametreyi temizle (yenilemede tekrar gondermesin).
  useEffect(() => {
    if (!currentUser) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const code = (params.get('add') || '').trim().toUpperCase();
      if (code.length !== 6) return;
      window.history.replaceState({}, '', window.location.pathname);
      import('./utils/friends').then(({ sendRequest }) => {
        sendRequest(code).then((res) => {
          // Sonuc sessiz islenir; hata durumunda kullanici FriendsCard'tan
          // tekrar deneyebilir, burada UI bozulmamali.
          if (res && res.error) logInfo('Davet kodu sonucu:', res.error);
        });
      });
    } catch (err) {
      logError('Davet kodu islenemedi:', err);
    }
  }, [currentUser]);

  // --- LEVEL UP ---
  // Modal acik oldugu surece onceki seviye state'te saklanir (render'da ref
  // okuma kuralina takilmamak icin); kapatilinca temizlenir.
  const prevLevelRef = useRef(userLevel);
  const [levelUpFrom, setLevelUpFrom] = useState(null);
  const closeLevelUpModal = useCallback(() => {
    prevLevelRef.current = userLevel;
    setShowLevelUpModal(false);
    setLevelUpFrom(null);
  }, [userLevel]);

  // --- LEVEL UP EFFECT ---
  // Not: localStorage'a yansitma yerine ref kullaniyoruz; set-state-in-effect
  // kuralina gore modal acma tek seferlik senkronizasyon isidir.
  useEffect(() => {
    if (prevLevelRef.current > 0 && userLevel > prevLevelRef.current) {
      setLevelUpFrom(prevLevelRef.current); // modalda rutbe atlama kontrolu icin
      setShowLevelUpModal(true);
    }
    prevLevelRef.current = userLevel;
  }, [userLevel]);

  // --- BADGE UNLOCK EFFECT ---
  // Rozetler localStorage ile senkronize edilir; burada setState external store
  // guncellemesi oldugu icin kural devre disi birakildi.
  useEffect(() => {
    const hist = workoutHistory || [];
    // Su hedefi gunleri: water kayitlarinin gecmisi ayri tutuluyor
    let waterGoalDays = 0;
    try {
      const raw = localStorage.getItem('gym_app_water_history');
      if (raw) waterGoalDays = (JSON.parse(raw) || []).length;
    } catch { /* bozuk kayit yok sayilir */ }

    const stats = {
      totalWorkouts: new Set(hist.map(w => new Date(w.date).toDateString())).size,
      streak: streak,
      aiWorkoutsCompleted: new Set(hist.filter(w => w.isAiGenerated).map(w => new Date(w.date).toDateString())).size,
      history: hist,
      level: userLevel,
      // v2 rozet istatistikleri
      totalVolume: hist.reduce((s, w) => s + (parseFloat(w.totalWeight) || 0), 0),
      totalSets: hist.reduce((s, w) => s + (parseInt(w.sets) || 0), 0),
      totalReps: hist.reduce((s, w) => s + (parseInt(w.totalReps) || 0), 0),
      uniqueExercises: new Set(hist.map(w => w.exercise).filter(Boolean)).size,
      prCount: countAllTimePRs(hist),
      waterGoalDays,
      friendCount: friendCountForBadges
    };

    const newlyUnlocked = BADGE_LIBRARY.filter(badge =>
       !unlockedBadges.includes(badge.id) && badge.condition(stats)
    );

    if (newlyUnlocked.length > 0) {
       const newIds = newlyUnlocked.map(b => b.id);
       setUnlockedBadges(prev => {
           if (newIds.some(id => !prev.includes(id))) {
               return [...prev, ...newIds];
           }
           return prev;
       });

       if (!showBadgeUnlockModal) {
           // Rozet kilit acma bildirimi; localStorage senkronizasyonu parçasi
           // eslint-disable-next-line react-hooks/set-state-in-effect
           setShowBadgeUnlockModal(newlyUnlocked[0]);
       }
    }
  }, [workoutHistory, streak, userLevel, unlockedBadges, showBadgeUnlockModal, setUnlockedBadges, friendCountForBadges]);

  // --- Reset Completed Days on Monday ---
  // Bugün (YYYY-MM-DD) ve gün-of-week render başına bir kez hesaplanır;
  // eski kod new Date() çağrısını her effect çalıştığında yineliyordu,
  // bu da gece yarısı çift reset riski taşıyordu. Şimdi bir kez memoize.
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    // Monday is 1
    if (today.getDay() === 1 && lastResetDate !== todayStr) {
      setCompletedDays([]);
      setLastResetDate(todayStr);
    }
  }, [lastResetDate, setCompletedDays, setLastResetDate]);




  // -------------------------

  const clearAiProgram = () => {
    setSavedAiProgram(null);
    setCompletedDays([]);
  };



  const handleUpdateAiProgram = (dayIdx, exIdx, field, value) => {
    // Önceki kod shallow copy yapıp nested mutate ediyordu (aliasing bug riski).
    // structuredCycle güvenli derin kopya sağlar.
    setSavedAiProgram(prev => {
      if (!prev?.days?.[dayIdx]?.exercises?.[exIdx]) return prev;
      // Modern tarayıcılarda structuredClone var; geri düşür JSON round-trip.
      const clone = (typeof structuredClone === 'function')
        ? structuredClone(prev)
        : JSON.parse(JSON.stringify(prev));
      clone.days[dayIdx].exercises[exIdx][field] = value;
      return clone;
    });
  };

  // --- LIVE AI WORKOUT LOGIC ---
  const startActiveAiWorkout = (dayIdx, dayParams) => {
    setActiveAiWorkoutDayIdx(dayIdx);
    setActiveAiWorkoutDayParams(dayParams);
    setCurrentView('activeAiWorkout');
  };
  // ------------------------------

  // --- ANDROID/HARDWARE BACK BUTTON ---
  // Görünümler history'ye TEK girdi olarak işlenir; cihaz geri tuşu
  // (Android) veya tarayıcı geri tuşu her zaman dashboard'a döner,
  // uygulamayı kapatmaz. View'dan view'a geçiş replaceState ile güncellenir
  // (geri tuşu yine tek adımda dashboard'a iner).
  const viewRef = useRef(currentView);
  const currentViewRef = useRef(currentView);
  useEffect(() => { currentViewRef.current = currentView; }, [currentView]);

  useEffect(() => {
    if (viewRef.current === currentView) return;
    if (currentView === 'dashboard') {
      // Butonla dashboard'a dönüş: kesişen girdiyi temizle ki geri tuşu
      // uygulamadan çıkmaya (veya önceki sayfaya) devam etsin.
      if (window.history.state?.gymView) window.history.back();
    } else if (viewRef.current !== 'dashboard' && window.history.state?.gymView) {
      window.history.replaceState({ gymView: currentView }, '');
    } else {
      window.history.pushState({ gymView: currentView }, '');
    }
    viewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    const onPop = () => {
      viewRef.current = 'dashboard';
      if (currentViewRef.current !== 'dashboard') setCurrentView('dashboard');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  // ------------------------------------

  // Alt navigasyon: sekmeye gec veya profil ekranina git
  const handleNavSelectTab = (tabId) => {
    haptic(8);
    setDashboardTab(tabId);
    if (currentView !== 'dashboard') setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavGoProfile = () => {
    haptic(8);
    setCurrentView('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Evrim kutlamasi: antrenman ya da dukkan beslemesinden tetiklenir
  const evolutionModalEl = buddyEvolution && (
    <EvolutionModal
      buddyId={buddyEvolution.buddyId}
      newXp={buddyEvolution.newXp}
      onClose={() => setBuddyEvolution(null)}
    />
  );

  // Active name-style cosmetic (dashboard top bar)
  const activeNameStyle = getActive(activeCosmetics, ownedCosmetics, 'nameStyle');

  // Alt nav her ekranda gorunur; aktif antrenman ve giris akisinda gizlenir
  const showBottomNav = currentView !== 'activeAiWorkout' && currentView !== 'auth';
  const bottomNavEl = showBottomNav && (
    <BottomNav
      currentView={currentView}
      dashboardTab={dashboardTab}
      onGoHome={handleNavGoProfile}
      onSelectTab={handleNavSelectTab}
      onOpenShop={() => setCurrentView('shop')}
      freeSpinAvailable={getWheelState(wheelState).freeAvailable}
    />
  );

  // Framer Motion sayfa geçiş varyasyonları
  const pageVariants = {
    initial: { opacity: 1, y: -20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
    exit: { opacity: 1, y: 20, transition: { duration: 0.15 } }
  };

  if (currentView !== 'dashboard') {
    const viewContent = (() => {
      if (currentView === 'activeAiWorkout' && activeAiWorkoutDayParams) {
        return (
          <ActiveWorkoutView
            activeAiWorkoutDayIdx={activeAiWorkoutDayIdx}
            activeAiWorkoutDayParams={activeAiWorkoutDayParams}
            setCurrentView={setCurrentView}
            workoutHistory={workoutHistory}
            setWorkoutHistory={setWorkoutHistory}
            weeklyGoal={weeklyGoal}
            setLastWorkoutDate={setLastWorkoutDate}
            completedDays={completedDays}
            setCompletedDays={setCompletedDays}
            savedAiProgram={savedAiProgram}
            setSavedAiProgram={setSavedAiProgram}
            userXP={userXP}
            setUserXP={setUserXP}
            userLevel={userLevel}
            setUserLevel={setUserLevel}
            inventory={inventory}
            setInventory={setInventory}
            buddyCollection={buddyCollection}
            setBuddyCollection={setBuddyCollection}
            activeBuddyId={activeBuddyId}
            activePrEffect={getActive(activeCosmetics, ownedCosmetics, 'prEffect')?.id}
            onBuddyEvolved={(buddyId, newXp) => setBuddyEvolution({ buddyId, newXp })}
            userCoins={userCoins}
            setUserCoins={setUserCoins}
          />
        );
      }
      if (currentView === 'aicoach') {
        return <AICoachOnboarding setSavedAiProgram={setSavedAiProgram} setCurrentView={setCurrentView} />;
      }
      if (currentView === 'auth') {
        return <AuthScreen onBack={() => setCurrentView('dashboard')} onLoginSuccess={() => setCurrentView('dashboard')} setUserName={setUserName} />;
      }
      if (currentView === 'profile') {
        return (
          <BodyTracker
            currentUser={currentUser}
            onLoginClick={() => setCurrentView('auth')}
            userXP={userXP}
            userLevel={userLevel}
            workoutHistory={workoutHistory}
            streak={streak}
            weeklyGoal={weeklyGoal}
            setWeeklyGoal={setWeeklyGoal}
            pinnedBadges={pinnedBadges}
            setPinnedBadges={setPinnedBadges}
            unlockedBadges={unlockedBadges}
            userName={userName}
            setUserName={setUserName}
            activeBuddyId={activeBuddyId}
            buddyCollection={buddyCollection}
            setBuddyCollection={setBuddyCollection}
            activeCosmetics={activeCosmetics}
            setActiveCosmetics={setActiveCosmetics}
            ownedCosmetics={ownedCosmetics}
            inventory={inventory}
            setInventory={setInventory}
            onOpenShop={() => setCurrentView('shop')}
       
            onBuddyEvolved={(buddyId, newXp) => setBuddyEvolution({ buddyId, newXp })}   />
        );
      }
      if (currentView === 'shop') {
        return (
          <ShopPage
            onBack={() => setCurrentView('dashboard')}
            userCoins={userCoins}
            setUserCoins={setUserCoins}
            inventory={inventory}
            setInventory={setInventory}
            ownedCosmetics={ownedCosmetics}
            setOwnedCosmetics={setOwnedCosmetics}
            activeCosmetics={activeCosmetics}
            setActiveCosmetics={setActiveCosmetics}
            buddyCollection={buddyCollection}
            setBuddyCollection={setBuddyCollection}
            activeBuddyId={activeBuddyId}
            setActiveBuddyId={setActiveBuddyId}
            gachaPity={gachaPity}
            setGachaPity={setGachaPity}
            wheelState={wheelState}
            setWheelState={setWheelState}
            setUserXP={setUserXP}
            userLevel={userLevel}
            unlockedThemes={unlockedThemes}
            setUnlockedThemes={setUnlockedThemes}
            activeTheme={activeTheme}
            setActiveTheme={setActiveTheme}
            applyThemeFn={applyTheme}
          />
        );
      }
      if (currentView === 'nutrition') {
        return <NutritionTracker onBack={() => setCurrentView('dashboard')} />;
      }
      if (currentView === 'hiit') {
        return <HiitTimerView onBack={() => setCurrentView('dashboard')} />;
      }
      if (currentView === 'mobility') {
        return <MobilityView onBack={() => setCurrentView('dashboard')} />;
      }
      if (currentView === 'prhistory') {
        return <PrHistoryPage workoutHistory={workoutHistory} onBack={() => setCurrentView('dashboard')} />;
      }
      if (currentView === 'admin') {
        return (
          <AdminPanel
            onBack={() => setCurrentView('dashboard')}
            userXP={userXP} setUserXP={setUserXP}
            userLevel={userLevel} setUserLevel={setUserLevel}
            userCoins={userCoins} setUserCoins={setUserCoins}
            setWorkoutHistory={setWorkoutHistory}
            setPinnedBadges={setPinnedBadges}
            setCompletedDays={setCompletedDays}
            setSavedAiProgram={setSavedAiProgram}
            setUnlockedThemes={setUnlockedThemes}
            setActiveTheme={setActiveTheme}
          />
        );
      }
      if (currentView === 'anatomy') {
        return <AnatomyLibrary onBack={() => setCurrentView('dashboard')} />;
      }
      return null;
    })();

    if (viewContent) {
      // Her view kendi ErrorBoundary'sine sahip olur; bir ekran çökerse
      // tüm uygulama düşmez, kullanıcı dashboard'a dönebilir.
      return (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ width: '100%' }}
            >
              <ErrorBoundary
                onReset={() => setCurrentView('dashboard')}
                fallbackMessage={t('error_generic_title')}
                buttonLabel={t('btn_back')}
              >
                {viewContent}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
          {evolutionModalEl}
      {bottomNavEl}
        </>
      );
    }
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key="dashboard"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ width: '100%' }}
        >
        <div className="app-container">
          <ErrorBoundary>
            {/* Top Bar: mobilde tek kompakt kart — avatar+isim solda, coin sagda */}
            <header className="top-bar fade-in" style={{ animationDelay: '0s' }}>
              <div
                onClick={handleProfileClick}
                style={{
                  cursor: 'pointer',
                  flex: '1 1 auto',
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.6rem 0.9rem',
                  borderRadius: '16px',
                  background: 'rgba(0, 195, 255, 0.1)',
                  border: '1px solid rgba(0, 195, 255, 0.3)',
                  transition: 'all 0.3s ease',
                  userSelect: 'none',
                  touchAction: 'manipulation'
                }}
                title={t('app_admin_tooltip')}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 195, 255, 0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 195, 255, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div className="avatar" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                  <Trophy size={20} />
                </div>

                <div className="greeting" style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minWidth: 0 }}>
                  <h1 style={{ fontSize: '1.05rem', margin: 0, color: activeNameStyle ? activeNameStyle.cssColor : 'var(--text-primary)', textShadow: activeNameStyle ? activeNameStyle.cssTextShadow : undefined, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</h1>
                  {/* Rank + seviye + XP tek satırda */}
                  {(() => {
                    const currentRank = getRank(userLevel) || { icon: '🛡️', color: '#fff', title_tr: '...', title_en: '...' };
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', minWidth: 0 }}>
                        <span style={{ flexShrink: 0 }}>{currentRank.icon}</span>
                        <span style={{ color: currentRank.color, fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lang === 'tr' ? currentRank.title_tr : currentRank.title_en}
                        </span>
                        <span style={{ color: '#fff', flexShrink: 0 }}>{t('level')} {userLevel}</span>
                        <span style={{ color: 'var(--text-light)', opacity: 0.8, marginLeft: 'auto', flexShrink: 0, fontSize: '0.7rem' }}>
                          {userXP} XP
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Coin: profil kartının içinde, sağda. Ucretsiz cark varsa 🎡 isareti yanip soner */}
                <div
                  onClick={(e) => { e.stopPropagation(); setCurrentView('shop'); }}
                  style={{ background: 'rgba(255, 215, 0, 0.1)', border: '1px solid #ffd700', borderRadius: '12px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#ffd700', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0, marginLeft: '4px' }}
                  title={t('app_shop_tooltip')}
                >
                  {getWheelState(wheelState).freeAvailable && (
                    <span style={{ animation: 'wheelHint 1.2s ease-in-out infinite', fontSize: '0.95rem' }} title={t('shop_wheel_free_ready')}>🎡</span>
                  )}
                  <span>🪙</span> {userCoins}
                </div>
              </div>

              {/* Sabitlenmis rozetler: PC'de yanda, mobilde altta */}
              {pinnedBadges.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                  {pinnedBadges.map(badgeId => {
                    const bInfo = BADGE_LIBRARY.find(b => b.id === badgeId);
                    if (!bInfo) return null;
                    return (
                      <div key={bInfo.id} title={lang === 'tr' ? bInfo.title : bInfo.title_en} style={{ fontSize: '1.3rem', background: 'rgba(0, 195, 255, 0.1)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(0, 195, 255, 0.3)' }}>
                        {bInfo.icon}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* XP ilerleme çubuğu: tam genişlik ince şerit (v2 eğrisel sistem) */}
              {(() => {
                const { need, percent } = levelProgress(userXP, userLevel);
                return (
                  <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }} title={`${userXP}/${need} XP`}>
                    <div style={{
                      height: '100%',
                      width: `${percent}%`,
                      background: 'linear-gradient(90deg, #00c3ff, #ff0088)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }}></div>
                  </div>
                );
              })()}
            </header>

        {/* ============ BUGÜN ============ */}
        {dashboardTab === 'today' && (
          <div className="dash-grid">
            {/* Sol kolon: skor + gunun oyunsal kartlari */}
            <div className="dash-main" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ScoreTracker
                workoutHistory={workoutHistory}
                streak={streak}
                weeklyGoal={weeklyGoal}
                weeksThisWeek={weeksThisWeek}
                flameColor={getActive(activeCosmetics, ownedCosmetics, 'flame')?.color || '#ffa502'}
              />
              <DailyQuestsCard workoutHistory={workoutHistory} userName={userName} userCoins={userCoins} setUserCoins={setUserCoins} userXP={userXP} setUserXP={setUserXP} questsData={questsData} setQuestsData={setQuestsData} donData={donData} setDonData={setDonData} marks={activityMarks?.day === new Date().toISOString().split('T')[0] ? activityMarks.marks : {}} />
              <SeasonCard seasonData={seasonData} workoutHistory={workoutHistory} userCoins={userCoins} setUserCoins={setUserCoins} setSeasonData={setSeasonData} />
            </div>

            {/* Sag kolon: gunluk bakim (beslenme/su/toparlanma/check-in) */}
            <div className="dash-side" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <NutritionSummary
                nutritionData={nutritionData}
                onClick={() => setCurrentView('nutrition')}
              />
              <WaterTrackerWidget />
              <RecoveryWidget workoutHistory={workoutHistory} />
              <motion.button
                onClick={() => setShowCheckIn(true)}
                className="neon-btn"
                style={{ background: 'rgba(255, 107, 129, 0.1)', borderColor: '#ff6b81', color: '#ff6b81', boxShadow: 'none', fontSize: '0.9rem' }}
                whileTap={{ scale: 0.97 }}
              >
                {checkinToday(checkinData) ? '✅ ' + t('checkin_done_btn') : '🩺 ' + t('checkin_open_btn')}
              </motion.button>
            </div>

            {/* AI Koc: grid disinda tam genislik (mobil + PC ayni gorunum) */}
            <motion.button
              onClick={() => setCurrentView('aicoach')}
              className="neon-btn btn-accent span-both"
              style={{ background: 'rgba(0, 195, 255, 0.1)', borderColor: '#00c3ff', color: '#00c3ff', boxShadow: 'none' }}
              whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(0, 195, 255, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.05 }}
            >
              <Bot size={20} /> {t('btn_ai_coach')}
            </motion.button>
          </div>
        )}

        {/* ============ ANTRENMAN ============ */}
        {dashboardTab === 'train' && (
          <div className="stack-grid">
            {/* AI Saved Program — tam genislik; gunler iceride coklu kolon (grid) */}
            <div className="span-both">
            <SavedProgramPreview
              savedAiProgram={savedAiProgram}
              painData={checkinToPainData(checkinData)}
              showCustomBuilder={showCustomBuilder}
              completedDays={completedDays}
              clearAiProgram={clearAiProgram}
              startActiveAiWorkout={startActiveAiWorkout}
              handleUpdateAiProgram={handleUpdateAiProgram}
            />
            </div>

            {/* Custom Program Builder */}
            {
              showCustomBuilder && (
                <div className="span-both">
                <CustomProgramBuilder setSavedAiProgram={setSavedAiProgram} setShowCustomBuilder={setShowCustomBuilder} />
                </div>
              )
            }

            {/* Sablonlar: tam genislik; sablon kartlari iceride coklu kolon */}
            <div className="span-both">
            <WorkoutTemplates
              onStartTemplate={(params) => startActiveAiWorkout(-1, params)}
            />
            </div>

            {/* Aksiyon butonlari: 2x2 grid (mobilde tek kolon) */}
            <div className="fade-in span-both" style={{ animationDelay: '0.15s', display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              <motion.button
                onClick={() => setShowWizard(true)}
                className="neon-btn btn-accent"
                style={{ background: 'rgba(255, 0, 136, 0.1)', borderColor: '#ff0088', color: '#ff0088', boxShadow: 'none' }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(255, 0, 136, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.05 }}
              >
                <Wand2 size={20} /> {t('btn_wizard_program')}
              </motion.button>

              <motion.button
                onClick={() => setCurrentView('anatomy')}
                className="neon-btn btn-accent"
                style={{ background: 'rgba(173, 255, 47, 0.1)', borderColor: '#adff2f', color: '#adff2f', boxShadow: 'none' }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(173, 255, 47, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.05 }}
              >
                <Activity size={20} /> {t('btn_anatomy')}
              </motion.button>

              <motion.button
                onClick={() => setCurrentView('hiit')}
                className="neon-btn btn-accent"
                style={{ background: 'rgba(255, 107, 61, 0.1)', borderColor: '#ff6b3d', color: '#ff6b3d', boxShadow: 'none' }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(255, 107, 61, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.05 }}
              >
                <Timer size={20} /> {t('btn_hiit')}
              </motion.button>

              <motion.button
                onClick={() => setCurrentView('mobility')}
                className="neon-btn btn-accent"
                style={{ background: 'rgba(0, 195, 255, 0.08)', borderColor: '#00c3ff', color: '#00c3ff', boxShadow: 'none' }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(0, 195, 255, 0.35)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.05 }}
              >
                <PersonStanding size={20} /> {t('btn_mobility')}
              </motion.button>
            </div>
          </div>
        )}

        {/* ============ GELİŞİM ============ */}
        {/* Masaustunde 2 kolon; grafikler span-both ile tam genislik */}
        {dashboardTab === 'progress' && (
          <div className="stack-grid">
            <WorkoutHeatmap workoutHistory={workoutHistory} />

            <StrengthStandards workoutHistory={workoutHistory} />

            <WeeklyAiReport workoutHistory={workoutHistory} />

            {workoutHistory && workoutHistory.length > 0 && (
              <WorkoutProgressCharts workoutHistory={workoutHistory} onOpenPrHistory={() => setCurrentView('prhistory')} />
            )}

            <StrengthCurves workoutHistory={workoutHistory} />

            <WorkoutCalendar workoutHistory={workoutHistory} />

            <CoachInsightFeed workoutHistory={workoutHistory} weeklyGoal={weeklyGoal} activeBuddyId={activeBuddyId} painData={checkinToPainData(checkinData)} />
          </div>
        )}

        {/* FAZ 1d: Gunluk Check-In */}
        <CheckInModal
          open={showCheckIn}
          onClose={() => setShowCheckIn(false)}
          initial={checkinToday(checkinData) ? checkinData.entries[0] : null}
          onSave={(entry) => saveCheckIn(entry, checkinData, setCheckinData)}
        />

        {/* FAZ 3: Program Uretici Sihirbazi — kosullu render: her acilista
            taze check-in agrisiyla yeniden mount edilir (kara liste on-secimi) */}
        {showWizard && (
          <ProgramWizard
            open
            onClose={() => setShowWizard(false)}
            workoutHistory={workoutHistory}
            painData={checkinToPainData(checkinData)}
            onProgramCreated={(prog) => setSavedAiProgram(prog)}
          />
        )}

        {/* Level Up Confetti Modal */}
        {
          showLevelUpModal && (
            <LevelUpModal level={userLevel} prevLevel={levelUpFrom || userLevel} onClose={closeLevelUpModal} />
          )
        }

        {/* Badge Unlock Modal */}
        {
          showBadgeUnlockModal && (
            <BadgeUnlockModal 
              badge={showBadgeUnlockModal} 
              onClose={() => setShowBadgeUnlockModal(null)} 
            />
          )
        }

          </ErrorBoundary>
        </div>

        {/* Ilk acilis rehberi */}
        <AnimatePresence>
          {!hasOnboarded && (
            <OnboardingOverlay onFinish={() => setHasOnboarded(true)} />
          )}
        </AnimatePresence>
      </motion.div>
      </AnimatePresence>
      {evolutionModalEl}
      {bottomNavEl}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

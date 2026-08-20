import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Play, Plus, ArrowLeft, Trash2, Check, Bot, Activity, Cloud } from 'lucide-react';
import useLocalStorage from './hooks/useLocalStorage';
import ErrorBoundary from './components/ErrorBoundary';
import AICoachOnboarding from './components/aicoach/AICoachOnboarding';
import CustomProgramBuilder from './components/dashboard/CustomProgramBuilder';
import ActiveWorkoutView from './components/workout/ActiveWorkoutView';
import ScoreTracker from './components/dashboard/ScoreTracker';
import AICoachInsights from './components/dashboard/AICoachInsights';
import SavedProgramPreview from './components/dashboard/SavedProgramPreview';
import WorkoutProgressCharts from './components/dashboard/WorkoutProgressCharts';
import BodyTracker from './components/profile/BodyTracker';
import NutritionTracker from './components/nutrition/NutritionTracker';
import NutritionSummary from './components/dashboard/NutritionSummary';
import WaterTrackerWidget from './components/dashboard/WaterTrackerWidget';
import PrHistoryPage from './components/dashboard/PrHistoryPage';
import BottomNav from './components/ui/BottomNav';
import OnboardingOverlay from './components/ui/OnboardingOverlay';
import { ToastProvider, useToast } from './components/ui/ToastProvider';
import { startReminderTicker } from './utils/notificationScheduler';
import LevelUpModal from './components/ui/LevelUpModal';
import ShopModal from './components/profile/ShopModal';
import BadgeUnlockModal from './components/ui/BadgeUnlockModal';
import AdminPanel from './components/admin/AdminPanel';
import AnatomyLibrary from './components/anatomy/AnatomyLibrary';
import AuthScreen from './components/auth/AuthScreen';
import { BADGE_LIBRARY } from './data/badges';
import { applyTheme } from './data/themes';
import './App.css';
import { getRank } from './utils/ranks';import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { error as logError } from './utils/logger';

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
  const [showShopModal, setShowShopModal] = useState(false);
  const [showBadgeUnlockModal, setShowBadgeUnlockModal] = useState(null);

  const [userName, setUserName] = useLocalStorage('gym_app_user_name', 'Athlete');

  const [userCoins, setUserCoins] = useLocalStorage('gym_app_coins', 0);
  const [unlockedThemes, setUnlockedThemes] = useLocalStorage('gym_app_unlocked_themes', ['default']);
  const [activeTheme, setActiveTheme] = useLocalStorage('gym_app_theme', 'default');

  // Storage State
  const [workoutHistory, setWorkoutHistory] = useLocalStorage('gym_app_history', []);
  const [lastWorkoutDate, setLastWorkoutDate] = useLocalStorage('gym_app_last_date', null);
  const [streak, setStreak] = useLocalStorage('gym_app_streak', 0);
  const [savedAiProgram, setSavedAiProgram] = useLocalStorage('gym_app_ai_program', null);
  const [userXP, setUserXP] = useLocalStorage('gym_app_xp', 0);
  const [userLevel, setUserLevel] = useLocalStorage('gym_app_level', 1);
  const [pinnedBadges, setPinnedBadges] = useLocalStorage('gym_app_pinned_badges', []);
  const [unlockedBadges, setUnlockedBadges] = useLocalStorage('gym_app_unlocked_badges', []);

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

  // --- PWA HATIRLATMA TICKER'I ---
  // Uygulama acikken antrenman/su hatirlatmalarini kontrol eder
  useEffect(() => {
    const stop = startReminderTicker();
    return stop;
  }, []);

  // --- LEVEL UP ---
  // Onceki seviyeyi ref ile izliyoruz; modal karari render sonrasi tek effect'te.
  const prevLevelRef = useRef(userLevel);
  const markLevelUpSeen = useCallback(() => {
    prevLevelRef.current = userLevel;
  }, [userLevel]);

  // --- LEVEL UP EFFECT ---
  // Not: localStorage'a yansitma yerine ref kullaniyoruz; set-state-in-effect
  // kuralina gore modal acma tek seferlik senkronizasyon isidir.
  useEffect(() => {
    if (prevLevelRef.current > 0 && userLevel > prevLevelRef.current) {
      setShowLevelUpModal(true);
    }
    prevLevelRef.current = userLevel;
  }, [userLevel]);

  // --- BADGE UNLOCK EFFECT ---
  // Rozetler localStorage ile senkronize edilir; burada setState external store
  // guncellemesi oldugu icin kural devre disi birakildi.
  useEffect(() => {
    const stats = {
      totalWorkouts: new Set((workoutHistory || []).map(w => new Date(w.date).toDateString())).size,
      streak: streak,
      aiWorkoutsCompleted: new Set((workoutHistory || []).filter(w => w.isAiGenerated).map(w => new Date(w.date).toDateString())).size,
      history: workoutHistory || [],
      level: userLevel
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
  }, [workoutHistory, streak, userLevel, unlockedBadges, showBadgeUnlockModal, setUnlockedBadges]);

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

  // Alt nav her ekranda gorunur; aktif antrenman ve giris akisinda gizlenir
  const showBottomNav = currentView !== 'activeAiWorkout' && currentView !== 'auth';
  const bottomNavEl = showBottomNav && (
    <BottomNav
      currentView={currentView}
      dashboardTab={dashboardTab}
      onGoHome={handleNavGoProfile}
      onSelectTab={handleNavSelectTab}
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
            streak={streak}
            setStreak={setStreak}
            lastWorkoutDate={lastWorkoutDate}
            setLastWorkoutDate={setLastWorkoutDate}
            completedDays={completedDays}
            setCompletedDays={setCompletedDays}
            savedAiProgram={savedAiProgram}
            setSavedAiProgram={setSavedAiProgram}
            userXP={userXP}
            setUserXP={setUserXP}
            userLevel={userLevel}
            setUserLevel={setUserLevel}
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
            pinnedBadges={pinnedBadges}
            setPinnedBadges={setPinnedBadges}
            unlockedBadges={unlockedBadges}
            userName={userName}
            setUserName={setUserName}
          />
        );
      }
      if (currentView === 'nutrition') {
        return <NutritionTracker onBack={() => setCurrentView('dashboard')} />;
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
            streak={streak} setStreak={setStreak}
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
                  <h1 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</h1>
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

                {/* Coin: profil kartının içinde, sağda */}
                <div
                  onClick={(e) => { e.stopPropagation(); setShowShopModal(true); }}
                  style={{ background: 'rgba(255, 215, 0, 0.1)', border: '1px solid #ffd700', borderRadius: '12px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#ffd700', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0, marginLeft: '4px' }}
                  title={t('app_shop_tooltip')}
                >
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

              {/* XP ilerleme çubuğu: tam genişlik ince şerit */}
              {(() => {
                const reqXP = (userLevel * 500) + (userLevel * 100);
                const progressPercent = Math.min(100, Math.max(0, (userXP / reqXP) * 100)) || 0;
                return (
                  <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }} title={`${userXP}/${reqXP} XP`}>
                    <div style={{
                      height: '100%',
                      width: `${progressPercent}%`,
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
            {/* Sol kolon: ana skor kartı */}
            <div className="dash-main">
              <ScoreTracker
                workoutHistory={workoutHistory}
                streak={streak}
              />
            </div>

            {/* Sag kolon: beslenme + su + AI koç kısayolu */}
            <div className="dash-side" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <NutritionSummary
                nutritionData={nutritionData}
                onClick={() => setCurrentView('nutrition')}
              />
              <WaterTrackerWidget />

              <motion.button
                onClick={() => setCurrentView('aicoach')}
                className="neon-btn"
                style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', background: 'rgba(0, 195, 255, 0.1)', borderColor: '#00c3ff', color: '#00c3ff', boxShadow: 'none' }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(0, 195, 255, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.05 }}
              >
                <Bot size={20} /> {t('btn_ai_coach')}
              </motion.button>
            </div>
          </div>
        )}

        {/* ============ ANTRENMAN ============ */}
        {dashboardTab === 'train' && (
          <>
            {/* AI Saved Program */}
            <SavedProgramPreview
              savedAiProgram={savedAiProgram}
              showCustomBuilder={showCustomBuilder}
              completedDays={completedDays}
              clearAiProgram={clearAiProgram}
              startActiveAiWorkout={startActiveAiWorkout}
              handleUpdateAiProgram={handleUpdateAiProgram}
            />

            {/* Custom Program Builder */}
            {
              showCustomBuilder && (
                <CustomProgramBuilder setSavedAiProgram={setSavedAiProgram} setShowCustomBuilder={setShowCustomBuilder} />
              )
            }

            {/* Aksiyon butonları */}
            <div className="fade-in" style={{ animationDelay: '0.15s', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
              <motion.button
                onClick={() => setShowCustomBuilder(true)}
                className="neon-btn"
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', background: 'rgba(255, 0, 136, 0.1)', borderColor: '#ff0088', color: '#ff0088', boxShadow: 'none' }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(255, 0, 136, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.05 }}
              >
                <Plus size={20} /> {t('btn_create_program')}
              </motion.button>

              <motion.button
                onClick={() => setCurrentView('anatomy')}
                className="neon-btn"
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', background: 'rgba(173, 255, 47, 0.1)', borderColor: '#adff2f', color: '#adff2f', boxShadow: 'none' }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(173, 255, 47, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.05 }}
              >
                <Activity size={20} /> {t('btn_anatomy')}
              </motion.button>
            </div>
          </>
        )}

        {/* ============ GELİŞİM ============ */}
        {/* Grafikler genislik ister; bu sekme tek kolon akar (PC dahil) */}
        {dashboardTab === 'progress' && (
          <>
            {workoutHistory && workoutHistory.length > 0 && (
              <WorkoutProgressCharts workoutHistory={workoutHistory} onOpenPrHistory={() => setCurrentView('prhistory')} />
            )}

            <AICoachInsights workoutHistory={workoutHistory} />
          </>
        )}

        {/* Level Up Confetti Modal */}
        {
          showLevelUpModal && (
            <LevelUpModal level={userLevel} onClose={() => { markLevelUpSeen(); setShowLevelUpModal(false); }} />
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

        {/* Shop Modal */}
        {
          showShopModal && (
            <ShopModal
              onClose={() => setShowShopModal(false)}
              userCoins={userCoins}
              setUserCoins={setUserCoins}
              unlockedThemes={unlockedThemes}
              setUnlockedThemes={setUnlockedThemes}
              activeTheme={activeTheme}
              setActiveTheme={setActiveTheme}
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

import React, { useState, useEffect, useRef } from 'react';
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
import CloudSyncCard from './components/dashboard/CloudSyncCard';
import BodyTracker from './components/profile/BodyTracker';
import NutritionTracker from './components/nutrition/NutritionTracker';
import NutritionSummary from './components/dashboard/NutritionSummary';
import LevelUpModal from './components/ui/LevelUpModal';
import ShopModal from './components/profile/ShopModal';
import BadgeUnlockModal from './components/ui/BadgeUnlockModal';
import AdminPanel from './components/admin/AdminPanel';
import AnatomyLibrary from './components/anatomy/AnatomyLibrary';
import AuthScreen from './components/auth/AuthScreen';
import { BADGE_LIBRARY } from './data/badges';
import { Zap } from 'lucide-react';
import './App.css';
import { getRank } from './utils/ranks';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';

function AppContent() {
  const { t, lang } = useLanguage();
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'workout' | 'aicoach' | 'activeAiWorkout' | 'auth'
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (!auth) return;
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Firebase auth error:", err);
    }
  }, []);

  const profileClickTimeout = useRef(null);
  
  const handleProfileClick = () => {
    if (profileClickTimeout.current !== null) {
      // Double click detected
      clearTimeout(profileClickTimeout.current);
      profileClickTimeout.current = null;
      setCurrentView('admin');
    } else {
      // Single click detected
      profileClickTimeout.current = setTimeout(() => {
        profileClickTimeout.current = null;
        setCurrentView('profile');
      }, 300);
    }
  };

  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showBadgeUnlockModal, setShowBadgeUnlockModal] = useState(null);
  const [prevLevelForModal, setPrevLevelForModal] = useLocalStorage('gym_app_prev_level', 0);

  const [userName, setUserName] = useLocalStorage('gym_app_user_name', 'Athlete');
  const [isEditingName, setIsEditingName] = useState(false);

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
  const [activeAiWorkoutDayIdx, setActiveAiWorkoutDayIdx] = useLocalStorage('gym_app_active_day_idx', null);
  const [activeAiWorkoutDayParams, setActiveAiWorkoutDayParams] = useLocalStorage('gym_app_active_day_params', null);

  // Nutrition State for Dashboard Summary
  const [nutritionData] = useLocalStorage('gym_app_nutrition_v2', {});

  // --- THEME EFFECT ---
  useEffect(() => {
    const root = document.documentElement;
    if (activeTheme === 'default') {
      root.style.setProperty('--accent-primary', '#00ff88');
      root.style.setProperty('--accent-secondary', '#00d4ff');
      root.style.setProperty('--bg-dark', '#0f1115');
      root.style.setProperty('--bg-card', 'rgba(26, 29, 36, 0.7)');
      root.style.setProperty('--bg-card-hover', 'rgba(36, 40, 50, 0.8)');
      root.style.setProperty('--gradient-1', 'rgba(0, 255, 136, 0.08)');
      root.style.setProperty('--gradient-2', 'rgba(0, 212, 255, 0.08)');
      root.style.setProperty('--neon-glow', '0 0 20px rgba(0, 255, 136, 0.15)');
      root.style.setProperty('--neon-glow-strong', '0 0 30px rgba(0, 255, 136, 0.4)');
    } else if (activeTheme === 'cyberpunk') {
      root.style.setProperty('--accent-primary', '#ff00ff');
      root.style.setProperty('--accent-secondary', '#00ffff');
      root.style.setProperty('--bg-dark', '#090014');
      root.style.setProperty('--bg-card', 'rgba(25, 0, 45, 0.7)');
      root.style.setProperty('--bg-card-hover', 'rgba(40, 0, 70, 0.8)');
      root.style.setProperty('--gradient-1', 'rgba(255, 0, 255, 0.1)');
      root.style.setProperty('--gradient-2', 'rgba(0, 255, 255, 0.1)');
      root.style.setProperty('--neon-glow', '0 0 20px rgba(255, 0, 255, 0.2)');
      root.style.setProperty('--neon-glow-strong', '0 0 30px rgba(255, 0, 255, 0.5)');
    } else if (activeTheme === 'blood') {
      root.style.setProperty('--accent-primary', '#ff4757');
      root.style.setProperty('--accent-secondary', '#ff6b81');
      root.style.setProperty('--bg-dark', '#1a0505');
      root.style.setProperty('--bg-card', 'rgba(45, 10, 10, 0.8)');
      root.style.setProperty('--bg-card-hover', 'rgba(70, 15, 15, 0.9)');
      root.style.setProperty('--gradient-1', 'rgba(255, 71, 87, 0.1)');
      root.style.setProperty('--gradient-2', 'rgba(255, 107, 129, 0.1)');
      root.style.setProperty('--neon-glow', '0 0 20px rgba(255, 71, 87, 0.2)');
      root.style.setProperty('--neon-glow-strong', '0 0 30px rgba(255, 71, 87, 0.5)');
    } else if (activeTheme === 'gold') {
      root.style.setProperty('--accent-primary', '#ffd700');
      root.style.setProperty('--accent-secondary', '#ffa502');
      root.style.setProperty('--bg-dark', '#151205');
      root.style.setProperty('--bg-card', 'rgba(40, 35, 10, 0.7)');
      root.style.setProperty('--bg-card-hover', 'rgba(60, 50, 15, 0.8)');
      root.style.setProperty('--gradient-1', 'rgba(255, 215, 0, 0.1)');
      root.style.setProperty('--gradient-2', 'rgba(255, 165, 2, 0.1)');
      root.style.setProperty('--neon-glow', '0 0 20px rgba(255, 215, 0, 0.15)');
      root.style.setProperty('--neon-glow-strong', '0 0 30px rgba(255, 215, 0, 0.4)');
    } else if (activeTheme === 'abyss') {
      root.style.setProperty('--accent-primary', '#00cec9');
      root.style.setProperty('--accent-secondary', '#0984e3');
      root.style.setProperty('--bg-dark', '#010a15');
      root.style.setProperty('--bg-card', 'rgba(5, 25, 45, 0.7)');
      root.style.setProperty('--bg-card-hover', 'rgba(10, 40, 70, 0.8)');
      root.style.setProperty('--gradient-1', 'rgba(0, 206, 201, 0.1)');
      root.style.setProperty('--gradient-2', 'rgba(9, 132, 227, 0.1)');
      root.style.setProperty('--neon-glow', '0 0 20px rgba(0, 206, 201, 0.15)');
      root.style.setProperty('--neon-glow-strong', '0 0 30px rgba(0, 206, 201, 0.4)');
    } else if (activeTheme === 'toxic') {
      root.style.setProperty('--accent-primary', '#adff2f');
      root.style.setProperty('--accent-secondary', '#7fff00');
      root.style.setProperty('--bg-dark', '#0a1005');
      root.style.setProperty('--bg-card', 'rgba(15, 30, 5, 0.7)');
      root.style.setProperty('--bg-card-hover', 'rgba(25, 45, 10, 0.8)');
      root.style.setProperty('--gradient-1', 'rgba(173, 255, 47, 0.1)');
      root.style.setProperty('--gradient-2', 'rgba(127, 255, 0, 0.1)');
      root.style.setProperty('--neon-glow', '0 0 20px rgba(173, 255, 47, 0.15)');
      root.style.setProperty('--neon-glow-strong', '0 0 30px rgba(173, 255, 47, 0.4)');
    } else if (activeTheme === 'sakura') {
      root.style.setProperty('--accent-primary', '#ffb7b2');
      root.style.setProperty('--accent-secondary', '#e28495');
      root.style.setProperty('--bg-dark', '#15050a');
      root.style.setProperty('--bg-card', 'rgba(45, 15, 25, 0.7)');
      root.style.setProperty('--bg-card-hover', 'rgba(60, 25, 35, 0.8)');
      root.style.setProperty('--gradient-1', 'rgba(255, 183, 178, 0.1)');
      root.style.setProperty('--gradient-2', 'rgba(226, 132, 149, 0.1)');
      root.style.setProperty('--neon-glow', '0 0 20px rgba(255, 183, 178, 0.15)');
      root.style.setProperty('--neon-glow-strong', '0 0 30px rgba(255, 183, 178, 0.4)');
    } else if (activeTheme === 'sunset') {
      root.style.setProperty('--accent-primary', '#ff7e5f');
      root.style.setProperty('--accent-secondary', '#feb47b');
      root.style.setProperty('--bg-dark', '#150a05');
      root.style.setProperty('--bg-card', 'rgba(45, 20, 10, 0.7)');
      root.style.setProperty('--bg-card-hover', 'rgba(60, 30, 15, 0.8)');
      root.style.setProperty('--gradient-1', 'rgba(255, 126, 95, 0.1)');
      root.style.setProperty('--gradient-2', 'rgba(254, 180, 123, 0.1)');
      root.style.setProperty('--neon-glow', '0 0 20px rgba(255, 126, 95, 0.15)');
      root.style.setProperty('--neon-glow-strong', '0 0 30px rgba(255, 126, 95, 0.4)');
    } else if (activeTheme === 'darkmatter') {
      root.style.setProperty('--accent-primary', '#ffffff');
      root.style.setProperty('--accent-secondary', '#888888');
      root.style.setProperty('--bg-dark', '#000000');
      root.style.setProperty('--bg-card', 'rgba(15, 15, 15, 0.9)');
      root.style.setProperty('--bg-card-hover', 'rgba(30, 30, 30, 0.9)');
      root.style.setProperty('--gradient-1', 'rgba(255, 255, 255, 0.05)');
      root.style.setProperty('--gradient-2', 'rgba(200, 200, 200, 0.05)');
      root.style.setProperty('--neon-glow', '0 0 20px rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--neon-glow-strong', '0 0 30px rgba(255, 255, 255, 0.3)');
    }
  }, [activeTheme]);

  // --- LEVEL UP EFFECT ---
  useEffect(() => {
    if (userLevel > prevLevelForModal && prevLevelForModal > 0) {
      setShowLevelUpModal(true);
    }
    if (userLevel !== prevLevelForModal) {
      setPrevLevelForModal(userLevel);
    }
  }, [userLevel, prevLevelForModal, setPrevLevelForModal]);

  // --- BADGE UNLOCK EFFECT ---
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
           setShowBadgeUnlockModal(newlyUnlocked[0]);
       }
    }
  }, [workoutHistory, streak, userLevel, unlockedBadges, showBadgeUnlockModal, setUnlockedBadges]);

  // --- Reset Completed Days on Monday ---
  useEffect(() => {
    const today = new Date();
    // Monday is 1
    if (today.getDay() === 1) {
      const todayStr = today.toISOString().split('T')[0];
      if (lastResetDate !== todayStr) {
        setCompletedDays([]);
        setLastResetDate(todayStr);
      }
    }
  }, [lastResetDate, setCompletedDays, setLastResetDate]);




  // -------------------------

  const clearAiProgram = () => {
    setSavedAiProgram(null);
    setCompletedDays([]);
  };



  const handleUpdateAiProgram = (dayIdx, exIdx, field, value) => {
    const updatedProgram = { ...savedAiProgram };
    if (!updatedProgram?.days?.[dayIdx]?.exercises?.[exIdx]) return;
    updatedProgram.days[dayIdx].exercises[exIdx][field] = value;
    setSavedAiProgram(updatedProgram);
  };

  // --- LIVE AI WORKOUT LOGIC ---
  const startActiveAiWorkout = (dayIdx, dayParams) => {
    setActiveAiWorkoutDayIdx(dayIdx);
    setActiveAiWorkoutDayParams(dayParams);
    setCurrentView('activeAiWorkout');
  };
  // ------------------------------

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
        return <AICoachOnboarding workoutHistory={workoutHistory} setSavedAiProgram={setSavedAiProgram} setCurrentView={setCurrentView} />;
      }
      if (currentView === 'auth') {
        return <AuthScreen onBack={() => setCurrentView('dashboard')} onLoginSuccess={() => setCurrentView('dashboard')} setUserName={setUserName} />;
      }
      if (currentView === 'profile') {
        return (
          <BodyTracker
            onBack={() => setCurrentView('dashboard')}
            currentUser={currentUser}
            onLoginClick={() => setCurrentView('auth')}
            userXP={userXP}
            setUserXP={setUserXP}
            userLevel={userLevel}
            setUserLevel={setUserLevel}
            workoutHistory={workoutHistory}
            streak={streak}
            pinnedBadges={pinnedBadges}
            setPinnedBadges={setPinnedBadges}
            unlockedBadges={unlockedBadges}
          />
        );
      }
      if (currentView === 'nutrition') {
        return <NutritionTracker onBack={() => setCurrentView('dashboard')} />;
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
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ width: '100%' }}
          >
            {viewContent}
          </motion.div>
        </AnimatePresence>
      );
    }
  }

  return (
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
            {/* Top Navigation */}
            <header className="top-bar fade-in" style={{ animationDelay: '0s' }}>
              <div className="profile-section"
                onClick={handleProfileClick}
                style={{
              cursor: 'pointer',
              padding: '0.6rem 1rem',
              borderRadius: '20px',
              background: 'rgba(0, 195, 255, 0.1)',
              border: '1px solid rgba(0, 195, 255, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              userSelect: 'none',
              touchAction: 'manipulation'
            }}
            title={t('app_profile_tooltip')}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 195, 255, 0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 195, 255, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div className="avatar" style={{ width: '40px', height: '40px' }}>
              <Trophy size={20} />
            </div>
            <div className="greeting" style={{ display: 'flex', flexDirection: 'column' }}>
              {isEditingName ? (
                <input
                  type="text"
                  autoFocus
                  style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--accent-primary)', borderRadius: '4px', outline: 'none', padding: '2px 4px', fontSize: '1.1rem', width: '120px', marginBottom: '2px' }}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingName(false); }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}
                  onClick={(e) => { e.stopPropagation(); setIsEditingName(true); }}
                >
                  <h1 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>{userName}</h1>
                  <span style={{ fontSize: '0.8rem', opacity: 0.5 }} title={t('app_edit_name_tooltip')}>✏️</span>
                </div>
              )}
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{t('app_profile_view')}</span>
            </div>
          </div>

          {/* Dashboard Level & Badges Showcase */}
          {(() => {
            const currentRank = getRank(userLevel) || { icon: '🛡️', color: '#fff', title_tr: '...', title_en: '...' };
            const reqXP = (userLevel * 500) + (userLevel * 100);
            const progressPercent = Math.min(100, Math.max(0, (userXP / reqXP) * 100)) || 0;
            
            return (
              <div style={{
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.3)',
                padding: '10px 15px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ flex: 1, marginRight: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{currentRank.icon}</span>
                    <span style={{ color: currentRank.color, fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {lang === 'tr' ? currentRank.title_tr : currentRank.title_en} <span style={{ color: '#fff' }}>({t('level')} {userLevel})</span>
                    </span>
                    <span style={{ color: 'var(--text-light)', fontSize: '0.75rem', marginLeft: 'auto' }}>
                      {userXP}/{reqXP}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      background: 'linear-gradient(90deg, #00c3ff, #ff0088)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div
                    onClick={() => setShowShopModal(true)}
                    style={{ background: 'rgba(255, 215, 0, 0.1)', border: '1px solid #ffd700', borderRadius: '12px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#ffd700', fontWeight: 'bold', fontSize: '0.9rem' }}
                    title={t('app_shop_tooltip')}
                  >
                    <span>🪙</span> {userCoins}
                  </div>

                  {pinnedBadges.length > 0 ? (
                    pinnedBadges.map(badgeId => {
                      const bInfo = BADGE_LIBRARY.find(b => b.id === badgeId);
                      if (!bInfo) return null;
                      return (
                        <div key={bInfo.id} title={lang === 'tr' ? bInfo.title : bInfo.title_en} style={{ fontSize: '1.5rem', background: 'rgba(0, 195, 255, 0.1)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(0, 195, 255, 0.3)' }}>
                          {bInfo.icon}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'right', fontStyle: 'italic' }}>
                      {t('app_rank_empty')}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </header>

        {/* Main Stats: Score Tracker */}
        <ScoreTracker
          workoutHistory={workoutHistory}
          streak={streak}
        />

        {/* AI COACH SMART DASHBOARD INSIGHTS */}
        <AICoachInsights workoutHistory={workoutHistory} />

        {/* Nutrition Summary Widget */}
        <NutritionSummary
          nutritionData={nutritionData}
          onClick={() => setCurrentView('nutrition')}
        />

        {/* WORKOUT PROGRESS CHARTS */}
        {
          workoutHistory && workoutHistory.length > 0 && (
            <WorkoutProgressCharts workoutHistory={workoutHistory} />
          )
        }

        {/* Action Area */}
        <div className="fade-in" style={{ animationDelay: '0.2s', marginBottom: '3rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>

          {/* YAPAY ZEKA KOÇU BUTONU (Her Zaman Görünür) */}
          <motion.button
            onClick={() => setCurrentView('aicoach')}
            className="neon-btn"
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', background: 'rgba(0, 195, 255, 0.1)', borderColor: '#00c3ff', color: '#00c3ff', boxShadow: 'none' }}
            whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(0, 195, 255, 0.4)' }}
            whileTap={{ scale: 0.93 }}
            transition={{ duration: 0.05 }}
          >
            <Bot size={20} />
            {t('btn_ai_coach')}
          </motion.button>

          {/* KAS ANATOMİSİ BUTONU */}
          <motion.button
            onClick={() => setCurrentView('anatomy')}
            className="neon-btn"
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', background: 'rgba(173, 255, 47, 0.1)', borderColor: '#adff2f', color: '#adff2f', boxShadow: 'none' }}
            whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(173, 255, 47, 0.4)' }}
            whileTap={{ scale: 0.93 }}
            transition={{ duration: 0.05 }}
          >
            <Activity size={20} /> {t('btn_anatomy')}
          </motion.button>

          {/* Custom Program Builder Acma Butonu */}
          {!showCustomBuilder && (
            <motion.button
              onClick={() => setShowCustomBuilder(true)}
              className="neon-btn"
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', background: 'rgba(255, 0, 136, 0.1)', borderColor: '#ff0088', color: '#ff0088', boxShadow: 'none' }}
              whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(255, 0, 136, 0.4)' }}
              whileTap={{ scale: 0.93 }}
              transition={{ duration: 0.05 }}
            >
              <Plus size={20} /> {t('btn_create_program')}
            </motion.button>
          )}
        </div>

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

        {/* Level Up Confetti Modal */}
        {
          showLevelUpModal && (
            <LevelUpModal level={userLevel} onClose={() => setShowLevelUpModal(false)} />
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
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ErrorBoundary>
  );
}

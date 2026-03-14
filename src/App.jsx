import React, { useState, useEffect } from 'react';
import { Trophy, Play, Plus, ArrowLeft, Trash2, Check, Bot } from 'lucide-react';
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
import { BADGE_LIBRARY } from './data/badges';
import { Zap } from 'lucide-react';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'workout' | 'aicoach' | 'activeAiWorkout'

  const [userName, setUserName] = useLocalStorage('gym_app_user_name', 'Athlete');
  const [isEditingName, setIsEditingName] = useState(false);

  // Storage State
  const [workoutHistory, setWorkoutHistory] = useLocalStorage('gym_app_history', []);
  const [lastWorkoutDate, setLastWorkoutDate] = useLocalStorage('gym_app_last_date', null);
  const [streak, setStreak] = useLocalStorage('gym_app_streak', 0);
  const [savedAiProgram, setSavedAiProgram] = useLocalStorage('gym_app_ai_program', null);
  const [userXP, setUserXP] = useLocalStorage('gym_app_xp', 0);
  const [userLevel, setUserLevel] = useLocalStorage('gym_app_level', 1);
  const [pinnedBadges, setPinnedBadges] = useLocalStorage('gym_app_pinned_badges', []);

  const [completedDays, setCompletedDays] = useLocalStorage('gym_app_completed_days', []);
  const [lastResetDate, setLastResetDate] = useLocalStorage('gym_app_last_reset_date', null);

  // UI / Routing State
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [activeAiWorkoutDayIdx, setActiveAiWorkoutDayIdx] = useLocalStorage('gym_app_active_day_idx', null);
  const [activeAiWorkoutDayParams, setActiveAiWorkoutDayParams] = useLocalStorage('gym_app_active_day_params', null);

  // Nutrition State for Dashboard Summary
  const [nutritionData] = useLocalStorage('gym_app_nutrition_v2', {});

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

  const handleClearHistory = () => {
    setWorkoutHistory([]);
    setStreak(0);
    setLastWorkoutDate(null);
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
      />
    );
  }

  if (currentView === 'aicoach') {
    return <AICoachOnboarding workoutHistory={workoutHistory} setSavedAiProgram={setSavedAiProgram} setCurrentView={setCurrentView} />;
  }

  if (currentView === 'profile') {
    return (
      <BodyTracker
        onBack={() => setCurrentView('dashboard')}
        userXP={userXP}
        setUserXP={setUserXP}
        userLevel={userLevel}
        setUserLevel={setUserLevel}
        workoutHistory={workoutHistory}
        streak={streak}
        pinnedBadges={pinnedBadges}
        setPinnedBadges={setPinnedBadges}
      />
    );
  }

  if (currentView === 'nutrition') {
    return <NutritionTracker onBack={() => setCurrentView('dashboard')} />;
  }

  return (
    <ErrorBoundary>
      <div className="app-container">
        {/* Top Navigation */}
        <header className="top-bar fade-in" style={{ animationDelay: '0s' }}>
          <div className="profile-section"
            onClick={() => setCurrentView('profile')}
            style={{
              cursor: 'pointer',
              padding: '0.6rem 1rem',
              borderRadius: '20px',
              background: 'rgba(0, 195, 255, 0.1)',
              border: '1px solid rgba(0, 195, 255, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            title="Profil ve Vücut Ölçüleri"
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
                  <span style={{ fontSize: '0.8rem', opacity: 0.5 }} title="İsmini Değiştir">✏️</span>
                </div>
              )}
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>Profili Gör &gt;</span>
            </div>
          </div>

          {/* Dashboard Level & Badges Showcase */}
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
                <Zap size={16} color="#00c3ff" />
                <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>Seviye {userLevel}</span>
                <span style={{ color: 'var(--text-light)', fontSize: '0.75rem', marginLeft: 'auto' }}>
                  {(() => {
                    const reqXP = userLevel * 500 + (userLevel * 100);
                    return `${userXP}/${reqXP}`;
                  })()}
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                {(() => {
                  const reqXP = userLevel * 500 + (userLevel * 100);
                  return (
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, (userXP / reqXP) * 100)}%`,
                      background: 'linear-gradient(90deg, #00c3ff, #ff0088)',
                      borderRadius: '4px'
                    }}></div>
                  );
                })()}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {pinnedBadges.length > 0 ? (
                pinnedBadges.map(badgeId => {
                  const bInfo = BADGE_LIBRARY.find(b => b.id === badgeId);
                  if (!bInfo) return null;
                  return (
                    <div key={bInfo.id} title={bInfo.title} style={{ fontSize: '1.5rem', background: 'rgba(0, 195, 255, 0.1)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(0, 195, 255, 0.3)' }}>
                      {bInfo.icon}
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'right', fontStyle: 'italic' }}>
                  Vitrin<br />Boş
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Stats: Score Tracker */}
        <ScoreTracker
          workoutHistory={workoutHistory}
          streak={streak}
          handleClearHistory={handleClearHistory}
        />

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

        {/* AI COACH SMART DASHBOARD INSIGHTS */}
        <AICoachInsights workoutHistory={workoutHistory} />

        {/* Action Area */}
        <div className="fade-in" style={{ animationDelay: '0.2s', marginBottom: '3rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>

          {/* YAPAY ZEKA KOÇU BUTONU (Her Zaman Görünür) */}
          <button onClick={() => setCurrentView('aicoach')} className="neon-btn" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', background: 'rgba(0, 195, 255, 0.1)', borderColor: '#00c3ff', color: '#00c3ff', boxShadow: 'none' }}>
            <Bot size={20} />
            YAPAY ZEKA KOÇU
          </button>

          {/* Custom Program Builder Acma Butonu */}
          {!showCustomBuilder && (
            <button onClick={() => setShowCustomBuilder(true)} className="neon-btn" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', background: 'rgba(255, 0, 136, 0.1)', borderColor: '#ff0088', color: '#ff0088', boxShadow: 'none' }}>
              <Plus size={20} /> KENDİ PROGRAMINI YARAT
            </button>
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

      </div >
    </ErrorBoundary >
  );
}

export default App;

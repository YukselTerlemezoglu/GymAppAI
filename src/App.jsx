import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Trophy, Play, Plus, ArrowLeft, Trash2, Check, Bot } from 'lucide-react';
import useLocalStorage from './hooks/useLocalStorage';
import ErrorBoundary from './components/ErrorBoundary';
import AICoachOnboarding from './components/aicoach/AICoachOnboarding';
import CustomProgramBuilder from './components/dashboard/CustomProgramBuilder';
import ActiveWorkoutView from './components/workout/ActiveWorkoutView';
import ScoreTracker from './components/dashboard/ScoreTracker';
import AICoachInsights from './components/dashboard/AICoachInsights';
import SavedProgramPreview from './components/dashboard/SavedProgramPreview';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useLocalStorage('gym_app_current_view', 'dashboard'); // 'dashboard' | 'workout' | 'aicoach' | 'activeAiWorkout'

  // Storage State
  const [workoutHistory, setWorkoutHistory] = useLocalStorage('gym_app_history', []);
  const [lastWorkoutDate, setLastWorkoutDate] = useLocalStorage('gym_app_last_date', null);
  const [streak, setStreak] = useLocalStorage('gym_app_streak', 0);
  const [savedAiProgram, setSavedAiProgram] = useLocalStorage('gym_app_ai_program', null);

  const [completedDays, setCompletedDays] = useLocalStorage('gym_app_completed_days', []);
  const [lastResetDate, setLastResetDate] = useLocalStorage('gym_app_last_reset_date', null);

  // UI / Routing State
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [activeAiWorkoutDayIdx, setActiveAiWorkoutDayIdx] = useLocalStorage('gym_app_active_day_idx', null);
  const [activeAiWorkoutDayParams, setActiveAiWorkoutDayParams] = useLocalStorage('gym_app_active_day_params', null);

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
      />
    );
  }

  if (currentView === 'aicoach') {
    return <AICoachOnboarding workoutHistory={workoutHistory} setSavedAiProgram={setSavedAiProgram} setCurrentView={setCurrentView} />;
  }

  return (
    <ErrorBoundary>
      <div className="app-container">
        {/* Top Navigation */}
        <header className="top-bar fade-in" style={{ animationDelay: '0s' }}>
          <div className="profile-section">
            <div className="avatar">
              <Trophy size={24} />
            </div>
            <div className="greeting">
              <h1>Ready to grind?</h1>
              <p>Welcome back, Athlete</p>
            </div>
          </div>
        </header>

        {/* Main Stats: Score Tracker */}
        <ScoreTracker
          workoutHistory={workoutHistory}
          streak={streak}
          handleClearHistory={handleClearHistory}
        />

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
        {showCustomBuilder && (
          <CustomProgramBuilder setSavedAiProgram={setSavedAiProgram} setShowCustomBuilder={setShowCustomBuilder} />
        )}

      </div>
    </ErrorBoundary >
  );
}

export default App;

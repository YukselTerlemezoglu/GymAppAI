import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ArrowLeft, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';
import { MUSCLE_GROUPS, EXERCISES_DB } from '../../data/exercises';

function AnatomyLibrary({ onBack }) {
  const { t, lang } = useLanguage();
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [expandedExercise, setExpandedExercise] = useState(null);

  const handleMuscleClick = (muscleId) => {
    if (selectedMuscle === muscleId) {
      setSelectedMuscle(null);
      setExpandedExercise(null);
    } else {
      setSelectedMuscle(muscleId);
      setExpandedExercise(null);
    }
  };

  const toggleExercise = (exerciseId) => {
    if (expandedExercise === exerciseId) {
      setExpandedExercise(null);
    } else {
      setExpandedExercise(exerciseId);
    }
  };

  const filteredExercises = selectedMuscle
    ? EXERCISES_DB.filter(ex => ex.muscleGroupId === selectedMuscle)
    : [];

  return (
    <div className="fade-in" style={{ paddingBottom: '4rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <button
          onClick={onBack}
          className="neon-btn"
          style={{ padding: '8px', minWidth: 'auto', flex: '0 0 auto' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-primary)', textShadow: 'var(--neon-glow)' }}>
          {t('btn_anatomy')}
        </h2>
      </header>

      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-light)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {t('anatomy_select_muscle')}
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '10px'
        }}>
          {MUSCLE_GROUPS.map((mg) => {
            const isSelected = selectedMuscle === mg.id;
            return (
              <div
                key={mg.id}
                onClick={() => handleMuscleClick(mg.id)}
                style={{
                  background: isSelected ? 'var(--gradient-1)' : 'var(--bg-card)',
                  border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '12px',
                  padding: '1rem 0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: isSelected ? 'var(--neon-glow)' : 'none',
                  transform: isSelected ? 'translateY(-2px)' : 'none'
                }}
              >
                <span style={{ fontSize: '2rem', marginBottom: '8px' }}>{mg.icon}</span>
                <span style={{ 
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}>
                  {lang === 'tr' ? mg.name : (mg.name_en || mg.name)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {selectedMuscle && (
        <div className="fade-in">
          <h3 style={{ 
            color: 'var(--accent-secondary)', 
            marginBottom: '1rem', 
            borderBottom: '1px solid rgba(255,255,255,0.1)', 
            paddingBottom: '0.5rem' 
          }}>
            {(lang === 'tr' ? MUSCLE_GROUPS.find(m => m.id === selectedMuscle)?.name : MUSCLE_GROUPS.find(m => m.id === selectedMuscle)?.name_en) || t('muscle_group')} {t('anatomy_exercises_suffix')}
          </h3>

          {filteredExercises.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredExercises.map((ex) => {
                const isExpanded = expandedExercise === ex.id;
                return (
                  <div
                    key={ex.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div
                      onClick={() => toggleExercise(ex.id)}
                      style={{
                        padding: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          background: 'rgba(255,255,255,0.1)',
                          padding: '8px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent-primary)'
                        }}>
                          <Dumbbell size={18} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{lang === 'tr' ? ex.name : (ex.name_en || ex.name)}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{lang === 'tr' ? ex.difficulty : (ex.difficulty_en || ex.difficulty)} • {lang === 'tr' ? ex.equipment : (ex.equipment_en || ex.equipment)}</span>
                        </div>
                      </div>
                      <div>
                        {isExpanded ? <ChevronUp size={20} color="var(--text-light)" /> : <ChevronDown size={20} color="var(--text-light)" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{
                        padding: '0 1rem 1rem 1rem',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        marginTop: '0.5rem',
                        paddingTop: '1rem'
                      }}>
                        <h5 style={{ margin: '0 0 8px 0', color: 'var(--accent-secondary)', fontSize: '0.85rem' }}>{t('anatomy_tips')}:</h5>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-light)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                          {(lang === 'tr' ? ex.tips : (ex.tips_en || ex.tips)).map((tip, idx) => (
                            <li key={idx} style={{ marginBottom: '6px' }}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-light)', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
              {t('anatomy_no_exercises')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default AnatomyLibrary;

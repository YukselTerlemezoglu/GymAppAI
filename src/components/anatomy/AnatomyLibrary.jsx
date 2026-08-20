import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  ArrowLeft, ChevronDown, ChevronUp, Dumbbell, Info, AlertTriangle,
  Target, Repeat, Layers, Filter, BookOpen, Zap
} from 'lucide-react';
import { MUSCLE_GROUPS, EXERCISES_DB } from '../../data/exercises';

const DIFFICULTY_ORDER = { 'Başlangıç': 0, 'Beginner': 0, 'Orta': 1, 'Intermediate': 1, 'Zor': 2, 'Advanced': 2 };

function AnatomyLibrary({ onBack }) {
  const { t, lang } = useLanguage();
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const isEn = lang === 'en';

  const handleMuscleClick = (muscleId) => {
    if (selectedMuscle === muscleId) {
      setSelectedMuscle(null);
      setExpandedExercise(null);
    } else {
      setSelectedMuscle(muscleId);
      setExpandedExercise(null);
      setDifficultyFilter('all');
      setTypeFilter('all');
    }
  };

  const toggleExercise = (exerciseId) => {
    setExpandedExercise(prev => (prev === exerciseId ? null : exerciseId));
  };

  const selectedGroup = useMemo(
    () => MUSCLE_GROUPS.find(m => m.id === selectedMuscle),
    [selectedMuscle]
  );

  const filteredExercises = useMemo(() => {
    if (!selectedMuscle) return [];
    return EXERCISES_DB
      .filter(ex => ex.muscleGroupId === selectedMuscle)
      .filter(ex => difficultyFilter === 'all' || ex.difficulty === difficultyFilter)
      .filter(ex => typeFilter === 'all' || ex.type === typeFilter)
      .sort((a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 0) - (DIFFICULTY_ORDER[b.difficulty] ?? 0));
  }, [selectedMuscle, difficultyFilter, typeFilter]);

  const availableDifficulties = useMemo(() => {
    if (!selectedMuscle) return [];
    const set = new Set(EXERCISES_DB.filter(ex => ex.muscleGroupId === selectedMuscle).map(ex => ex.difficulty));
    return Array.from(set);
  }, [selectedMuscle]);

  const availableTypes = useMemo(() => {
    if (!selectedMuscle) return [];
    const set = new Set(EXERCISES_DB.filter(ex => ex.muscleGroupId === selectedMuscle).map(ex => ex.type));
    return Array.from(set);
  }, [selectedMuscle]);

  const typeLabel = (type) => {
    const map = {
      compound: isEn ? 'Compound' : 'Bileşik',
      isolation: isEn ? 'Isolation' : 'İzolasyon',
      isometry: isEn ? 'Isometric' : 'İzometrik'
    };
    return map[type] || type;
  };

  const diffColor = (diff) => {
    if (diff === 'Başlangıç' || diff === 'Beginner') return '#4ade80';
    if (diff === 'Orta' || diff === 'Intermediate') return '#fbbf24';
    return '#f87171';
  };

  return (
    <div className="page-shell fade-in">
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))',
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
                  padding: '0.9rem 0.5rem',
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
                <span style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{mg.icon}</span>
                <span style={{
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  fontSize: '0.82rem',
                  textAlign: 'center',
                  lineHeight: 1.2
                }}>
                  {isEn ? (mg.name_en || mg.name) : mg.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {selectedGroup && (
        <div className="fade-in">

          {/* ============ ANATOMİ BİLGİ KARTI ============ */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              margin: '0 0 10px 0',
              fontSize: '1.15rem',
              color: 'var(--accent-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <BookOpen size={18} />
              {isEn ? (selectedGroup.name_en || selectedGroup.name) : selectedGroup.name}
            </h3>

            <p style={{ margin: '0 0 14px 0', color: 'var(--text-light)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              {isEn ? (selectedGroup.description_en || selectedGroup.description) : selectedGroup.description}
            </p>

            <h4 style={{
              margin: '0 0 8px 0',
              fontSize: '0.85rem',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Layers size={14} /> {t('anatomy_sub_muscles')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {(isEn && selectedGroup.subMuscles ? selectedGroup.subMuscles.map(sm => ({ name: sm.name_en || sm.name, function: sm.function_en || sm.function })) : selectedGroup.subMuscles).map((sm, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  borderLeft: '3px solid var(--accent-primary)'
                }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '3px' }}>
                    {sm.name}
                  </div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.8rem', lineHeight: 1.45 }}>
                    {sm.function}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{
                background: 'rgba(0, 195, 255, 0.07)',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <Info size={15} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ color: 'var(--text-light)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  {isEn ? (selectedGroup.trainingNote_en || selectedGroup.trainingNote) : selectedGroup.trainingNote}
                </span>
              </div>
              <div style={{
                background: 'rgba(168, 85, 247, 0.08)',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <Zap size={15} color="#a855f7" style={{ flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                  {t('anatomy_weekly_sets')}: {isEn ? selectedGroup.weeklySets.replace('Haftada', 'Weekly') : selectedGroup.weeklySets}
                </span>
              </div>
            </div>
          </div>

          {/* ============ FİLTRELER ============ */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '1rem',
            alignItems: 'center'
          }}>
            <Filter size={15} color="var(--text-light)" />
            <button
              onClick={() => setDifficultyFilter('all')}
              style={{
                background: difficultyFilter === 'all' ? 'var(--accent-primary)' : 'transparent',
                color: difficultyFilter === 'all' ? '#000' : 'var(--text-light)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: difficultyFilter === 'all' ? 'bold' : 'normal'
              }}
            >
              {t('anatomy_filter_all')}
            </button>
            {availableDifficulties.map(d => (
              <button
                key={d}
                onClick={() => setDifficultyFilter(prev => prev === d ? 'all' : d)}
                style={{
                  background: difficultyFilter === d ? diffColor(d) : 'transparent',
                  color: difficultyFilter === d ? '#000' : 'var(--text-light)',
                  border: `1px solid ${difficultyFilter === d ? diffColor(d) : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: difficultyFilter === d ? 'bold' : 'normal'
                }}
              >
                {isEn ? (EXERCISES_DB.find(e => e.difficulty === d)?.difficulty_en || d) : d}
              </button>
            ))}
            <span style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} />
            {availableTypes.map(ty => (
              <button
                key={ty}
                onClick={() => setTypeFilter(prev => prev === ty ? 'all' : ty)}
                style={{
                  background: typeFilter === ty ? 'var(--accent-secondary)' : 'transparent',
                  color: typeFilter === ty ? '#000' : 'var(--text-light)',
                  border: `1px solid ${typeFilter === ty ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: typeFilter === ty ? 'bold' : 'normal'
                }}
              >
                {typeLabel(ty)}
              </button>
            ))}
          </div>

          <h3 style={{
            color: 'var(--accent-secondary)',
            marginBottom: '1rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '0.5rem'
          }}>
            {(isEn ? selectedGroup.name_en : selectedGroup.name)} {t('anatomy_exercises_suffix')} ({filteredExercises.length})
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
                        background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div style={{
                          background: 'rgba(255,255,255,0.1)',
                          padding: '8px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent-primary)',
                          flexShrink: 0
                        }}>
                          <Dumbbell size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', overflowWrap: 'break-word' }}>
                            {isEn ? (ex.name_en || ex.name) : ex.name}
                          </h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: '#000', background: diffColor(ex.difficulty), padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                              {isEn ? (ex.difficulty_en || ex.difficulty) : ex.difficulty}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: '10px' }}>
                              {typeLabel(ex.type)}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                              {isEn ? (ex.equipment_en || ex.equipment) : ex.equipment}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
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
                        {/* Kas hedefleri */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <Target size={14} color="#4ade80" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                              <strong>{t('anatomy_primary')}:</strong> {(isEn ? (ex.primaryMuscles_en || ex.primaryMuscles) : ex.primaryMuscles).join(', ')}
                            </span>
                          </div>
                          {(isEn ? (ex.secondaryMuscles_en || ex.secondaryMuscles) : ex.secondaryMuscles).length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                              <Target size={14} color="var(--accent-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                <strong>{t('anatomy_secondary')}:</strong> {(isEn ? (ex.secondaryMuscles_en || ex.secondaryMuscles) : ex.secondaryMuscles).join(', ')}
                              </span>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <Repeat size={14} color="var(--accent-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                              <strong>{t('anatomy_rep_range')}:</strong> {isEn ? (ex.repRange_en || ex.repRange) : ex.repRange}
                            </span>
                          </div>
                        </div>

                        {/* İpuçları */}
                        <h5 style={{ margin: '0 0 8px 0', color: 'var(--accent-secondary)', fontSize: '0.85rem' }}>{t('anatomy_tips')}:</h5>
                        <ul style={{ margin: '0 0 14px 0', paddingLeft: '1.2rem', color: 'var(--text-light)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                          {(isEn ? (ex.tips_en || ex.tips) : ex.tips).map((tip, idx) => (
                            <li key={idx} style={{ marginBottom: '6px' }}>{tip}</li>
                          ))}
                        </ul>

                        {/* Sık yapılan hatalar */}
                        {(isEn ? (ex.commonMistakes_en || ex.commonMistakes) : ex.commonMistakes)?.length > 0 && (
                          <>
                            <h5 style={{ margin: '0 0 8px 0', color: '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <AlertTriangle size={14} /> {t('anatomy_mistakes')}:
                            </h5>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-light)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                              {(isEn ? (ex.commonMistakes_en || ex.commonMistakes) : ex.commonMistakes).map((m, idx) => (
                                <li key={idx} style={{ marginBottom: '6px' }}>{m}</li>
                              ))}
                            </ul>
                          </>
                        )}
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

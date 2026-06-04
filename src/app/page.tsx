'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Keyboard3D from '@/components/Keyboard3D';
import TierBadge, { getTierInfo } from '@/components/TierBadge';
import { Play, RotateCcw, AlertTriangle, CheckCircle, ArrowRight, BarChart2, Clock } from 'lucide-react';

interface TextData {
  id: number;
  title: string;
  content: string;
  category: string;
}

export default function Home() {
  const router = useRouter();
  
  // Game Configuration States
  const [texts, setTexts] = useState<TextData[]>([]);
  const [selectedTextIdx, setSelectedTextIdx] = useState<number>(0);
  const [timeLimit, setTimeLimit] = useState<number>(30); // 15, 30, 60, or 0 (free type)
  const [loadingTexts, setLoadingTexts] = useState(true);

  // Typing Game Play States
  const [inputText, setInputText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  
  // Scoring Metrics
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [cpm, setCpm] = useState(0);
  
  // UI & Animation helper states
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [isIncorrect, setIsIncorrect] = useState(false);
  const [targetChar, setTargetChar] = useState<string | null>(null);
  
  // Database submission state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savingStats, setSavingStats] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Refs for timer and focusing
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const errorResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for stable keyboard handling
  const currentIndexRef = useRef<number>(0);
  const isStartedRef = useRef<boolean>(false);
  const isFinishedRef = useRef<boolean>(false);
  const activeTextRef = useRef<string>('');
  const correctKeystrokesRef = useRef<number>(0);
  const totalKeystrokesRef = useRef<number>(0);

  // Load texts from DB on mount
  useEffect(() => {
    const fetchTexts = async () => {
      try {
        const res = await fetch('/api/texts');
        if (res.ok) {
          const data = await res.json();
          setTexts(data.texts || []);
          if (data.texts && data.texts.length > 0) {
            setSelectedTextIdx(0);
            setTimeLeft(timeLimit);
          }
        }
      } catch (err) {
        console.error('Failed to fetch texts', err);
      } finally {
        setLoadingTexts(false);
      }
    };

    const checkUserAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setIsLoggedIn(data.authenticated);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchTexts();
    checkUserAuth();
  }, []);

  // Update timeLeft when timeLimit config changes
  useEffect(() => {
    if (!isStarted && !isFinished) {
      setTimeLeft(timeLimit);
    }
  }, [timeLimit, isStarted, isFinished]);

  // Current active practice text content
  const activeText = texts[selectedTextIdx]?.content || 'Select a text or wait for loading...';

  const isLetter = (char: string) => /^[a-zA-Z]$/.test(char);
  const isCharMatch = (expected: string | undefined, actual: string) => {
    if (expected === undefined) return false;
    if (expected === actual) return true;
    if (isLetter(expected) && isLetter(actual)) {
      return expected.toLowerCase() === actual.toLowerCase();
    }
    return false;
  };

  // Determine current target character
  useEffect(() => {
    if (isFinished || activeText.length === 0) {
      setTargetChar(null);
      return;
    }
    
    if (currentIndex >= activeText.length) {
      setTargetChar('enter'); // Prompt user to finish with enter
    } else {
      setTargetChar(activeText[currentIndex]);
    }
  }, [currentIndex, activeText, isFinished]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    isStartedRef.current = isStarted;
  }, [isStarted]);

  useEffect(() => {
    isFinishedRef.current = isFinished;
  }, [isFinished]);

  useEffect(() => {
    activeTextRef.current = activeText;
  }, [activeText]);

  useEffect(() => {
    correctKeystrokesRef.current = correctKeystrokes;
  }, [correctKeystrokes]);

  useEffect(() => {
    totalKeystrokesRef.current = totalKeystrokes;
  }, [totalKeystrokes]);

  // Reset function
  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setInputText('');
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setIsStarted(false);
    isStartedRef.current = false;
    setIsFinished(false);
    isFinishedRef.current = false;
    setTimeLeft(timeLimit);
    setTotalKeystrokes(0);
    totalKeystrokesRef.current = 0;
    setCorrectKeystrokes(0);
    correctKeystrokesRef.current = 0;
    setErrorCount(0);
    setWpm(0);
    setAccuracy(100);
    setCpm(0);
    setPressedKeys(new Set());
    setIsIncorrect(false);
    setSaveStatus('idle');
  };

  // Trigger test completion
  const handleFinish = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFinished(true);
    
    const timeElapsed = timeLimit > 0 ? timeLimit - timeLeft : (Date.now() - startTimeRef.current) / 1000;
    const finalTimeMin = Math.max(timeElapsed, 1) / 60;
    const finalCorrect = correctKeystrokesRef.current;
    const finalTotal = totalKeystrokesRef.current;
    
    const finalWpm = Math.round((finalCorrect / 5) / finalTimeMin);
    const finalCpm = Math.round(finalCorrect / finalTimeMin);
    const finalAccuracy = finalTotal > 0 ? Math.round((finalCorrect / finalTotal) * 100) : 100;
    
    setWpm(finalWpm);
    setCpm(finalCpm);
    setAccuracy(finalAccuracy);
    
    if (isLoggedIn) {
      saveTypingStats(finalWpm, finalCpm, finalAccuracy, timeElapsed);
    }
  };

  // Submit WPM stats to DB
  const saveTypingStats = async (finalWpm: number, finalCpm: number, finalAcc: number, duration: number) => {
    setSavingStats(true);
    setSaveStatus('idle');
    try {
      const modeString = timeLimit > 0 ? `timed_${timeLimit}` : 'complete_text';
      const res = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wpm: finalWpm,
          cpm: finalCpm,
          accuracy: finalAcc,
          testMode: modeString,
          duration: Math.round(duration),
        })
      });

      if (res.ok) {
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setSavingStats(false);
    }
  };

  // Start the timer
  const startTimer = () => {
    setIsStarted(true);
    isStartedRef.current = true;
    startTimeRef.current = Date.now();
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
        
        // Calculate real-time stats
        const timeElapsedMin = Math.max(timeElapsed, 1) / 60;
        setWpm(Math.round((correctKeystrokesRef.current / 5) / timeElapsedMin));
        setCpm(Math.round(correctKeystrokesRef.current / timeElapsedMin));
        
        if (timeLimit > 0) {
          const nextTime = Math.max(timeLimit - Math.floor(timeElapsed), 0);
          if (nextTime <= 0) {
            clearInterval(timerRef.current!);
            // Trigger finish in next tick to avoid state clashes
            setTimeout(handleFinish, 50);
            return 0;
          }
          return nextTime;
        }
        return prev + 1; // Count up for free type
      });
    }, 1000);
  };

  // Global keypress listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      const key = e.key;

      if (key === 'Tab') {
        e.preventDefault();
        handleReset();
        return;
      }

      if (key === 'Escape') {
        e.preventDefault();
        handleReset();
        return;
      }

      if (key === ' ') {
        e.preventDefault();
      }

      if (isFinishedRef.current) return;

      const keyLower = key.toLowerCase();
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.add(keyLower);
        return next;
      });

      if (e.altKey || e.ctrlKey || e.metaKey || key.length > 1) {
        if (key === 'Backspace' && currentIndexRef.current > 0) {
          setCurrentIndex(prev => {
            const nextIndex = prev - 1;
            currentIndexRef.current = nextIndex;
            return nextIndex;
          });
          setInputText(prev => prev.slice(0, -1));
          setCorrectKeystrokes(prev => {
            const nextCorrect = Math.max(prev - 1, 0);
            correctKeystrokesRef.current = nextCorrect;
            return nextCorrect;
          });
        }
        return;
      }

      if (!isStartedRef.current) {
        startTimer();
      }

      setTotalKeystrokes(prev => {
        const nextTotal = prev + 1;
        totalKeystrokesRef.current = nextTotal;
        return nextTotal;
      });

      const expectedChar = activeTextRef.current[currentIndexRef.current];
      const isMatch = isCharMatch(expectedChar, key);

      if (isMatch) {
        setCorrectKeystrokes(prev => {
          const nextCorrect = prev + 1;
          correctKeystrokesRef.current = nextCorrect;
          return nextCorrect;
        });
        setInputText(prev => prev + key);
        setCurrentIndex(prev => {
          const nextIndex = prev + 1;
          currentIndexRef.current = nextIndex;
          return nextIndex;
        });
        setIsIncorrect(false);

        if (currentIndexRef.current + 1 >= activeTextRef.current.length) {
          setTimeout(handleFinish, 100);
        }
      } else {
        setErrorCount(prev => prev + 1);
        setIsIncorrect(true);
        if (errorResetTimeoutRef.current) clearTimeout(errorResetTimeoutRef.current);
        errorResetTimeoutRef.current = setTimeout(() => {
          setIsIncorrect(false);
        }, 150);
      }

      setAccuracy(() => {
        const total = totalKeystrokesRef.current + 1;
        const correct = isMatch ? correctKeystrokesRef.current + 1 : correctKeystrokesRef.current;
        return Math.round((correct / total) * 100);
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyLower = e.key.toLowerCase();
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(keyLower);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (errorResetTimeoutRef.current) clearTimeout(errorResetTimeoutRef.current);
    };
  }, []);

  // Sync scroll of the typing text box so the cursor is always in view
  useEffect(() => {
    if (textContainerRef.current) {
      const currentEl = textContainerRef.current.querySelector('.char-current');
      if (currentEl) {
        (currentEl as HTMLElement).scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentIndex]);

  const progressPercent = activeText.length > 0 ? (currentIndex / activeText.length) * 100 : 0;
  const currentTier = getTierInfo(wpm);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', margin: '20px 0' }}>
      
      {/* 1. Header controls panel */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Practice Text:</span>
          {loadingTexts ? (
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading texts...</span>
          ) : (
            <select
              value={selectedTextIdx}
              onChange={(e) => {
                setSelectedTextIdx(Number(e.target.value));
                handleReset();
              }}
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border)',
                padding: '6px 12px',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
              disabled={isStarted}
            >
              {texts.map((t, idx) => (
                <option key={t.id} value={idx}>{t.title} ({t.category})</option>
              ))}
            </select>
          )}
        </div>

        {/* Time Limit selection */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginRight: '5px' }}><Clock size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Time Limit:</span>
          {[15, 30, 60].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTimeLimit(t);
                handleReset();
              }}
              className={`btn ${timeLimit === t ? 'btn-outline-cyan' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              disabled={isStarted}
            >
              {t}s
            </button>
          ))}
          <button
            onClick={() => {
              setTimeLimit(0); // unlimited
              handleReset();
            }}
            className={`btn ${timeLimit === 0 ? 'btn-outline-cyan' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            disabled={isStarted}
          >
            No Limit
          </button>
        </div>
      </div>

      {/* 2. Main Typing Practice Area */}
      <div className="glass-panel" style={{ padding: '30px', position: 'relative' }}>
        
        {/* Real-time metrics bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
          <div style={{ display: 'flex', gap: '30px' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>Speed</span>
              <strong style={{ fontSize: '2rem', color: 'var(--accent-cyan)' }}>{wpm}</strong> <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>WPM</span>
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>Accuracy</span>
              <strong style={{ fontSize: '2rem', color: 'var(--accent-violet)' }}>{accuracy}%</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>Rhythm</span>
              <strong style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>{cpm}</strong> <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>CPM</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>
              {timeLimit > 0 ? 'Time Remaining' : 'Time Elapsed'}
            </span>
            <strong style={{ fontSize: '2rem', color: timeLeft <= 5 && timeLimit > 0 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
              {timeLimit > 0 ? `${timeLeft}s` : `${timeLeft}s`}
            </strong>
          </div>
        </div>

        {/* Text Area */}
        <div 
          ref={textContainerRef}
          className="typing-box-container"
          style={{
            background: 'rgba(8, 11, 17, 0.4)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--glass-border)',
            marginBottom: '20px',
            minHeight: '120px',
          }}
        >
          {activeText.split('').map((char, index) => {
            let charClass = 'char-untyped';
            if (index < currentIndex) {
              charClass = isCharMatch(char, inputText[index]) ? 'char-correct' : 'char-incorrect';
            } else if (index === currentIndex) {
              charClass = 'char-current';
            }

            return (
              <span key={index} className={`char ${charClass}`}>
                {index === currentIndex && <span className="caret"></span>}
                {char}
              </span>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div style={{ height: '4px', width: '100%', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden', marginBottom: '15px' }}>
          <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-violet))', transition: 'width 0.1s ease' }} />
        </div>

        {/* Hotkeys tips & reset */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Tip: Press <kbd style={{ padding: '2px 6px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>Tab</kbd> or <kbd style={{ padding: '2px 6px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>Esc</kbd> to restart.
          </span>
          
          <button onClick={handleReset} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <RotateCcw size={14} /> Restart Test
          </button>
        </div>

        {/* 3. Results Summary Modal Overlay */}
        {isFinished && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(8, 11, 17, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--glass-border)'
          }}>
            <div style={{ textAlign: 'center', maxWidth: '480px', width: '100%' }}>
              <div style={{ marginBottom: '15px' }}>
                <CheckCircle size={48} className="text-gradient" style={{ margin: '0 auto 10px' }} />
                <h3 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800 }}>Test Completed!</h3>
              </div>

              {/* Tier Badge Display */}
              <div style={{ margin: '20px 0' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Your Rank Tier</span>
                <TierBadge wpm={wpm} size="lg" />
              </div>

              {/* Stats Block */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '15px', 
                background: 'var(--bg-secondary)', 
                padding: '20px', 
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--glass-border)',
                marginBottom: '25px'
              }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>WPM</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{wpm}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Accuracy</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-violet)' }}>{accuracy}%</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Errors</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-rose)' }}>{errorCount}</div>
                </div>
              </div>

              {/* Saving results indicator */}
              <div style={{ marginBottom: '20px', fontSize: '0.9rem' }}>
                {savingStats && (
                  <span style={{ color: 'var(--text-secondary)' }}>Saving your score to database...</span>
                )}
                {saveStatus === 'saved' && (
                  <span style={{ color: 'var(--accent-green)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Score recorded in leaderboard!
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span style={{ color: 'var(--accent-rose)' }}>Could not save score. Database connection error.</span>
                )}
                {!isLoggedIn && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>
                      Sign in to track progress & submit scores to the Leaderboard!
                    </span>
                    <button 
                      onClick={() => router.push('/login')} 
                      className="btn btn-outline-cyan"
                      style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                    >
                      Login Now <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button onClick={handleReset} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                  <RotateCcw size={16} /> Try Again
                </button>
                {!isFinished && isLoggedIn && (
                  <button onClick={() => router.push('/dashboard')} className="btn btn-secondary" style={{ padding: '10px 24px' }}>
                    <BarChart2 size={16} /> Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Interactive 3D Keyboard */}
      <div className="glass-panel" style={{ padding: '20px 30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Mechanical Simulator
          </h4>
          <div style={{ display: 'flex', gap: '15px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'var(--accent-cyan)', borderRadius: '2px' }} /> Next Target Key
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'var(--accent-violet)', borderRadius: '2px' }} /> Pressed Key
            </span>
          </div>
        </div>
        
        <Keyboard3D 
          pressedKeys={pressedKeys} 
          targetKey={targetChar} 
          isIncorrect={isIncorrect} 
        />
      </div>

    </div>
  );
}

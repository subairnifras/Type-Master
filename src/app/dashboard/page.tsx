'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TierBadge, { getTierInfo } from '@/components/TierBadge';
import { Award, BarChart2, Calendar, ShieldCheck, TrendingUp, History, Clock } from 'lucide-react';

interface TypingStat {
  id: number;
  wpm: number;
  cpm: number;
  accuracy: number;
  test_mode: string;
  duration: number;
  created_at: string;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<TypingStat[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch user profile
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login');
          return;
        }
        const userData = await userRes.json();
        if (!userData.authenticated) {
          router.push('/login');
          return;
        }
        setUser(userData.user);

        // 2. Fetch user typing stats
        const statsRes = await fetch('/api/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Loading Dashboard...</div>
      </div>
    );
  }

  if (!user) return null;

  // Calculate Aggregates
  const totalTests = stats.length;
  const maxWpm = totalTests > 0 ? Math.max(...stats.map(s => s.wpm)) : 0;
  const avgWpm = totalTests > 0 ? Math.round(stats.reduce((acc, s) => acc + s.wpm, 0) / totalTests) : 0;
  const avgAccuracy = totalTests > 0 ? Math.round(stats.reduce((acc, s) => acc + s.accuracy, 0) / totalTests) : 0;

  // SVG Chart Calculations
  // Take last 15 tests for clean visual representation
  const chartStats = stats.slice(-15);
  const chartHeight = 200;
  const chartWidth = 550;
  const padding = 30;

  let svgPath = '';
  let svgPoints: { x: number; y: number; wpm: number; idx: number }[] = [];

  if (chartStats.length > 1) {
    const wpmValues = chartStats.map(s => s.wpm);
    const minVal = Math.max(Math.min(...wpmValues) - 10, 0);
    const maxVal = Math.max(...wpmValues) + 10;
    const valRange = maxVal - minVal || 1;

    svgPoints = chartStats.map((s, idx) => {
      const x = padding + (idx * (chartWidth - padding * 2)) / (chartStats.length - 1);
      const y = chartHeight - padding - ((s.wpm - minVal) * (chartHeight - padding * 2)) / valRange;
      return { x, y, wpm: s.wpm, idx };
    });

    svgPath = svgPoints.reduce(
      (path, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`),
      ''
    );
  }

  const formatMode = (mode: string) => {
    if (mode.startsWith('timed_')) return `${mode.split('_')[1]}s timed`;
    if (mode === 'complete_text') return 'Full text';
    return mode;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* 1. Profile Summary Banner */}
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: 'var(--border-radius-full)',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            color: '#fff',
            boxShadow: 'var(--shadow-neon-violet)'
          }}>
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{user.username}</h2>
              {user.role === 'admin' && (
                <span style={{ 
                  background: 'rgba(245, 158, 11, 0.12)', 
                  border: '1px solid rgba(245, 158, 11, 0.4)', 
                  color: 'var(--accent-gold)', 
                  padding: '2px 8px', 
                  borderRadius: 'var(--border-radius-full)', 
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <ShieldCheck size={12} /> Administrator
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Joined {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {/* Tier rank status card */}
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Current Tier Rating
          </span>
          <TierBadge wpm={maxWpm} size="lg" />
        </div>
      </div>

      {/* 2. Grid Cards of Typing Statistics */}
      <div className="dashboard-grid">
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>High Speed (WPM)</span>
          <strong style={{ fontSize: '2.5rem', color: 'var(--accent-cyan)' }}>{maxWpm}</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Your absolute typing speed peak</span>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Average Speed (WPM)</span>
          <strong style={{ fontSize: '2.5rem', color: 'var(--accent-violet)' }}>{avgWpm}</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mean speed across all tests</span>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Average Accuracy</span>
          <strong style={{ fontSize: '2.5rem', color: 'var(--accent-green)' }}>{avgAccuracy}%</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Precision rate across all exercises</span>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Tests Completed</span>
          <strong style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>{totalTests}</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total typing tests successfully taken</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        
        {/* 3. WPM Progression Chart Card */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} className="text-gradient" /> WPM Progression (Recent 15 tests)
          </h3>

          {chartStats.length < 2 ? (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', border: '1px dashed var(--glass-border)', borderRadius: 'var(--border-radius-md)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Complete at least 2 tests to display your history graph!
              </span>
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.1)" />

                {/* Path line */}
                <path d={svgPath} fill="none" stroke="var(--accent-cyan)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {/* Area Gradient under curve */}
                <path
                  d={`${svgPath} L ${svgPoints[svgPoints.length - 1].x} ${chartHeight - padding} L ${svgPoints[0].x} ${chartHeight - padding} Z`}
                  fill="url(#chartGradient)"
                />

                {/* Circles & Labels */}
                {svgPoints.map((pt, idx) => (
                  <g key={idx}>
                    <circle cx={pt.x} cy={pt.y} r="5" fill="var(--bg-secondary)" stroke="var(--accent-cyan)" strokeWidth="2" />
                    <text x={pt.x} y={pt.y - 10} fill="var(--text-secondary)" fontSize="10" textAnchor="middle" fontWeight="bold">
                      {pt.wpm}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>

        {/* 4. Recent Test History Logs Card */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} className="text-gradient" /> Recent Test History
          </h3>

          <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                No records yet. Start practicing to generate history log!
              </div>
            ) : (
              stats.slice().reverse().map((stat) => (
                <div 
                  key={stat.id} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--glass-border)',
                    padding: '12px 16px',
                    borderRadius: 'var(--border-radius-md)'
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem' }}>{stat.wpm} WPM</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                      Accuracy: {stat.accuracy}% | Mode: {formatMode(stat.test_mode)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatDate(stat.created_at)}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <Clock size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} /> {stat.duration}s
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

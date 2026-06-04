'use client';

import React, { useEffect, useState } from 'react';
import TierBadge from '@/components/TierBadge';
import { Trophy, Star, Target, Keyboard, Award } from 'lucide-react';

interface LeaderboardEntry {
  id: number;
  username: string;
  avatarUrl: string | null;
  maxWpm: number;
  maxCpm: number;
  avgAccuracy: number;
  testsCompleted: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.leaderboard || []);
        }
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={20} style={{ color: 'var(--accent-gold)' }} />;
    if (rank === 2) return <Trophy size={20} style={{ color: 'var(--accent-silver)' }} />;
    if (rank === 3) return <Trophy size={20} style={{ color: 'var(--accent-bronze)' }} />;
    return <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{rank}</span>;
  };

  const getRankRowStyle = (rank: number) => {
    if (rank === 1) return { background: 'rgba(245, 158, 11, 0.05)', borderLeft: '3px solid var(--accent-gold)' };
    if (rank === 2) return { background: 'rgba(148, 163, 184, 0.03)', borderLeft: '3px solid var(--accent-silver)' };
    if (rank === 3) return { background: 'rgba(180, 83, 9, 0.03)', borderLeft: '3px solid var(--accent-bronze)' };
    return {};
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Page Title Banner */}
      <div className="glass-panel" style={{ padding: '40px 30px', textAlign: 'center' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '10px' }}>
          Global Leaderboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
          Compete with typewriter pros from around the world. Ranks are determined by highest WPM followed by accuracy rating.
        </p>
      </div>

      {/* Leaderboard Table Container */}
      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Loading leaderboard ranks...</span>
          </div>
        ) : leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            No records found. Be the first to take a test and secure Rank 1!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px 16px', width: '80px' }}>Rank</th>
                <th style={{ padding: '12px 16px' }}>User</th>
                <th style={{ padding: '12px 16px', width: '180px' }}>Tier</th>
                <th style={{ padding: '12px 16px' }}><Star size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Peak Speed</th>
                <th style={{ padding: '12px 16px' }}><Keyboard size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Peak CPM</th>
                <th style={{ padding: '12px 16px' }}><Target size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Avg Accuracy</th>
                <th style={{ padding: '12px 16px' }}><Award size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Exercises</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => {
                const rank = idx + 1;
                return (
                  <tr 
                    key={entry.id} 
                    style={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.03)', 
                      fontSize: '0.95rem',
                      transition: 'background 0.2s ease',
                      ...getRankRowStyle(rank)
                    }}
                    className="leaderboard-row"
                  >
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {getRankIcon(rank)}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--border-radius-full)',
                          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#fff'
                        }}>
                          {entry.username[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{entry.username}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <TierBadge wpm={entry.maxWpm} size="sm" />
                    </td>
                    <td style={{ padding: '16px', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                      {entry.maxWpm} <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>WPM</span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                      {entry.maxCpm} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CPM</span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--accent-violet)', fontWeight: 600 }}>
                      {entry.avgAccuracy}%
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                      {entry.testsCompleted}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Keyboard, LogOut, ShieldAlert, Trophy, User } from 'lucide-react';

interface UserData {
  id: number;
  username: string;
  role: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch session on load and route changes
  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Session check failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link href="/" className="logo">
          <Keyboard className="text-gradient" size={28} />
          <span className="text-gradient">Type Master</span>
        </Link>

        <div className="nav-links">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            Practice
          </Link>
          <Link 
            href="/leaderboard" 
            className={`nav-link ${pathname === '/leaderboard' ? 'active' : ''} flex-align`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Trophy size={16} /> Leaderboard
          </Link>

          {!loading && user && (
            <>
              <Link 
                href="/dashboard" 
                className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <User size={16} /> Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link 
                  href="/admin" 
                  className={`nav-link ${pathname.startsWith('/admin') ? 'active' : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-gold)' }}
                >
                  <ShieldAlert size={16} /> Admin
                </Link>
              )}
            </>
          )}

          {loading ? (
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Checking session...</span>
          ) : user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Welcome, <strong style={{ color: 'var(--text-primary)' }}>{user.username}</strong>
              </span>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                <LogOut size={14} /> Log out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link href="/login" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
                Sign In
              </Link>
              <Link href="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

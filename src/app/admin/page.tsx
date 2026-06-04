'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Users, BookOpen, BarChart2, Plus, Edit2, Trash2, ArrowLeft, Check } from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalTests: number;
  avgWpm: number;
  avgAccuracy: number;
}

interface UserEntry {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

interface TextEntry {
  id: number;
  title: string;
  content: string;
  category: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'texts'>('analytics');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Data states
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [texts, setTexts] = useState<TextEntry[]>([]);

  // Form states for texts
  const [textId, setTextId] = useState<number | null>(null);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textCategory, setTextCategory] = useState('general');
  const [formMode, setFormMode] = useState<'list' | 'add' | 'edit'>('list');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Authorize and Load Analytics
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (!data.authenticated || data.user.role !== 'admin') {
          router.push('/');
          return;
        }
        setIsAdmin(true);
        loadAnalytics();
      } catch (err) {
        router.push('/');
      }
    };
    checkAdmin();
  }, [router]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTexts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/texts');
      if (res.ok) {
        const data = await res.json();
        setTexts(data.texts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sync tab loading
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'analytics') loadAnalytics();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'texts') {
      loadTexts();
      setFormMode('list');
    }
  }, [activeTab, isAdmin]);

  // User Actions
  const handleToggleRole = async (userId: number, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: nextRole })
      });
      if (res.ok) {
        loadUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to toggle role');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? All their stats will be permanently removed!')) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Text Actions
  const handleAddTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch('/api/admin/texts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: textTitle, content: textContent, category: textCategory })
      });
      if (res.ok) {
        setFormSuccess('Typing prompt added successfully!');
        setTextTitle('');
        setTextContent('');
        setTextCategory('general');
        setTimeout(() => {
          setFormMode('list');
          loadTexts();
        }, 1000);
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to add text');
      }
    } catch (err) {
      setFormError('Connection error.');
    }
  };

  const handleEditTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch('/api/admin/texts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textId, title: textTitle, content: textContent, category: textCategory })
      });
      if (res.ok) {
        setFormSuccess('Typing prompt updated!');
        setTimeout(() => {
          setFormMode('list');
          loadTexts();
        }, 1000);
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to update text');
      }
    } catch (err) {
      setFormError('Connection error.');
    }
  };

  const handleDeleteText = async (id: number) => {
    if (!confirm('Are you sure you want to delete this typing prompt?')) return;
    try {
      const res = await fetch(`/api/admin/texts?textId=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        loadTexts();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete prompt');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditText = (item: TextEntry) => {
    setTextId(item.id);
    setTextTitle(item.title);
    setTextContent(item.content);
    setTextCategory(item.category);
    setFormMode('edit');
  };

  if (!isAdmin) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <ShieldAlert size={36} style={{ color: 'var(--accent-gold)' }} />
          <div>
            <h1 className="text-gradient-gold" style={{ fontSize: '2rem', fontWeight: 800 }}>Admin Panel</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
              Manage typing prompts, user permissions, and system analytics.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`btn ${activeTab === 'analytics' ? 'btn-outline-cyan' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <BarChart2 size={14} /> Analytics
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`btn ${activeTab === 'users' ? 'btn-outline-cyan' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <Users size={14} /> Users
          </button>
          <button 
            onClick={() => setActiveTab('texts')}
            className={`btn ${activeTab === 'texts' ? 'btn-outline-cyan' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <BookOpen size={14} /> Typing Texts
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh' }}>
          <div style={{ color: 'var(--text-secondary)' }}>Loading Dashboard Section...</div>
        </div>
      ) : (
        <>
          {/* TAB 1: ANALYTICS */}
          {activeTab === 'analytics' && analytics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="dashboard-grid">
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Registered Players</span>
                  <h3 style={{ fontSize: '2.5rem', margin: '10px 0 5px', color: 'var(--accent-cyan)' }}>{analytics.totalUsers}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total player profiles</span>
                </div>
                
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Typing Exercises Run</span>
                  <h3 style={{ fontSize: '2.5rem', margin: '10px 0 5px', color: 'var(--accent-violet)' }}>{analytics.totalTests}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tests submitted to DB</span>
                </div>

                <div className="glass-panel" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Global Average Speed</span>
                  <h3 style={{ fontSize: '2.5rem', margin: '10px 0 5px', color: 'var(--accent-green)' }}>{analytics.avgWpm} WPM</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Global typing speed average</span>
                </div>

                <div className="glass-panel" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Global Average Accuracy</span>
                  <h3 style={{ fontSize: '2.5rem', margin: '10px 0 5px', color: 'var(--accent-gold)' }}>{analytics.avgAccuracy}%</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Precision rate average</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '12px 16px' }}>User ID</th>
                    <th style={{ padding: '12px 16px' }}>Username</th>
                    <th style={{ padding: '12px 16px' }}>Email</th>
                    <th style={{ padding: '12px 16px' }}>Role</th>
                    <th style={{ padding: '12px 16px' }}>Registered At</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '16px', color: 'var(--text-muted)' }}>#{u.id}</td>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{u.username}</td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          background: u.role === 'admin' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
                          border: u.role === 'admin' ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--glass-border)',
                          color: u.role === 'admin' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleToggleRole(u.id, u.role)}
                            className="btn btn-secondary" 
                            style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                          >
                            Toggle Role
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="btn btn-secondary" 
                            style={{ padding: '5px 10px', fontSize: '0.75rem', color: 'var(--accent-rose)', borderColor: 'rgba(244,63,94,0.2)' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: TYPING TEXTS CONFIG */}
          {activeTab === 'texts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {formMode === 'list' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => {
                      setTextTitle('');
                      setTextContent('');
                      setTextCategory('general');
                      setFormError(null);
                      setFormSuccess(null);
                      setFormMode('add');
                    }}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    <Plus size={14} /> Add New Text
                  </button>
                </div>
              )}

              {formMode === 'list' ? (
                <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <th style={{ padding: '12px 16px', width: '180px' }}>Title</th>
                        <th style={{ padding: '12px 16px', width: '120px' }}>Category</th>
                        <th style={{ padding: '12px 16px' }}>Text Content</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', width: '150px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {texts.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '16px', fontWeight: 600 }}>{t.title}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                              {t.category}
                            </span>
                          </td>
                          <td style={{ padding: '16px', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.content}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={() => startEditText(t)}
                                className="btn btn-secondary" 
                                style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                              >
                                <Edit2 size={12} /> Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteText(t.id)}
                                className="btn btn-secondary" 
                                style={{ padding: '5px 10px', fontSize: '0.75rem', color: 'var(--accent-rose)', borderColor: 'rgba(244,63,94,0.2)' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Add / Edit Form Pane */
                <div className="glass-panel" style={{ padding: '30px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <button 
                      onClick={() => setFormMode('list')} 
                      className="btn btn-secondary" 
                      style={{ padding: '5px', borderRadius: 'var(--border-radius-sm)' }}
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                      {formMode === 'add' ? 'Add New Typing Practice Prompt' : 'Edit Typing Practice Prompt'}
                    </h3>
                  </div>

                  {formError && (
                    <div style={{ backgroundColor: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: 'var(--accent-rose)', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.85rem' }}>
                      {formError}
                    </div>
                  )}

                  {formSuccess && (
                    <div style={{ backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--accent-green)', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> {formSuccess}
                    </div>
                  )}

                  <form onSubmit={formMode === 'add' ? handleAddTextSubmit : handleEditTextSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="textTitle">Title</label>
                      <input 
                        id="textTitle"
                        type="text" 
                        className="form-input" 
                        value={textTitle}
                        onChange={(e) => setTextTitle(e.target.value)}
                        placeholder="e.g. Technology Trends"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="textCategory">Category</label>
                      <select 
                        id="textCategory"
                        className="form-input"
                        value={textCategory}
                        onChange={(e) => setTextCategory(e.target.value)}
                        style={{ background: 'rgba(8,11,17,0.8)' }}
                      >
                        <option value="general">General</option>
                        <option value="hardware">Hardware</option>
                        <option value="technology">Technology</option>
                        <option value="science">Science</option>
                        <option value="philosophy">Philosophy</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="textContent">Paragraph Content</label>
                      <textarea 
                        id="textContent"
                        className="form-input" 
                        rows={6}
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Type the practice text content that the user must type..."
                        style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}
                        required
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      style={{ padding: '10px', marginTop: '10px', fontSize: '0.95rem' }}
                    >
                      {formMode === 'add' ? 'Save Prompt' : 'Update Prompt'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
}

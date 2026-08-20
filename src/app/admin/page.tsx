'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';

export default function AdminPage() {
  const [passcode, setPasscode] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; status?: any } | null>(null);

  const canDelete = passcode.length > 0 && confirmText === 'DELETE ALL';

  async function handleClear() {
    if (!canDelete) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/clear-leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, message: data.message, status: data.status });
        setConfirmText('');
        setPasscode('');
      } else {
        setResult({ success: false, message: data.error || 'Failed to clear leaderboard.' });
      }
    } catch (err) {
      setResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Console</h1>
      <p className={styles.subtitle}>Manage the global leaderboard data</p>

      <div className={styles.card}>
        <div className={styles.inputGroup}>
          <label>Admin Passcode</label>
          <input
            type="password"
            className={styles.input}
            placeholder="Enter admin passcode..."
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
          />
        </div>

        <div className={styles.dangerZone}>
          <div className={styles.dangerTitle}>⚠️ Danger Zone</div>
          <p className={styles.dangerDescription}>
            This will permanently delete <strong>all leaderboard data</strong> from SQLite, Redis, and Supabase.
            This action cannot be undone. Type <strong>DELETE ALL</strong> below to confirm.
          </p>
          <input
            type="text"
            className={`${styles.input} ${styles.dangerInput}`}
            placeholder='Type "DELETE ALL" to confirm...'
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
          />
          <button
            className={styles.btnDanger}
            disabled={!canDelete || loading}
            onClick={handleClear}
          >
            {loading ? '⏳ Clearing...' : '🗑️ Clear Entire Leaderboard'}
          </button>
        </div>

        {result && (
          <>
            <div className={`${styles.messageBox} ${result.success ? styles.successBox : styles.errorBox}`}>
              {result.success ? '✅' : '❌'} {result.message}
            </div>

            {result.success && result.status && (
              <div className={styles.statusList}>
                <div className={styles.statusItem}>
                  <span>SQLite Database</span>
                  <span className={`${styles.statusBadge} ${result.status.sqlite ? styles.statusSuccess : styles.statusFailed}`}>
                    {result.status.sqlite ? 'Cleared' : 'Failed'}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span>Redis Cache</span>
                  <span className={`${styles.statusBadge} ${result.status.redis ? styles.statusSuccess : styles.statusFailed}`}>
                    {result.status.redis ? 'Cleared' : 'Failed'}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span>Supabase Users</span>
                  <span className={`${styles.statusBadge} ${result.status.supabaseUsers ? styles.statusSuccess : styles.statusFailed}`}>
                    {result.status.supabaseUsers ? 'Cleared' : 'Failed'}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span>Supabase Submissions</span>
                  <span className={`${styles.statusBadge} ${result.status.supabaseSubmissions ? styles.statusSuccess : styles.statusFailed}`}>
                    {result.status.supabaseSubmissions ? 'Cleared' : 'Failed'}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.navRow}>
        <Link href="/leaderboard" className="btn-secondary" style={{ padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', color: 'white', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          📊 View Leaderboard
        </Link>
        <Link href="/" className="btn-secondary" style={{ padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', color: 'white', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          🏠 Home
        </Link>
      </div>
    </div>
  );
}

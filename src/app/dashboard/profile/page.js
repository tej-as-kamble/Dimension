'use client';

import { useState, useEffect } from 'react';
import { getUserProfile, updatePassword } from '@/actions/auth.actions';
import styles from '../dashboard.module.css';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const result = await getUserProfile();
    if (result.success) {
      setUser(result.user);
    }
    setLoading(false);
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData(e.target);
    const result = await updatePassword(formData);

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      e.target.reset();
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setMessage({ type: 'error', text: result.error });
    }

    setFormLoading(false);
  }

  function getInitials(name) {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
      </div>
    );
  }

  // Button disabled until both fields are non-empty
  const isSubmitDisabled =
    formLoading || !newPassword.trim() || !confirmPassword.trim();

  return (
    <div className={styles.profileSection}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Profile</h1>
          <p className={styles.pageSubtitle}>Manage your account settings</p>
        </div>
      </div>

      {/* User Info Card */}
      <div className={`glass-card ${styles.profileCard}`}>
        <div className={styles.profileInfo}>
          <div className={styles.profileAvatar}>
            {user?.image ? (
              <img src={user.image} alt={user.name} />
            ) : (
              getInitials(user?.name)
            )}
          </div>
          <div>
            <div className={styles.profileName}>{user?.name}</div>
            <div className={styles.profileEmail}>{user?.email}</div>
            <div className={styles.profileProvider}>
              Signed in via{' '}
              {user?.authProvider === 'google' ? '🔵 Google' : '🔑 Email'}
            </div>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className={`glass-card ${styles.profileCard}`}>
        <h2
          style={{
            fontSize: '1.1rem',
            fontWeight: 600,
            marginBottom: 'var(--space-5)',
          }}
        >
          🔑 Set Password
        </h2>

        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-5)',
          }}
        >
          {user?.authProvider === 'google' && !user?.hasPassword
            ? 'You signed up with Google. Set a password to also log in with your email and password.'
            : 'Update your account password. You are already signed in, so no current password is required.'}
        </p>

        {message.text && (
          <div
            className={`alert ${
              message.type === 'success' ? 'alert-success' : 'alert-error'
            }`}
            style={{ marginBottom: 'var(--space-4)' }}
          >
            <span>{message.type === 'success' ? '✓' : '⚠'}</span>{' '}
            {message.text}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className={styles.passwordForm}>
          <div className="form-group">
            <label htmlFor="newPassword" className="form-label">
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className="form-input"
              placeholder="Min. 6 characters"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Re-enter new password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitDisabled}
            style={{ alignSelf: 'flex-start' }}
            title={isSubmitDisabled && !formLoading ? 'Fill in both fields to continue' : undefined}
          >
            {formLoading ? (
              <>
                <span className="spinner"></span> Updating...
              </>
            ) : (
              'Set Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

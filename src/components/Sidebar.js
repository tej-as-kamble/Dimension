'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import styles from './Sidebar.module.css';

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/dashboard/profile', label: 'Profile', icon: '👤' },
  ];

  function getInitials(name) {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function isActive(href) {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  }

  return (
    <>
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sidebar"
      >
        ☰
      </button>

      {mobileOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}
      >
        <Link href="/dashboard" className={styles.logo}>
          <div className={styles.logoIcon}>D</div>
          <span className={styles.logoText}>Dimenssion</span>
        </Link>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${
                isActive(item.href) ? styles.navItemActive : ''
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.image ? (
                <img src={user.image} alt={user.name} />
              ) : (
                getInitials(user?.name)
              )}
            </div>
            <div>
              <div className={styles.userName}>{user?.name || 'User'}</div>
              <div className={styles.userEmail}>{user?.email || ''}</div>
            </div>
          </div>
          <button
            className={styles.signOutBtn}
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            ↩ Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

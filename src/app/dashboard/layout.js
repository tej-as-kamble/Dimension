import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import styles from './dashboard.module.css';

export const metadata = {
  title: 'Dashboard — Dimenssion',
  description: 'Manage your sprints and tasks',
};

export default async function DashboardLayout({ children }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <SessionProvider session={session}>
      <div className={styles.dashboardLayout}>
        <Sidebar user={session.user} />
        <main className={styles.mainContent}>{children}</main>
      </div>
    </SessionProvider>
  );
}

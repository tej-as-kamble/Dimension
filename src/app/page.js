import Link from 'next/link';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>D</div>
          <span className={styles.logoText}>Dimension</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="/login" className="btn btn-ghost">
            Log In
          </Link>
          <Link href="/register" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot}></span>
          Personal Productivity
        </div>
        <h1 className={styles.heroTitle}>
          Organize your work in{' '}
          <span className={styles.heroGradient}>sprints</span>, ship with{' '}
          <span className={styles.heroGradient}>clarity</span>
        </h1>
        <p className={styles.heroDescription}>
          Dimension helps you break down projects into focused sprints, track
          tasks on a Kanban board, and maintain a complete activity trail — all
          in one clean, distraction-free interface.
        </p>
        <div className={styles.heroCta}>
          <Link href="/register" className="btn btn-primary btn-lg">
            Start Organizing →
          </Link>
          <Link href="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={`glass-card ${styles.featureCard}`}>
          <div className={styles.featureIcon}>🎯</div>
          <h3 className={styles.featureTitle}>Sprint Planning</h3>
          <p className={styles.featureDescription}>
            Define focused time-boxed sprints with goals, dates, and status
            tracking. Move from planning to active to closed with a click.
          </p>
        </div>
        <div className={`glass-card ${styles.featureCard}`}>
          <div className={styles.featureIcon}>📋</div>
          <h3 className={styles.featureTitle}>Kanban Board</h3>
          <p className={styles.featureDescription}>
            Visualize your tasks across To Do, In Progress, and Done columns.
            Prioritize with Low, Medium, and High urgency levels.
          </p>
        </div>
        <div className={`glass-card ${styles.featureCard}`}>
          <div className={styles.featureIcon}>📝</div>
          <h3 className={styles.featureTitle}>Markdown Descriptions</h3>
          <p className={styles.featureDescription}>
            Write rich task descriptions with full Markdown support — headers,
            code blocks, lists, and more — rendered beautifully in-app.
          </p>
        </div>
        <div className={`glass-card ${styles.featureCard}`}>
          <div className={styles.featureIcon}>📊</div>
          <h3 className={styles.featureTitle}>Activity Trail</h3>
          <p className={styles.featureDescription}>
            Every change is logged automatically. Track when priorities shift,
            stages change, and descriptions get updated — always know what happened.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Dimension. Built for focused productivity.</p>
      </footer>
    </div>
  );
}

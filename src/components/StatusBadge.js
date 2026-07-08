import styles from './StatusBadge.module.css';

const statusMap = {
  // Sprint statuses
  Planning: 'planning',
  Active: 'active',
  Closed: 'closed',
  // Priorities
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  // Stages
  'To Do': 'todo',
  'In Progress': 'inprogress',
  Done: 'done',
};

export default function StatusBadge({ value, showDot = true }) {
  const variant = statusMap[value] || 'planning';

  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {showDot && <span className={styles.dot}></span>}
      {value}
    </span>
  );
}

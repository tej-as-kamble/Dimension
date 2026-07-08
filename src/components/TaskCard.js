import Link from 'next/link';
import StatusBadge from './StatusBadge';
import styles from './TaskCard.module.css';

export default function TaskCard({ task, sprintId }) {
  return (
    <Link
      href={`/dashboard/sprints/${sprintId}/tasks/${task._id}`}
      className={styles.card}
    >
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>{task.title}</span>
      </div>
      <div className={styles.cardMeta}>
        <StatusBadge value={task.priority} showDot={false} />
      </div>
    </Link>
  );
}

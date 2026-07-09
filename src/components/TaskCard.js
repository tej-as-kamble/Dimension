import StatusBadge from './StatusBadge';
import styles from './TaskCard.module.css';

/**
 * TaskCard — renders as a clickable button (not a Link) so that the sprint
 * board can open the task in a modal while simultaneously updating the URL.
 * The `onSelect` callback receives the task._id.
 */
export default function TaskCard({ task, onSelect }) {
  return (
    <button
      className={styles.card}
      onClick={() => onSelect(task._id)}
      type="button"
      aria-label={`Open task: ${task.title}`}
    >
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>{task.title}</span>
      </div>
      <div className={styles.cardMeta}>
        <StatusBadge value={task.priority} showDot={false} />
      </div>
    </button>
  );
}

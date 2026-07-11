import StatusBadge from './StatusBadge';
import styles from './TaskCard.module.css';

/**
 * TaskCard — renders as a clickable, draggable button. The entire card
 * acts as a drag handle for Kanban drag-and-drop.
 * The `onSelect` callback receives the task._id on click.
 */
export default function TaskCard({ task, onSelect, isDraggedOver }) {
  function handleDragStart(e) {
    // Store task id and source stage in the dataTransfer
    e.dataTransfer.setData('application/card-id', task._id);
    e.dataTransfer.setData('application/card-stage', task.stage);
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight delay so the browser captures the ghost image
    e.currentTarget.classList.add(styles.cardDragging);
  }

  function handleDragEnd(e) {
    e.currentTarget.classList.remove(styles.cardDragging);
  }

  return (
    <button
      className={`${styles.card} ${isDraggedOver ? styles.cardDropTarget : ''}`}
      onClick={() => onSelect(task._id)}
      type="button"
      aria-label={`Open task: ${task.title}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>{task.title}</span>
      </div>
      <div className={styles.cardMeta}>
        <span className={styles.taskType}>{task.taskType}</span>
        {task.deadline && (
          <span className={styles.deadline} title="Deadline">
            📅 {new Date(task.deadline).toLocaleDateString()} {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <StatusBadge value={task.priority} showDot={false} />
      </div>
    </button>
  );
}

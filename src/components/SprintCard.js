'use client';

import Link from 'next/link';
import styles from './SprintCard.module.css';

export default function SprintCard({ sprint, onEdit, onDelete }) {
  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <Link
      href={`/dashboard/sprints/${sprint._id}`}
      className={`glass-card ${styles.card}`}
      style={{ textDecoration: 'none' }}
    >
      <div className={styles.cardHeader}>
        <h3 className={styles.cardName}>{sprint.name}</h3>
        <div className={styles.cardActions}>
          <button
            className={styles.actionBtn}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(sprint);
            }}
            title="Edit sprint"
          >
            ✎
          </button>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(sprint._id);
            }}
            title="Delete sprint"
          >
            🗑
          </button>
        </div>
      </div>

      {sprint.sprintGoal && (
        <p className={styles.cardGoal}>{sprint.sprintGoal}</p>
      )}

      <div className={styles.cardMeta}>
        <span className={styles.cardDates}>
          📅 {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
        </span>
        <span className={styles.cardTasks}>
          📋 {sprint.taskCount || 0} tasks
        </span>
      </div>
    </Link>
  );
}

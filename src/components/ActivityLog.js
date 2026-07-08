import styles from './ActivityLog.module.css';

export default function ActivityLog({ entries = [] }) {
  if (!entries || entries.length === 0) {
    return <p className={styles.empty}>No activity recorded yet.</p>;
  }

  // Show newest first
  const sorted = [...entries].reverse();

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className={styles.timeline}>
      {sorted.map((entry, index) => (
        <div key={index} className={styles.entry}>
          <div className={styles.dot}></div>
          <div className={styles.content}>
            <p className={styles.description}>{entry.actionDescription}</p>
            <span className={styles.timestamp}>
              {formatTime(entry.timestamp)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

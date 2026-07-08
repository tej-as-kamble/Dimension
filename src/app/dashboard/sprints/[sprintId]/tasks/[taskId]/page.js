'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getTaskById, updateTask, deleteTask } from '@/actions/task.actions';
import StatusBadge from '@/components/StatusBadge';
import TaskForm from '@/components/TaskForm';
import Modal from '@/components/Modal';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ActivityLog from '@/components/ActivityLog';
import styles from '../../../../dashboard.module.css';

export default function TaskDetailPage({ params }) {
  const { sprintId, taskId } = use(params);
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  async function loadTask() {
    setLoading(true);
    const { getStages } = await import('@/actions/stage.actions');
    const [result, stagesResult] = await Promise.all([
      getTaskById(taskId),
      getStages(),
    ]);
    if (result.success) {
      setTask(result.task);
    }
    if (stagesResult?.success) {
      setStages(stagesResult.stages);
    }
    setLoading(false);
  }

  async function handleUpdate(formData) {
    setFormLoading(true);
    const result = await updateTask(taskId, formData);
    setFormLoading(false);
    if (result.success) {
      setShowEditModal(false);
      loadTask();
    }
    return result;
  }

  async function handleDelete() {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    const result = await deleteTask(taskId);
    if (result.success) {
      router.push(`/dashboard/sprints/${sprintId}`);
    }
  }

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className={styles.emptyState}>
        <h2 className={styles.emptyTitle}>Task not found</h2>
        <Link href={`/dashboard/sprints/${sprintId}`} className="btn btn-secondary">
          ← Back to Sprint
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.taskDetail}>
      {/* Back Link */}
      <Link
        href={`/dashboard/sprints/${sprintId}`}
        className={styles.backLink}
      >
        ← Back to Sprint
      </Link>

      {/* Task Header */}
      <div className={styles.taskHeader}>
        <div className={styles.taskTitleRow}>
          <h1 className={styles.taskTitle}>{task.title}</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowEditModal(true)}
            >
              ✎ Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              🗑 Delete
            </button>
          </div>
        </div>
        <div className={styles.taskMetaRow}>
          <StatusBadge value={task.stage} />
          <StatusBadge value={task.priority} showDot={false} />
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
            Created {new Date(task.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className={styles.taskSection}>
        <h2 className={styles.taskSectionTitle}>📝 Description</h2>
        <div className={styles.taskContent}>
          <MarkdownRenderer content={task.description} />
        </div>
      </div>

      {/* Activity Log */}
      <div className={styles.taskSection}>
        <h2 className={styles.taskSectionTitle}>📊 Activity Log</h2>
        <div className={styles.taskContent}>
          <ActivityLog entries={task.activityLog} />
        </div>
      </div>

      {/* Edit Task Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Task"
      >
        <TaskForm
          task={task}
          sprintId={sprintId}
          stages={stages}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditModal(false)}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}

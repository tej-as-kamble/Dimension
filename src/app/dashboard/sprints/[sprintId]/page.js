'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSprintById, updateSprint, deleteSprint } from '@/actions/sprint.actions';
import {
  getTasksBySprintId,
  createTask,
} from '@/actions/task.actions';
import TaskCard from '@/components/TaskCard';
import TaskForm from '@/components/TaskForm';
import SprintForm from '@/components/SprintForm';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import styles from '../../dashboard.module.css';

export default function SprintDetailPage({ params }) {
  const { sprintId } = use(params);
  const router = useRouter();
  const [sprint, setSprint] = useState(null);
  const [grouped, setGrouped] = useState({ 'To Do': [], 'In Progress': [], Done: [] });
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [sprintId]);

  async function loadData() {
    setLoading(true);
    const [sprintResult, tasksResult] = await Promise.all([
      getSprintById(sprintId),
      getTasksBySprintId(sprintId),
    ]);

    if (sprintResult.success) {
      setSprint(sprintResult.sprint);
    }
    if (tasksResult.success) {
      setGrouped(tasksResult.grouped);
    }
    setLoading(false);
  }

  async function handleCreateTask(formData) {
    setFormLoading(true);
    const result = await createTask(formData);
    setFormLoading(false);
    if (result.success) {
      setShowTaskModal(false);
      loadData();
    }
    return result;
  }

  async function handleUpdateSprint(formData) {
    setFormLoading(true);
    const result = await updateSprint(sprintId, formData);
    setFormLoading(false);
    if (result.success) {
      setShowEditModal(false);
      loadData();
    }
    return result;
  }

  async function handleDeleteSprint() {
    if (!confirm('Delete this sprint and all its tasks?')) return;
    const result = await deleteSprint(sprintId);
    if (result.success) {
      router.push('/dashboard');
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className={styles.emptyState}>
        <h2 className={styles.emptyTitle}>Sprint not found</h2>
        <Link href="/dashboard" className="btn btn-secondary">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const columns = [
    { key: 'To Do', label: 'To Do', className: styles.columnTodo, icon: '📋' },
    { key: 'In Progress', label: 'In Progress', className: styles.columnInProgress, icon: '⚡' },
    { key: 'Done', label: 'Done', className: styles.columnDone, icon: '✅' },
  ];

  return (
    <>
      {/* Sprint Header */}
      <div className={styles.sprintHeader}>
        <Link href="/dashboard" className={styles.backLink}>
          ← Back to Sprints
        </Link>
        <div className={styles.sprintTitleRow}>
          <h1 className={styles.sprintTitle}>{sprint.name}</h1>
          <StatusBadge value={sprint.status} />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowEditModal(true)}
            >
              ✎ Edit
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDeleteSprint}
            >
              🗑 Delete
            </button>
          </div>
        </div>
        <div className={styles.sprintMeta}>
          <span>📅 {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}</span>
        </div>
        {sprint.sprintGoal && (
          <div className={styles.sprintGoal}>
            <strong>Goal:</strong> {sprint.sprintGoal}
          </div>
        )}
      </div>

      {/* Add Task Button */}
      <div className={styles.pageHeader} style={{ marginBottom: '16px' }}>
        <div></div>
        <button
          className="btn btn-primary"
          onClick={() => setShowTaskModal(true)}
        >
          + Add Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className={styles.kanban}>
        {columns.map((col) => (
          <div
            key={col.key}
            className={`${styles.kanbanColumn} ${col.className}`}
          >
            <div className={styles.kanbanHeader}>
              <span className={styles.kanbanTitle}>
                {col.icon} {col.label}
              </span>
              <span className={styles.kanbanCount}>
                {grouped[col.key]?.length || 0}
              </span>
            </div>
            <div className={styles.kanbanBody}>
              {grouped[col.key]?.length > 0 ? (
                grouped[col.key].map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    sprintId={sprintId}
                  />
                ))
              ) : (
                <div className={styles.kanbanEmpty}>No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Create Task"
      >
        <TaskForm
          sprintId={sprintId}
          onSubmit={handleCreateTask}
          onCancel={() => setShowTaskModal(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Edit Sprint Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Sprint"
      >
        <SprintForm
          sprint={sprint}
          onSubmit={handleUpdateSprint}
          onCancel={() => setShowEditModal(false)}
          loading={formLoading}
        />
      </Modal>
    </>
  );
}

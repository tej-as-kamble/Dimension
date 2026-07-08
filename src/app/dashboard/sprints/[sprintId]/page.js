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
import Modal from '@/components/Modal';
import styles from '../../dashboard.module.css';

export default function SprintDetailPage({ params }) {
  const { sprintId } = use(params);
  const router = useRouter();
  const [sprint, setSprint] = useState(null);
  const [grouped, setGrouped] = useState({});
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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
      setStages(tasksResult.stages || []);
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

  async function handleAddStage() {
    const name = prompt('Enter new stage name:');
    if (!name || !name.trim()) return;
    const { createStage } = await import('@/actions/stage.actions');
    const result = await createStage(name.trim());
    if (result.success) loadData();
  }

  async function handleEditStage(stage) {
    const newName = prompt('Enter new name for stage:', stage.name);
    if (!newName || !newName.trim() || newName === stage.name) return;
    const { updateStage } = await import('@/actions/stage.actions');
    const result = await updateStage(stage._id, newName.trim());
    if (result.success) loadData();
  }

  return (
    <>
      {/* Sprint Header */}
      <div className={styles.sprintHeader}>
        <Link href="/dashboard" className={styles.backLink}>
          ← Back to Sprints
        </Link>
        <div className={styles.sprintTitleRow}>
          <h1 className={styles.sprintTitle}>{sprint.name}</h1>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
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
        {showDetails && (
          <>
            <div className={styles.sprintMeta}>
              <span>📅 {sprint.startDate ? formatDate(sprint.startDate) : 'No start date'} — {sprint.endDate ? formatDate(sprint.endDate) : 'No end date'}</span>
            </div>
            {sprint.sprintGoal && (
              <div className={styles.sprintGoal}>
                <strong>Goal:</strong> {sprint.sprintGoal}
              </div>
            )}
          </>
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
      <div className={styles.kanban} style={{ overflowX: 'auto', paddingBottom: '16px' }}>
        {stages.map((stage) => (
          <div
            key={stage._id || stage.name}
            className={`${styles.kanbanColumn}`}
          >
            <div className={styles.kanbanHeader}>
              <span className={styles.kanbanTitle}>
                {stage.name}
                <button 
                  onClick={() => handleEditStage(stage)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px', opacity: 0.5 }}
                  title="Rename Stage"
                >
                  ✎
                </button>
              </span>
              <span className={styles.kanbanCount}>
                {grouped[stage.name]?.length || 0}
              </span>
            </div>
            <div className={styles.kanbanBody}>
              {grouped[stage.name]?.length > 0 ? (
                grouped[stage.name].map((task) => (
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
        <div className={styles.kanbanColumn} style={{ minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={handleAddStage}>
            + Add Column
          </button>
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Create Task"
      >
        <TaskForm
          sprintId={sprintId}
          stages={stages}
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

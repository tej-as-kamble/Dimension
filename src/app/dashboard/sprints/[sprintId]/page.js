'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSprintById, updateSprint, deleteSprint, getSprints } from '@/actions/sprint.actions';
import {
  getTasksBySprintId,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
} from '@/actions/task.actions';
import { reorderStages } from '@/actions/stage.actions';
import TaskCard from '@/components/TaskCard';
import TaskForm from '@/components/TaskForm';
import SprintForm from '@/components/SprintForm';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ActivityLog from '@/components/ActivityLog';
import styles from '../../dashboard.module.css';

export default function SprintDetailPage({ params }) {
  const { sprintId, taskId } = use(params);
  const router = useRouter();

  // ─── Core data state ───────────────────────────────────────────────────────
  const [sprint, setSprint] = useState(null);
  const [allSprints, setAllSprints] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─── Modal / form state ────────────────────────────────────────────────────
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // ─── Task detail modal state ───────────────────────────────────────────────
  const [selectedTaskId, setSelectedTaskId] = useState(taskId || null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetailLoading, setTaskDetailLoading] = useState(false);
  const [showTaskEditModal, setShowTaskEditModal] = useState(false);
  const [taskEditLoading, setTaskEditLoading] = useState(false);

  // ─── Add Column modal state ────────────────────────────────────────────────
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [columnGlobal, setColumnGlobal] = useState(true);
  const [columnLoading, setColumnLoading] = useState(false);

  // ─── Drag-and-drop state ───────────────────────────────────────────────────
  const dragStageId = useRef(null);
  const [draggingOver, setDraggingOver] = useState(null);

  // ─── Edit stage state ──────────────────────────────────────────────────────
  const [editingStage, setEditingStage] = useState(null);
  const [editStageName, setEditStageName] = useState('');

  useEffect(() => {
    loadData();
  }, [sprintId]);

  // When a task is selected, fetch it and update the URL bar without navigating
  useEffect(() => {
    if (!selectedTaskId) {
      setSelectedTask(null);
      return;
    }
    setTaskDetailLoading(true);
    getTaskById(selectedTaskId).then((result) => {
      if (result.success) setSelectedTask(result.task);
      setTaskDetailLoading(false);
    });
    // Update URL for bookmarkability without triggering Next.js navigation
    window.history.pushState(null, '', `/dashboard/sprints/${sprintId}/tasks/${selectedTaskId}`);
  }, [selectedTaskId, sprintId]);

  async function loadData() {
    setLoading(true);
    const [sprintResult, tasksResult, allSprintsResult] = await Promise.all([
      getSprintById(sprintId),
      getTasksBySprintId(sprintId),
      getSprints(),
    ]);

    if (sprintResult.success) setSprint(sprintResult.sprint);
    if (tasksResult.success) {
      setGrouped(tasksResult.grouped);
      setStages(tasksResult.stages || []);
    }
    if (allSprintsResult.success) setAllSprints(allSprintsResult.sprints);
    setLoading(false);
  }

  // ─── Task CRUD ─────────────────────────────────────────────────────────────
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

  async function handleUpdateSelectedTask(formData) {
    setTaskEditLoading(true);
    const result = await updateTask(selectedTaskId, formData);
    setTaskEditLoading(false);
    if (result.success) {
      setShowTaskEditModal(false);
      setSelectedTask(result.task);
      loadData();
    }
    return result;
  }

  async function handleDeleteSelectedTask() {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    const result = await deleteTask(selectedTaskId);
    if (result.success) {
      closeTaskModal();
      loadData();
    }
  }

  function closeTaskModal() {
    setSelectedTaskId(null);
    setSelectedTask(null);
    setShowTaskEditModal(false);
    // Restore sprint URL without navigating
    window.history.pushState(null, '', `/dashboard/sprints/${sprintId}`);
  }

  // ─── Sprint CRUD ───────────────────────────────────────────────────────────
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
    if (result.success) router.push('/dashboard');
  }

  // ─── Sprint switcher ───────────────────────────────────────────────────────
  function handleSprintSwitch(e) {
    const id = e.target.value;
    if (id && id !== sprintId) {
      router.push(`/dashboard/sprints/${id}`);
    }
  }

  // ─── Add Column ────────────────────────────────────────────────────────────
  async function handleAddColumn(e) {
    e.preventDefault();
    if (!newColumnName.trim()) return;
    setColumnLoading(true);
    const { createStage } = await import('@/actions/stage.actions');
    const result = await createStage(
      newColumnName.trim(),
      columnGlobal ? null : sprintId
    );
    setColumnLoading(false);
    if (result.success) {
      setShowAddColumnModal(false);
      setNewColumnName('');
      setColumnGlobal(true);
      loadData();
    }
  }

  // ─── Edit Stage ────────────────────────────────────────────────────────────
  async function handleEditStageSubmit() {
    if (!editStageName.trim() || editStageName === editingStage.name) {
      setEditingStage(null);
      return;
    }
    const { updateStage } = await import('@/actions/stage.actions');
    const result = await updateStage(editingStage._id, editStageName.trim());
    if (result.success) loadData();
    setEditingStage(null);
  }

  // ─── Drag-and-drop column reorder ─────────────────────────────────────────
  function handleDragStart(e, stageId) {
    dragStageId.current = stageId;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, stageId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggingOver(stageId);
  }

  function handleDrop(e, targetStageId) {
    e.preventDefault();
    setDraggingOver(null);
    const sourceId = dragStageId.current;
    if (!sourceId || sourceId === targetStageId) return;

    const currentStages = [...stages];
    const sourceIdx = currentStages.findIndex((s) => s._id === sourceId);
    const targetIdx = currentStages.findIndex((s) => s._id === targetStageId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const reordered = [...currentStages];
    const [moved] = reordered.splice(sourceIdx, 1);
    reordered.splice(targetIdx, 0, moved);

    // Assign new order values
    const withOrder = reordered.map((s, i) => ({ ...s, order: i }));
    setStages(withOrder);

    // Persist
    reorderStages(withOrder.map((s) => ({ _id: s._id, order: s.order })));
    dragStageId.current = null;
  }

  function handleDragEnd() {
    setDraggingOver(null);
    dragStageId.current = null;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // ─── Loading / not found states ────────────────────────────────────────────
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

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Sprint Header */}
      <div className={styles.sprintHeader}>
        <Link href="/dashboard" className={styles.backLink}>
          ← Back to Sprints
        </Link>

        <div className={styles.sprintTitleRow}>
          {/* Sprint title + switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
            <h1 className={styles.sprintTitle}>{sprint.name}</h1>
            {allSprints.length > 1 && (
              <select
                className="form-select"
                value={sprintId}
                onChange={handleSprintSwitch}
                aria-label="Switch sprint"
                style={{ maxWidth: '220px', fontSize: '0.85rem', padding: '6px 32px 6px 10px' }}
              >
                {allSprints.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
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
              <span>
                📅 {sprint.startDate ? formatDate(sprint.startDate) : 'No start date'} —{' '}
                {sprint.endDate ? formatDate(sprint.endDate) : 'No end date'}
              </span>
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
        <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
          + Add Task
        </button>
      </div>

      {/* Kanban Board — horizontal scroll */}
      <div className={styles.kanban}>
        {stages.map((stage) => (
          <div
            key={stage._id || stage.name}
            className={`${styles.kanbanColumn} ${draggingOver === stage._id ? styles.kanbanColumnDragOver : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, stage._id)}
            onDragOver={(e) => handleDragOver(e, stage._id)}
            onDrop={(e) => handleDrop(e, stage._id)}
            onDragEnd={handleDragEnd}
          >
            <div className={styles.kanbanHeader} style={{ cursor: 'grab' }}>
              <span className={styles.kanbanTitle}>
                <span style={{ marginRight: '6px', opacity: 0.4, fontSize: '0.75rem' }}>⠿</span>
                {editingStage?._id === stage._id ? (
                  <input
                    autoFocus
                    value={editStageName}
                    onChange={(e) => setEditStageName(e.target.value)}
                    onBlur={handleEditStageSubmit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditStageSubmit();
                      if (e.key === 'Escape') setEditingStage(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-focus)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      padding: '2px 6px',
                      width: '120px',
                      fontFamily: 'var(--font-body)',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <span
                    onDoubleClick={() => {
                      setEditingStage(stage);
                      setEditStageName(stage.name);
                    }}
                    title="Double-click to rename"
                  >
                    {stage.name}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingStage(stage);
                    setEditStageName(stage.name);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    marginLeft: '4px',
                    opacity: 0.4,
                    fontSize: '0.75rem',
                    padding: '0 2px',
                  }}
                  title="Rename column"
                >
                  ✎
                </button>
                {stage.sprintId && (
                  <span
                    title="Local to this sprint"
                    style={{ fontSize: '0.65rem', opacity: 0.5, marginLeft: '4px', letterSpacing: '0' }}
                  >
                    (local)
                  </span>
                )}
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
                    onSelect={setSelectedTaskId}
                  />
                ))
              ) : (
                <div className={styles.kanbanEmpty}>No tasks</div>
              )}
            </div>
          </div>
        ))}

        {/* Add Column button */}
        <div
          className={styles.kanbanColumn}
          style={{
            minWidth: '180px',
            width: '180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed var(--border-subtle)',
            background: 'transparent',
            flexShrink: 0,
          }}
        >
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddColumnModal(true)}
          >
            + Add Column
          </button>
        </div>
      </div>

      {/* ── Create Task Modal ────────────────────────────────────────────────── */}
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

      {/* ── Edit Sprint Modal ────────────────────────────────────────────────── */}
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

      {/* ── Add Column Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={showAddColumnModal}
        onClose={() => {
          setShowAddColumnModal(false);
          setNewColumnName('');
          setColumnGlobal(true);
        }}
        title="Add Column"
      >
        <form onSubmit={handleAddColumn} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label htmlFor="col-name" className="form-label">Column Name</label>
            <input
              id="col-name"
              type="text"
              className="form-input"
              placeholder="e.g. Review, Blocked, QA..."
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              required
              maxLength={50}
              autoFocus
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <input
              id="col-global"
              type="checkbox"
              checked={columnGlobal}
              onChange={(e) => setColumnGlobal(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
            />
            <div>
              <label
                htmlFor="col-global"
                style={{ fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', display: 'block' }}
              >
                Apply to all sprints
              </label>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                {columnGlobal
                  ? 'This column will appear across every sprint.'
                  : 'This column will only appear in this sprint.'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowAddColumnModal(false);
                setNewColumnName('');
                setColumnGlobal(true);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={columnLoading || !newColumnName.trim()}
            >
              {columnLoading ? <><span className="spinner"></span> Adding...</> : 'Add Column'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Task Detail Modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!selectedTaskId}
        onClose={closeTaskModal}
        title={selectedTask?.title || 'Task'}
      >
        {taskDetailLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : selectedTask ? (
          showTaskEditModal ? (
            /* ── Inline edit form ── */
            <TaskForm
              task={selectedTask}
              sprintId={sprintId}
              stages={stages}
              onSubmit={handleUpdateSelectedTask}
              onCancel={() => setShowTaskEditModal(false)}
              loading={taskEditLoading}
            />
          ) : (
            /* ── Task detail view ── */
            <div>
              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowTaskEditModal(true)}
                >
                  ✎ Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteSelectedTask}
                >
                  🗑 Delete
                </button>
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <StatusBadge value={selectedTask.stage} />
                <StatusBadge value={selectedTask.priority} showDot={false} />
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                  Created{' '}
                  {new Date(selectedTask.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <h3
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-secondary)',
                    marginBottom: '12px',
                  }}
                >
                  📝 Description
                </h3>
                <div
                  style={{
                    padding: '16px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <MarkdownRenderer content={selectedTask.description} />
                </div>
              </div>

              {/* Activity log */}
              <div>
                <h3
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-secondary)',
                    marginBottom: '12px',
                  }}
                >
                  📊 Activity Log
                </h3>
                <div
                  style={{
                    padding: '16px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <ActivityLog entries={selectedTask.activityLog} />
                </div>
              </div>
            </div>
          )
        ) : null}
      </Modal>
    </>
  );
}

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
  moveTask,
} from '@/actions/task.actions';
import { reorderStages } from '@/actions/stage.actions';
import TaskCard from '@/components/TaskCard';
import TaskForm from '@/components/TaskForm';
import SprintForm from '@/components/SprintForm';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ActivityLog from '@/components/ActivityLog';
import CommentSection from '@/components/CommentSection';
import TagSelector from '@/components/TagSelector';
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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescValue, setEditDescValue] = useState('');
  const [taskEditLoading, setTaskEditLoading] = useState(false);
  const [sidebarUpdates, setSidebarUpdates] = useState({});
  const [isDescOpen, setIsDescOpen] = useState(true);
  const [isCommentsOpen, setIsCommentsOpen] = useState(true);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

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

  // ─── Collapsed columns state ───────────────────────────────────────────────
  const [collapsedColumns, setCollapsedColumns] = useState({});

  // ─── Kebab menu state ─────────────────────────────────────────────────────
  const [openMenuStageId, setOpenMenuStageId] = useState(null);
  const menuRef = useRef(null);

  // ─── Toast state ──────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null); // { message, type }

  // ─── Card drag-and-drop state ─────────────────────────────────────────────
  const dragCardRef = useRef(null);          // { taskId, sourceStage }
  const [cardDropTarget, setCardDropTarget] = useState(null); // { stageName, index }

  useEffect(() => {
    loadData();
  }, [sprintId]);

  // Close kebab menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuStageId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    window.history.pushState(null, '', `/dashboard/sprints/${sprintId}/tasks/${selectedTaskId}`);
  }, [selectedTaskId, sprintId]);

  // Auto-dismiss toast after 3.5 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  function showToast(message, type = 'error') {
    setToast({ message, type });
  }

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

  async function handleInlineUpdate(updates) {
    if (!selectedTaskId) return;
    setTaskEditLoading(true);
    
    const formData = new FormData();
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'tags') {
          formData.set(key, JSON.stringify(value));
        } else {
          formData.set(key, value);
        }
      } else if (value === null) {
        // If we want to unset a field like deadline
        formData.set(key, '');
      }
    });

    const result = await updateTask(selectedTaskId, formData);
    setTaskEditLoading(false);
    
    if (result.success) {
      setSelectedTask(result.task);
      loadData();
    } else {
      showToast(result.error || 'Failed to update task', 'error');
    }
  }

  async function handleDeleteSelectedTask() {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    const result = await deleteTask(selectedTaskId);
    if (result.success) {
      closeTaskModal();
      loadData();
    }
  }

  function handleSidebarSave() {
    if (Object.keys(sidebarUpdates).length > 0) {
      handleInlineUpdate(sidebarUpdates);
      setSidebarUpdates({});
    }
  }

  function handleSidebarChange(key, value) {
    setSidebarUpdates(prev => ({ ...prev, [key]: value }));
  }

  function closeTaskModal() {
    setSelectedTaskId(null);
    setSelectedTask(null);
    setIsEditingTitle(false);
    setIsEditingDesc(false);
    setSidebarUpdates({});
    setIsDescOpen(true);
    setIsCommentsOpen(true);
    setIsActivityOpen(false);
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

  // ─── Delete Stage (with card validation) ──────────────────────────────────
  async function handleDeleteStage(stage) {
    setOpenMenuStageId(null);
    const cardCount = grouped[stage.name]?.length || 0;
    if (cardCount > 0) {
      showToast(
        `Cannot delete "${stage.name}" — it still has ${cardCount} card${cardCount > 1 ? 's' : ''}. Move or delete them first.`,
        'error'
      );
      return;
    }
    if (!confirm(`Delete the "${stage.name}" column? This cannot be undone.`)) return;
    const { deleteStage } = await import('@/actions/stage.actions');
    const result = await deleteStage(stage._id);
    if (result.success) {
      loadData();
    } else {
      showToast(result.error || 'Failed to delete column.', 'error');
    }
  }

  // ─── Expand / Collapse Column ─────────────────────────────────────────────
  function toggleCollapse(stageId) {
    setCollapsedColumns((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
    setOpenMenuStageId(null);
  }

  // ─── Drag-and-drop column reorder (handle only) ───────────────────────────
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

    const withOrder = reordered.map((s, i) => ({ ...s, order: i }));
    setStages(withOrder);
    reorderStages(withOrder.map((s) => ({ _id: s._id, order: s.order })));
    dragStageId.current = null;
  }

  function handleDragEnd() {
    setDraggingOver(null);
    dragStageId.current = null;
  }

  // ─── Card drag-and-drop handlers ──────────────────────────────────────────
  function handleCardDragOverColumn(e, stageName) {
    // Only react to card drags, not column drags
    if (dragStageId.current) return;
    if (!e.dataTransfer.types.includes('application/card-id')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Find which card index the cursor is nearest to
    const columnBody = e.currentTarget;
    const cards = Array.from(columnBody.querySelectorAll('[data-card-index]'));

    if (cards.length === 0) {
      setCardDropTarget({ stageName, index: 0 });
      return;
    }

    const mouseY = e.clientY;
    let targetIndex = cards.length; // default: append at end

    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (mouseY < midY) {
        targetIndex = i;
        break;
      }
    }

    setCardDropTarget({ stageName, index: targetIndex });
  }

  function handleCardDragLeaveColumn(e) {
    // Only clear if actually leaving the column body (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setCardDropTarget(null);
    }
  }

  async function handleCardDrop(e, targetStageName) {
    // Ignore column-reorder drops
    if (dragStageId.current) return;

    const taskId = e.dataTransfer.getData('application/card-id');
    const sourceStage = e.dataTransfer.getData('application/card-stage');
    if (!taskId) return;

    e.preventDefault();
    e.stopPropagation();

    const dropIndex = cardDropTarget?.stageName === targetStageName ? cardDropTarget.index : (grouped[targetStageName]?.length || 0);
    setCardDropTarget(null);

    // Skip if dropping in the exact same position
    if (sourceStage === targetStageName) {
      const currentCards = grouped[targetStageName] || [];
      const currentIdx = currentCards.findIndex(t => t._id === taskId);
      if (currentIdx === dropIndex || currentIdx === dropIndex - 1) return;
    }

    // ── Optimistic UI update ──
    setGrouped(prev => {
      const newGrouped = { ...prev };
      // Remove from source
      const sourceCards = [...(newGrouped[sourceStage] || [])];
      const cardIndex = sourceCards.findIndex(t => t._id === taskId);
      if (cardIndex === -1) return prev;
      const [card] = sourceCards.splice(cardIndex, 1);
      newGrouped[sourceStage] = sourceCards;

      // Insert into target
      const targetCards = sourceStage === targetStageName ? sourceCards : [...(newGrouped[targetStageName] || [])];
      const insertAt = Math.min(dropIndex, targetCards.length);
      targetCards.splice(insertAt, 0, { ...card, stage: targetStageName });
      newGrouped[targetStageName] = targetCards;

      return newGrouped;
    });

    // ── Persist to server ──
    const result = await moveTask(taskId, targetStageName, dropIndex);
    if (!result.success) {
      showToast(result.error || 'Failed to move card', 'error');
      loadData(); // revert to server state
    }
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

  // ─── Computed state ────────────────────────────────────────────────────────
  const hasSidebarChanges = selectedTask ? Object.keys(sidebarUpdates).some(key => {
    if (key === 'tags') {
      return JSON.stringify(sidebarUpdates[key]) !== JSON.stringify(selectedTask.tags || []);
    }
    if (key === 'deadline') {
      const curr = sidebarUpdates.deadline;
      const orig = selectedTask.deadline ? new Date(new Date(selectedTask.deadline).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
      return curr !== orig;
    }
    if (key === 'taskType') {
      return sidebarUpdates[key] !== (selectedTask.taskType || 'Story');
    }
    return sidebarUpdates[key] !== selectedTask[key];
  }) : false;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.sprintPageRoot}>
      {/* ── Toast Notification ── */}
      {toast && (
        <div className={`${styles.toast} ${styles[`toast--${toast.type}`]}`}>
          <span>{toast.message}</span>
          <button className={styles.toastClose} onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      {/* ── Sprint Header ── */}
      <div className={styles.sprintHeader}>
        <Link href="/dashboard" className={styles.backLink}>
          ← Back to Sprints
        </Link>

        <div className={styles.sprintTitleRow}>
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

      {/* ── Toolbar row (Add Task button) ── */}
      <div className={styles.pageHeader} style={{ marginBottom: '12px' }}>
        <div></div>
        <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
          + Add Task
        </button>
      </div>

      {/* ── Kanban Board ── */}
      <div className={styles.kanban}>
        {stages.map((stage) => {
          const isCollapsed = !!collapsedColumns[stage._id];
          const cardCount = grouped[stage.name]?.length || 0;
          const isMenuOpen = openMenuStageId === stage._id;

          return (
            <div
              key={stage._id || stage.name}
              className={`${styles.kanbanColumn} ${draggingOver === stage._id ? styles.kanbanColumnDragOver : ''} ${isCollapsed ? styles.kanbanColumnCollapsed : ''}`}
              onDragOver={(e) => handleDragOver(e, stage._id)}
              onDrop={(e) => handleDrop(e, stage._id)}
              onDragEnd={handleDragEnd}
            >
              {/* ── Column Header ── */}
              <div className={`${styles.kanbanHeader} ${isCollapsed ? styles.kanbanHeaderCollapsed : ''}`}>
                {/* Drag handle — only this triggers drag */}
                <span
                  className={styles.dragHandle}
                  draggable
                  onDragStart={(e) => handleDragStart(e, stage._id)}
                  title="Drag to reorder"
                >
                  ⠿
                </span>

                {isCollapsed ? (
                  /* Vertical title when collapsed */
                  <span
                    className={styles.kanbanTitleVertical}
                    onClick={() => toggleCollapse(stage._id)}
                    title="Click to expand"
                  >
                    {stage.name}
                  </span>
                ) : (
                  /* Normal title row */
                  <span className={styles.kanbanTitle}>
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
                    {stage.sprintId && (
                      <span
                        title="Local to this sprint"
                        style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '0' }}
                      >
                        (local)
                      </span>
                    )}
                  </span>
                )}

                {/* Right side: count + kebab menu */}
                {!isCollapsed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                    <span className={styles.kanbanCount}>{cardCount}</span>

                    {/* Three-dot (kebab) menu */}
                    <div className={styles.kebabWrapper} ref={isMenuOpen ? menuRef : null}>
                      <button
                        className={styles.kebabBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuStageId(isMenuOpen ? null : stage._id);
                        }}
                        title="Column options"
                        aria-label="Column options"
                      >
                        ⋮
                      </button>

                      {isMenuOpen && (
                        <div className={styles.kebabMenu}>
                          {/* Edit */}
                          <button
                            className={styles.kebabItem}
                            onClick={() => {
                              setOpenMenuStageId(null);
                              setEditingStage(stage);
                              setEditStageName(stage.name);
                            }}
                          >
                            <span className={styles.kebabItemIcon}>✎</span>
                            Rename
                          </button>

                          {/* Collapse */}
                          <button
                            className={styles.kebabItem}
                            onClick={() => toggleCollapse(stage._id)}
                          >
                            <span className={styles.kebabItemIcon}>⟨</span>
                            Collapse
                          </button>

                          <div className={styles.kebabDivider} />

                          {/* Delete */}
                          <button
                            className={`${styles.kebabItem} ${cardCount > 0 ? styles.kebabItemDisabled : styles.kebabItemDanger}`}
                            onClick={() => handleDeleteStage(stage)}
                            title={cardCount > 0 ? `Move all ${cardCount} card(s) before deleting` : 'Delete column'}
                          >
                            <span className={styles.kebabItemIcon}>🗑</span>
                            Delete
                            {cardCount > 0 && (
                              <span className={styles.kebabItemBadge}>{cardCount}</span>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Collapsed: show expand icon */}
                {isCollapsed && (
                  <button
                    className={styles.kebabBtn}
                    onClick={() => toggleCollapse(stage._id)}
                    title="Expand column"
                    style={{ marginTop: 'auto' }}
                  >
                    ⟩
                  </button>
                )}
              </div>

              {/* ── Column Body (hidden when collapsed) ── */}
              {!isCollapsed && (
                <div
                  className={styles.kanbanBody}
                  onDragOver={(e) => handleCardDragOverColumn(e, stage.name)}
                  onDragLeave={handleCardDragLeaveColumn}
                  onDrop={(e) => handleCardDrop(e, stage.name)}
                >
                  {grouped[stage.name]?.length > 0 ? (
                    grouped[stage.name].map((task, idx) => (
                      <div key={task._id} data-card-index={idx}>
                        {/* Drop indicator line above this card */}
                        {cardDropTarget?.stageName === stage.name && cardDropTarget.index === idx && (
                          <div className={styles.cardDropIndicator} />
                        )}
                        <TaskCard
                          task={task}
                          onSelect={setSelectedTaskId}
                        />
                      </div>
                    ))
                  ) : (
                    <div className={styles.kanbanEmpty}>No tasks</div>
                  )}
                  {/* Drop indicator at the very bottom */}
                  {cardDropTarget?.stageName === stage.name && cardDropTarget.index >= (grouped[stage.name]?.length || 0) && (
                    <div className={styles.cardDropIndicator} />
                  )}
                </div>
              )}
            </div>
          );
        })}

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

      {/* ── Create Task Modal ── */}
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

      {/* ── Edit Sprint Modal ── */}
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

      {/* ── Add Column Modal ── */}
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

      {/* ── Task Detail Modal ── */}
      <Modal
        isOpen={!!selectedTaskId}
        onClose={closeTaskModal}
        title={
          selectedTask ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                {sprint?.name || 'Sprint'}
              </span>
              <span style={{ opacity: 0.5 }}>/</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: 600 }}>
                {selectedTask.taskType === 'Bug' ? '🐛' : selectedTask.taskType === 'Feature' ? '🚀' : '📝'}
                {selectedTask.taskType || 'Task'}
              </span>
            </div>
          ) : null
        }
        maxWidth="1400px"
        noScroll={true}
      >
        {taskDetailLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : selectedTask ? (
          <div className={styles.taskDetailGrid}>
            
            {/* ── Sidebar Column ── */}
            <div className={styles.taskDetailSidebar}>
              <div className={styles.sidebarField}>
                <span className={styles.sidebarLabel}>Stage</span>
                <select
                  className="form-select"
                  value={sidebarUpdates.stage !== undefined ? sidebarUpdates.stage : selectedTask.stage}
                  onChange={(e) => handleSidebarChange('stage', e.target.value)}
                  disabled={taskEditLoading}
                >
                  {stages.map((stg) => (
                    <option key={stg._id || stg.name} value={stg.name}>
                      {stg.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.sidebarField}>
                <span className={styles.sidebarLabel}>Priority</span>
                <select
                  className="form-select"
                  value={sidebarUpdates.priority !== undefined ? sidebarUpdates.priority : selectedTask.priority}
                  onChange={(e) => handleSidebarChange('priority', e.target.value)}
                  disabled={taskEditLoading}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className={styles.sidebarField}>
                <span className={styles.sidebarLabel}>Task Type</span>
                <select
                  className="form-select"
                  value={sidebarUpdates.taskType !== undefined ? sidebarUpdates.taskType : (selectedTask.taskType || 'Story')}
                  onChange={(e) => handleSidebarChange('taskType', e.target.value)}
                  disabled={taskEditLoading}
                >
                  <option value="Story">Story</option>
                  <option value="Feature">Feature</option>
                  <option value="Bug">Bug</option>
                </select>
              </div>

              <div className={styles.sidebarField}>
                <span className={styles.sidebarLabel}>Deadline</span>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={sidebarUpdates.deadline !== undefined ? sidebarUpdates.deadline : (selectedTask.deadline ? new Date(new Date(selectedTask.deadline).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '')}
                  onChange={(e) => handleSidebarChange('deadline', e.target.value)}
                  disabled={taskEditLoading}
                />
              </div>

              <div className={styles.sidebarField}>
                <span className={styles.sidebarLabel}>Tags</span>
                <TagSelector
                  sprintId={sprintId}
                  selectedTags={sidebarUpdates.tags !== undefined ? sidebarUpdates.tags : (selectedTask.tags || [])}
                  onChange={(tags) => handleSidebarChange('tags', tags)}
                />
              </div>

              {hasSidebarChanges && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSidebarSave} disabled={taskEditLoading}>
                    {taskEditLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setSidebarUpdates({})} disabled={taskEditLoading}>
                    Cancel
                  </button>
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                <button
                  className={styles.subtleDeleteBtn}
                  onClick={handleDeleteSelectedTask}
                >
                  Delete Task
                </button>
              </div>
            </div>

            {/* ── Main Column ── */}
            <div className={styles.taskDetailMain}>
              {/* Title Inline Edit */}
              <div>
                {isEditingTitle ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      autoFocus
                      className={`${styles.inlineInput} ${styles.inlineTitle}`}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={editTitleValue}
                      onChange={(e) => setEditTitleValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setIsEditingTitle(false);
                          if (editTitleValue.trim() && editTitleValue !== selectedTask.title) {
                            handleInlineUpdate({ title: editTitleValue.trim() });
                          }
                        }
                        if (e.key === 'Escape') {
                          setIsEditingTitle(false);
                          setEditTitleValue(selectedTask.title);
                        }
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => {
                        setIsEditingTitle(false);
                        if (editTitleValue.trim() && editTitleValue !== selectedTask.title) {
                          handleInlineUpdate({ title: editTitleValue.trim() });
                        }
                      }}>
                        Save
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => {
                        setIsEditingTitle(false);
                        setEditTitleValue(selectedTask.title);
                      }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <h2 
                    className={styles.inlineTitle} 
                    style={{ cursor: 'text', border: '1px solid transparent', padding: '4px 8px', margin: '-4px -8px', borderRadius: 'var(--radius-sm)' }} 
                    onClick={() => {
                      setEditTitleValue(selectedTask.title);
                      setIsEditingTitle(true);
                    }}
                    title="Click to edit title"
                  >
                    {selectedTask.title}
                  </h2>
                )}
              </div>

              {/* Description Inline Edit */}
              <div>
                <div 
                  className={styles.sectionHeader}
                  onClick={() => setIsDescOpen(!isDescOpen)}
                >
                  <span className={`${styles.chevron} ${isDescOpen ? styles.chevronOpen : ''}`}>▶</span>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'inherit', margin: 0 }}>
                    📝 Description
                  </h3>
                  {/* Edit button removed in favor of click-to-edit behavior */}
                </div>
                {isDescOpen && (
                  <div style={{ marginTop: '8px' }}>
                    {isEditingDesc ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <textarea
                          className="form-textarea"
                          value={editDescValue}
                          onChange={(e) => setEditDescValue(e.target.value)}
                          style={{ minHeight: '140px' }}
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => {
                            setIsEditingDesc(false);
                            if (editDescValue !== selectedTask.description) {
                              handleInlineUpdate({ description: editDescValue });
                            }
                          }}>
                            Save
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => {
                            setIsEditingDesc(false);
                            setEditDescValue(selectedTask.description || '');
                          }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '16px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-lg)',
                          minHeight: '80px',
                          cursor: 'text'
                        }}
                        onClick={() => {
                          setEditDescValue(selectedTask.description || '');
                          setIsEditingDesc(true);
                        }}
                        title="Click to edit description"
                      >
                        {selectedTask.description ? (
                          <MarkdownRenderer content={selectedTask.description} />
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>Add a description...</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div>
                <div 
                  className={styles.sectionHeader}
                  onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                >
                  <span className={`${styles.chevron} ${isCommentsOpen ? styles.chevronOpen : ''}`}>▶</span>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'inherit', margin: 0 }}>
                    💬 Comments
                  </h3>
                </div>
                {isCommentsOpen && (
                  <div style={{ marginTop: '8px' }}>
                    <CommentSection taskId={selectedTask._id} currentUserId={sprint.userId} />
                  </div>
                )}
              </div>

              {/* Activity log */}
              <div>
                <div 
                  className={styles.sectionHeader}
                  onClick={() => setIsActivityOpen(!isActivityOpen)}
                >
                  <span className={`${styles.chevron} ${isActivityOpen ? styles.chevronOpen : ''}`}>▶</span>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'inherit', margin: 0 }}>
                    📊 Activity Log
                  </h3>
                </div>
                {isActivityOpen && (
                  <div style={{ marginTop: '8px', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                    <ActivityLog entries={selectedTask.activityLog} />
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : null}
      </Modal>
    </div>
  );
}

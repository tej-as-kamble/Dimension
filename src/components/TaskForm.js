'use client';

import { useState, useEffect } from 'react';
import useFormCache from '@/hooks/useFormCache';
import TagSelector from './TagSelector';
import styles from './TaskForm.module.css';

export default function TaskForm({
  task,
  sprintId,
  stages = [],
  onSubmit,
  onCancel,
  loading,
}) {
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [selectedTags, setSelectedTags] = useState(task?.tags || []);
  const isEdit = !!task;

  const formId = task ? `task_edit_${task._id}` : (sprintId ? `task_create_${sprintId}` : 'task_create');
  const { cachedData, isLoaded, saveCache, clearCache } = useFormCache(formId);

  const formatLocal = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const defaultTitle = cachedData?.title ?? task?.title ?? '';
  const defaultDescription = cachedData?.description ?? task?.description ?? '';
  const defaultPriority = cachedData?.priority ?? task?.priority ?? 'Medium';
  const defaultStage = cachedData?.stage ?? task?.stage ?? (stages[0]?.name || 'To Do');
  const defaultTaskType = cachedData?.taskType ?? task?.taskType ?? 'Story';
  const defaultDeadline = cachedData?.deadline ?? formatLocal(task?.deadline);

  // Initialise titleValue once cache is loaded (after hydration)
  useEffect(() => {
    if (isLoaded) {
      setTitleValue(defaultTitle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  if (!isLoaded) return <div className="spinner" style={{ margin: '20px auto' }}></div>;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.target);
    if (sprintId) {
      formData.set('sprintId', sprintId);
    }
    const result = await onSubmit(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      clearCache();
    }
  }

  function handleChange(e) {
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    saveCache(data);
    setTitleValue(data.title || '');

    // The tags change is tracked through selectedTags state, but we can also manually check dirty state.
    if (isEdit) {
      const originalTags = (task.tags || []).map(t => t._id || t).sort().join(',');
      const currentTags = selectedTags.map(t => t._id || t).sort().join(',');
      
      const dirty =
        (data.title?.trim() || '') !== (task.title || '') ||
        (data.description || '') !== (task.description || '') ||
        (data.priority || '') !== (task.priority || '') ||
        (data.stage || '') !== (task.stage || '') ||
        (data.taskType || '') !== (task.taskType || '') ||
        (data.deadline || '') !== formatLocal(task.deadline) ||
        originalTags !== currentTags;
      setIsDirty(dirty);
    } else {
      setIsDirty(true);
    }
  }

  // Create mode: disabled until title is non-empty
  // Edit mode: disabled until at least one field changed
  const isSubmitDisabled = loading || (isEdit ? !isDirty : !titleValue.trim());

  return (
    <form onChange={handleChange} onSubmit={handleSubmit} className={styles.form}>
      {error && (
        <div className="alert alert-error">
          <span>⚠</span> {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="task-title" className="form-label">Title</label>
        <input
          id="task-title"
          name="title"
          type="text"
          className="form-input"
          placeholder="e.g. Implement user authentication"
          defaultValue={defaultTitle}
          required
          maxLength={200}
        />
      </div>

      <div className="form-group">
        <label htmlFor="task-description" className="form-label">
          Description (Markdown supported)
        </label>
        <textarea
          id="task-description"
          name="description"
          className="form-textarea"
          placeholder="Write your task description using Markdown..."
          defaultValue={defaultDescription}
          maxLength={10000}
          style={{ minHeight: '140px' }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Tags</label>
        <TagSelector
          sprintId={sprintId || task?.sprintId}
          selectedTags={selectedTags}
          onChange={(tags) => {
            setSelectedTags(tags);
            setIsDirty(true);
          }}
        />
      </div>

      <div className={styles.row}>
        <div className="form-group">
          <label htmlFor="task-type" className="form-label">Task Type *</label>
          <select
            id="task-type"
            name="taskType"
            className="form-select"
            defaultValue={defaultTaskType}
            required
          >
            <option value="Story">Story</option>
            <option value="Feature">Feature</option>
            <option value="Bug">Bug</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="task-deadline" className="form-label">Deadline</label>
          <input
            id="task-deadline"
            name="deadline"
            type="datetime-local"
            className="form-input"
            defaultValue={defaultDeadline}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className="form-group">
          <label htmlFor="task-priority" className="form-label">Priority</label>
          <select
            id="task-priority"
            name="priority"
            className="form-select"
            defaultValue={defaultPriority}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="task-stage" className="form-label">Stage</label>
          <select
            id="task-stage"
            name="stage"
            className="form-select"
            defaultValue={defaultStage}
          >
            {stages.length > 0 ? (
              stages.map((stg) => (
                <option key={stg._id || stg.name} value={stg.name}>
                  {stg.name}
                </option>
              ))
            ) : (
              <>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </>
            )}
          </select>
        </div>
      </div>

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitDisabled}
          title={isSubmitDisabled && !loading ? (isEdit ? 'Make a change to enable save' : 'Enter a title to continue') : undefined}
        >
          {loading ? (
            <>
              <span className="spinner"></span> Saving...
            </>
          ) : isEdit ? (
            'Update Task'
          ) : (
            'Create Task'
          )}
        </button>
      </div>
    </form>
  );
}

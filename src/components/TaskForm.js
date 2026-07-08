'use client';

import { useState } from 'react';
import styles from './TaskForm.module.css';

export default function TaskForm({
  task,
  sprintId,
  onSubmit,
  onCancel,
  loading,
}) {
  const [error, setError] = useState('');
  const isEdit = !!task;

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
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
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
          defaultValue={task?.title || ''}
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
          defaultValue={task?.description || ''}
          maxLength={10000}
          style={{ minHeight: '140px' }}
        />
      </div>

      <div className={styles.row}>
        <div className="form-group">
          <label htmlFor="task-priority" className="form-label">Priority</label>
          <select
            id="task-priority"
            name="priority"
            className="form-select"
            defaultValue={task?.priority || 'Medium'}
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
            defaultValue={task?.stage || 'To Do'}
          >
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>
      </div>

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
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

'use client';

import { useState } from 'react';
import styles from './SprintForm.module.css';

export default function SprintForm({ sprint, onSubmit, onCancel, loading }) {
  const [error, setError] = useState('');

  const isEdit = !!sprint;

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.target);
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
        <label htmlFor="sprint-name" className="form-label">Sprint Name</label>
        <input
          id="sprint-name"
          name="name"
          type="text"
          className="form-input"
          placeholder="e.g. Sprint 1 — Auth Module"
          defaultValue={sprint?.name || ''}
          required
          maxLength={100}
        />
      </div>

      <div className={styles.row}>
        <div className="form-group">
          <label htmlFor="sprint-start" className="form-label">Start Date</label>
          <input
            id="sprint-start"
            name="startDate"
            type="date"
            className="form-input"
            defaultValue={formatDate(sprint?.startDate)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="sprint-end" className="form-label">End Date</label>
          <input
            id="sprint-end"
            name="endDate"
            type="date"
            className="form-input"
            defaultValue={formatDate(sprint?.endDate)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="sprint-goal" className="form-label">Sprint Goal</label>
        <textarea
          id="sprint-goal"
          name="sprintGoal"
          className="form-textarea"
          placeholder="What do you want to accomplish this sprint?"
          defaultValue={sprint?.sprintGoal || ''}
          maxLength={500}
          style={{ minHeight: '80px' }}
        />
      </div>

      {isEdit && (
        <div className="form-group">
          <label htmlFor="sprint-status" className="form-label">Status</label>
          <select
            id="sprint-status"
            name="status"
            className="form-select"
            defaultValue={sprint?.status || 'Planning'}
          >
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      )}

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
            'Update Sprint'
          ) : (
            'Create Sprint'
          )}
        </button>
      </div>
    </form>
  );
}

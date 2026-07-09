'use client';

import { useState, useEffect } from 'react';
import useFormCache from '@/hooks/useFormCache';
import styles from './SprintForm.module.css';

export default function SprintForm({ sprint, onSubmit, onCancel, loading }) {
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const isEdit = !!sprint;

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }

  const formId = sprint ? `sprint_edit_${sprint._id}` : 'sprint_create';
  const { cachedData, isLoaded, saveCache, clearCache } = useFormCache(formId);

  const defaultName = cachedData?.name ?? sprint?.name ?? '';
  const defaultStartDate = cachedData?.startDate ?? formatDate(sprint?.startDate) ?? '';
  const defaultEndDate = cachedData?.endDate ?? formatDate(sprint?.endDate) ?? '';
  const defaultSprintGoal = cachedData?.sprintGoal ?? sprint?.sprintGoal ?? '';

  // Initialise nameValue once cache is loaded (after hydration)
  useEffect(() => {
    if (isLoaded) {
      setNameValue(defaultName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  if (!isLoaded) return <div className="spinner" style={{ margin: '20px auto' }}></div>;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.target);
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
    setNameValue(data.name || '');

    if (isEdit) {
      const dirty =
        (data.name?.trim() || '') !== (sprint.name || '') ||
        (data.startDate || '') !== (formatDate(sprint.startDate) || '') ||
        (data.endDate || '') !== (formatDate(sprint.endDate) || '') ||
        (data.sprintGoal?.trim() || '') !== (sprint.sprintGoal || '');
      setIsDirty(dirty);
    } else {
      setIsDirty(true);
    }
  }

  // Create mode: disabled until name is non-empty
  // Edit mode: disabled until at least one field changed
  const isSubmitDisabled = loading || (isEdit ? !isDirty : !nameValue.trim());

  return (
    <form onChange={handleChange} onSubmit={handleSubmit} className={styles.form}>
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
          defaultValue={defaultName}
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
            defaultValue={defaultStartDate}
          />
        </div>
        <div className="form-group">
          <label htmlFor="sprint-end" className="form-label">End Date</label>
          <input
            id="sprint-end"
            name="endDate"
            type="date"
            className="form-input"
            defaultValue={defaultEndDate}
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
          defaultValue={defaultSprintGoal}
          maxLength={500}
          style={{ minHeight: '80px' }}
        />
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
          title={isSubmitDisabled && !loading ? (isEdit ? 'Make a change to enable save' : 'Enter a sprint name to continue') : undefined}
        >
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

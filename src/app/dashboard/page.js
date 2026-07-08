'use client';

import { useState, useEffect } from 'react';
import {
  getSprints,
  createSprint,
  updateSprint,
  deleteSprint,
} from '@/actions/sprint.actions';
import SprintCard from '@/components/SprintCard';
import SprintForm from '@/components/SprintForm';
import Modal from '@/components/Modal';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);

  useEffect(() => {
    loadSprints();
  }, []);

  async function loadSprints() {
    setLoading(true);
    const result = await getSprints();
    if (result.success) {
      setSprints(result.sprints);
    }
    setLoading(false);
  }

  async function handleCreate(formData) {
    setFormLoading(true);
    const result = await createSprint(formData);
    setFormLoading(false);
    if (result.success) {
      setShowCreateModal(false);
      loadSprints();
    }
    return result;
  }

  async function handleUpdate(formData) {
    setFormLoading(true);
    const result = await updateSprint(editingSprint._id, formData);
    setFormLoading(false);
    if (result.success) {
      setEditingSprint(null);
      loadSprints();
    }
    return result;
  }

  async function handleDelete(sprintId) {
    if (!confirm('Delete this sprint and all its tasks? This cannot be undone.')) {
      return;
    }
    const result = await deleteSprint(sprintId);
    if (result.success) {
      loadSprints();
    }
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Sprints</h1>
          <p className={styles.pageSubtitle}>
            Manage your sprints and track progress
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + New Sprint
        </button>
      </div>

      {loading ? (
        <div className={styles.emptyState}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : sprints.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🚀</div>
          <h2 className={styles.emptyTitle}>No sprints yet</h2>
          <p className={styles.emptyDescription}>
            Create your first sprint to start organizing your work.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Sprint
          </button>
        </div>
      ) : (
        <div className={`${styles.sprintGrid} stagger-children`}>
          {sprints.map((sprint) => (
            <SprintCard
              key={sprint._id}
              sprint={sprint}
              onEdit={setEditingSprint}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Sprint Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Sprint"
      >
        <SprintForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Edit Sprint Modal */}
      <Modal
        isOpen={!!editingSprint}
        onClose={() => setEditingSprint(null)}
        title="Edit Sprint"
      >
        {editingSprint && (
          <SprintForm
            sprint={editingSprint}
            onSubmit={handleUpdate}
            onCancel={() => setEditingSprint(null)}
            loading={formLoading}
          />
        )}
      </Modal>
    </>
  );
}

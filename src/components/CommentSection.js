'use client';

import { useState, useEffect } from 'react';
import { getCommentsByTaskId, createComment, updateComment, deleteComment } from '@/actions/comment.actions';
import styles from './CommentSection.module.css';

export default function CommentSection({ taskId, currentUserId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [taskId]);

  async function loadComments() {
    setLoading(true);
    const result = await getCommentsByTaskId(taskId);
    if (result.success) {
      setComments(result.comments);
    }
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const result = await createComment(taskId, newContent);
    if (result.success) {
      setComments([...comments, result.comment]);
      setNewContent('');
    }
    setIsSubmitting(false);
  }

  async function handleUpdate(commentId) {
    if (!editContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const result = await updateComment(commentId, editContent);
    if (result.success) {
      setComments(comments.map(c => c._id === commentId ? result.comment : c));
      setEditingId(null);
      setEditContent('');
    }
    setIsSubmitting(false);
  }

  async function handleDelete(commentId) {
    if (!confirm('Delete this comment?')) return;
    const result = await deleteComment(commentId);
    if (result.success) {
      setComments(comments.filter(c => c._id !== commentId));
    }
  }

  function formatDate(dateString) {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>💬 Comments</h3>
      
      <div className={styles.list}>
        {loading ? (
          <div className="spinner" style={{ margin: '10px auto' }}></div>
        ) : comments.length === 0 ? (
          <div className={styles.empty}>No comments yet.</div>
        ) : (
          comments.map((comment) => {
            const isOwner = comment.userId && comment.userId._id === currentUserId;
            const isEdited = comment.createdAt !== comment.updatedAt;

            return (
              <div key={comment._id} className={styles.commentCard}>
                <div className={styles.header}>
                  <div className={styles.authorMeta}>
                    <span className={styles.author}>{comment.userId?.name || 'Unknown User'}</span>
                    <span className={styles.timestamp}>
                      {formatDate(comment.createdAt)}
                      {isEdited && ` (edited ${formatDate(comment.updatedAt)})`}
                    </span>
                  </div>
                  {isOwner && editingId !== comment._id && (
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} onClick={() => { setEditingId(comment._id); setEditContent(comment.content); }}>Edit</button>
                      <button className={styles.actionBtn} onClick={() => handleDelete(comment._id)}>Delete</button>
                    </div>
                  )}
                </div>
                
                {editingId === comment._id ? (
                  <div className={styles.editForm}>
                    <textarea
                      className={styles.textarea}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                    />
                    <div className={styles.editActions}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)} disabled={isSubmitting}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={() => handleUpdate(comment._id)} disabled={!editContent.trim() || isSubmitting}>Save</button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.content}>{comment.content}</div>
                )}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleAdd} className={styles.addForm}>
        <textarea
          className={styles.textarea}
          placeholder="Add a comment..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          rows={2}
        />
        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!newContent.trim() || isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
}

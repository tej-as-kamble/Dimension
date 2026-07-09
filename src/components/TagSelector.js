'use client';

import { useState, useEffect, useRef } from 'react';
import { getTagsForSprint, createTag } from '@/actions/tag.actions';
import styles from './TagSelector.module.css';

export default function TagSelector({ sprintId, selectedTags, onChange }) {
  const [availableTags, setAvailableTags] = useState([]);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const wrapperRef = useRef(null);

  useEffect(() => {
    async function loadTags() {
      const result = await getTagsForSprint(sprintId);
      if (result.success) {
        setAvailableTags(result.tags);
      }
      setLoading(false);
    }
    loadTags();
  }, [sprintId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTags = availableTags.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase()) &&
    !selectedTags.some(selected => selected._id === t._id)
  );

  const exactMatch = availableTags.some((t) => t.name.toLowerCase() === query.trim().toLowerCase());

  async function handleSelect(tag) {
    onChange([...selectedTags, tag]);
    setQuery('');
    setIsOpen(false);
  }

  async function handleCreate() {
    if (!query.trim()) return;
    const newTag = { 
      _id: `temp_${Date.now()}`, 
      name: query.trim(), 
      isNew: true 
    };
    onChange([...selectedTags, newTag]);
    setQuery('');
    setIsOpen(false);
  }

  function handleRemove(tagId) {
    onChange(selectedTags.filter((t) => t._id !== tagId));
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.selectedContainer}>
        {selectedTags.map((tag) => (
          <span key={tag._id} className={styles.tagBadge}>
            #{tag.name}
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => handleRemove(tag._id)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          className={styles.input}
          placeholder={selectedTags.length === 0 ? "Search or create tags..." : ""}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          {loading ? (
            <div className={styles.dropdownItem}>Loading...</div>
          ) : (
            <>
              {filteredTags.map((tag) => (
                <div
                  key={tag._id}
                  className={styles.dropdownItem}
                  onClick={() => handleSelect(tag)}
                >
                  #{tag.name}
                </div>
              ))}
              {query.trim() && !exactMatch && (
                <div className={styles.dropdownCreate} onClick={handleCreate}>
                  Create "{query.trim()}"
                </div>
              )}
              {filteredTags.length === 0 && (!query.trim() || exactMatch) && (
                <div className={styles.dropdownEmpty}>No more tags to add</div>
              )}
            </>
          )}
        </div>
      )}
      <input type="hidden" name="tags" value={JSON.stringify(selectedTags)} />
    </div>
  );
}

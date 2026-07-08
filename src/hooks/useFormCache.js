'use client';

import { useState, useEffect } from 'react';

export default function useFormCache(formId) {
  const [cachedData, setCachedData] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!formId) {
      setIsLoaded(true);
      return;
    }

    try {
      const raw = localStorage.getItem(`formCache_${formId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        // 1 day expiration
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setCachedData(parsed.data);
        } else {
          localStorage.removeItem(`formCache_${formId}`);
        }
      }
    } catch (e) {
      console.warn('Failed to load form cache:', e);
    }
    setIsLoaded(true);
  }, [formId]);

  const saveCache = (data) => {
    if (!formId) return;
    try {
      localStorage.setItem(
        `formCache_${formId}`,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.warn('Failed to save form cache:', e);
    }
  };

  const clearCache = () => {
    if (!formId) return;
    try {
      localStorage.removeItem(`formCache_${formId}`);
    } catch (e) {}
  };

  return { cachedData, isLoaded, saveCache, clearCache };
}

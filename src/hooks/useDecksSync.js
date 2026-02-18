import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'knowledge-visualizer-decks';
const API_BASE = ''; // Uses Vite proxy

/**
 * useDecksSync
 * Manages bidirectional sync between:
 * - localStorage (for offline/fast access)
 * - Backend API (which persists to data/decks.json)
 *
 * On mount: Loads from backend first, then localStorage as fallback
 * On change: Saves to both localStorage and backend
 * On visibility change: Syncs with backend to catch any external changes
 */
export function useDecksSync(initialData) {
  const [decks, setDecks] = useState(initialData);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const isInitialMount = useRef(true);
  const debounceTimer = useRef(null);

  // Load from backend on mount
  useEffect(() => {
    const loadFromBackend = async () => {
      try {
        setSyncStatus('syncing');
        const response = await fetch(`${API_BASE}/api/decks`, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const backendDecks = await response.json();
          if (backendDecks && backendDecks.length > 0) {
            setDecks(backendDecks);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(backendDecks));
            setLastSyncTime(new Date());
            setSyncStatus('idle');
            return;
          }
        }
      } catch (err) {
        console.warn('Backend unavailable, using localStorage:', err);
      }

      // Fallback to localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDecks(parsed);
          }
        }
      } catch (e) {
        console.warn('localStorage read failed');
      }

      setSyncStatus('idle');
    };

    loadFromBackend();
  }, []);

  // Save to backend + localStorage whenever decks change (with debounce)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Debounce saves to avoid hammering the backend
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      // Save to localStorage immediately
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
      } catch (e) {
        console.warn('localStorage save failed:', e);
      }

      // Save to backend
      try {
        setSyncStatus('syncing');
        const response = await fetch(`${API_BASE}/api/decks/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(decks)
        });

        if (response.ok) {
          setLastSyncTime(new Date());
          setSyncStatus('idle');
        } else {
          console.warn('Backend save failed:', response.statusText);
          setSyncStatus('error');
        }
      } catch (err) {
        console.warn('Backend save error:', err);
        setSyncStatus('error');
      }
    }, 1000); // Wait 1 second after last change before saving

    return () => clearTimeout(debounceTimer.current);
  }, [decks]);

  // Listen for external changes (when user does git pull, etc.)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) return;

      // Check if backend has newer data
      try {
        const response = await fetch(`${API_BASE}/api/decks`);
        if (response.ok) {
          const backendDecks = await response.json();
          if (backendDecks && backendDecks.length > 0) {
            // Compare timestamps or content
            const currentStr = JSON.stringify(decks);
            const backendStr = JSON.stringify(backendDecks);
            if (currentStr !== backendStr) {
              console.log('External changes detected, reloading...');
              setDecks(backendDecks);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(backendDecks));
              setLastSyncTime(new Date());
            }
          }
        }
      } catch (err) {
        console.warn('Failed to check for external changes:', err);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [decks]);

  return {
    decks,
    setDecks,
    syncStatus,
    lastSyncTime
  };
}

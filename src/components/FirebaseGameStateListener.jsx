import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { ref, onValue, off, update, get } from 'firebase/database';
import { realTimeDB } from '../firebase';
import { getTableStateUrl } from '../api/tables';
import { setPlayer } from '../store/playerSlice';
import { setGameSession } from '../store/gameSessionSlice';

const SYNC_TIMEOUT_MS = 15000;

function isShouldSyncTrue(data) {
  if (!data || data.shouldSync == null) return false;
  return data.shouldSync === true || data.shouldSync === 'true';
}

const DEBUG_FIREBASE = true; // set false in production

export default function FirebaseGameStateListener({ sessionId, tableId, playerId, currency }) {
  const dispatch = useDispatch();
  const syncInProgressRef = useRef(false);
  const syncTimeoutRef = useRef(null);

  useEffect(() => {
    if (!realTimeDB) {
      if (DEBUG_FIREBASE) console.warn('[Firebase] realTimeDB is null – check firebase config');
      return;
    }
    if (!sessionId || !tableId || !playerId) {
      if (DEBUG_FIREBASE) console.log('[Firebase] skip listener: sessionId/tableId/playerId missing', { sessionId, tableId, playerId });
      return;
    }

    if (DEBUG_FIREBASE) console.log('[Firebase] listening poker/gamestate/' + sessionId);

    const clearSyncTimeout = () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };

    const fetchAndUpdateState = () => {
      clearSyncTimeout();
      syncTimeoutRef.current = setTimeout(() => {
        syncInProgressRef.current = false;
        syncTimeoutRef.current = null;
      }, SYNC_TIMEOUT_MS);

      const url = getTableStateUrl(tableId, playerId, sessionId, currency);
      axios
        .get(url)
        .then((res) => {
          const raw = res.data?.data ?? res.data;
          if (raw) {
            dispatch(setGameSession(raw));
            const mySeat = raw.mySeat ?? raw.seats?.find((s) => s.playerId === playerId);
            if (mySeat) dispatch(setPlayer(mySeat));
          }
        })
        .catch((err) => {
          console.error('Failed to fetch game state:', err);
        })
        .finally(() => {
          clearSyncTimeout();
          syncInProgressRef.current = false;
        });
    };

    const gameStateRef = ref(realTimeDB, `poker/gamestate/${sessionId}`);

    const runSync = () => {
      if (syncInProgressRef.current) return;
      syncInProgressRef.current = true;
      const isActiveBrowser = document.hasFocus() && document.visibilityState === 'visible';
      if (isActiveBrowser) {
        update(gameStateRef, { shouldSync: false }).catch(() => {});
      }
      fetchAndUpdateState();
    };

    const handleSnapshot = (snapshot) => {
      const data = snapshot.val();
      if (DEBUG_FIREBASE) console.log('[Firebase] snapshot', data ? { shouldSync: data.shouldSync, updatedAt: data.updatedAt } : null);
      if (!isShouldSyncTrue(data)) return;
      if (DEBUG_FIREBASE) console.log('[Firebase] shouldSync=true, fetching state');
      runSync();
    };

    onValue(gameStateRef, handleSnapshot);

    get(gameStateRef)
      .then((snapshot) => {
        const data = snapshot.val();
        if (DEBUG_FIREBASE) console.log('[Firebase] initial get', data ? { shouldSync: data.shouldSync } : null);
        if (isShouldSyncTrue(data)) runSync();
      })
      .catch((err) => {
        console.error('[Firebase] get failed:', err);
      });

    return () => {
      off(gameStateRef, handleSnapshot);
      clearSyncTimeout();
      syncInProgressRef.current = false;
    };
  }, [sessionId, tableId, playerId, currency, dispatch]);

  return null;
}

import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { ref, onValue, off } from 'firebase/database';
import { realTimeDB } from '../firebase';
import { getTableStateUrl } from '../api/tables';
import { setPlayer } from '../store/playerSlice';
import { setGameSession } from '../store/gameSessionSlice';

const SYNC_TIMEOUT_MS = 15000;
const DEBUG_FIREBASE = process.env.NODE_ENV !== 'production';

export default function FirebaseGameStateListener({ sessionId, tableId, playerId, currency }) {
  const dispatch = useDispatch();
  const syncInProgressRef = useRef(false);
  const syncTimeoutRef = useRef(null);
  const latestTimestampRef = useRef(0);
  const fetchedTimestampRef = useRef(0);

  const fetchAndDispatch = useCallback((targetTimestamp, onDone) => {
    const url = getTableStateUrl(tableId, playerId, sessionId, currency);
    if (DEBUG_FIREBASE) console.log('[Firebase] fetching game state');
    axios
      .get(url)
      .then((res) => {
        const raw = res.data?.data ?? res.data;
        if (raw) {
          dispatch(setGameSession(raw));
          const mySeat = raw.mySeat ?? raw.seats?.find((s) => s.playerId === playerId);
          if (mySeat) dispatch(setPlayer(mySeat));
          fetchedTimestampRef.current = Math.max(fetchedTimestampRef.current, targetTimestamp);
        }
      })
      .catch((err) => {
        console.error('[Firebase] fetch failed:', err);
      })
      .finally(() => {
        onDone?.();
      });
  }, [dispatch, tableId, playerId, sessionId, currency]);

  useEffect(() => {
    if (!realTimeDB) return;
    if (!sessionId || !tableId || !playerId) return;

    if (DEBUG_FIREBASE) console.log('[Firebase] attaching listener:', sessionId);

    const clearSyncTimeout = () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };

    const triggerSync = () => {
      if (syncInProgressRef.current) return;
      if (latestTimestampRef.current <= fetchedTimestampRef.current) return;

      syncInProgressRef.current = true;
      const targetTimestamp = latestTimestampRef.current;

      clearSyncTimeout();
      syncTimeoutRef.current = setTimeout(() => {
        syncInProgressRef.current = false;
        syncTimeoutRef.current = null;
        triggerSync();
      }, SYNC_TIMEOUT_MS);

      fetchAndDispatch(targetTimestamp, () => {
        clearSyncTimeout();
        syncInProgressRef.current = false;
        triggerSync();
      });
    };

    const gameStateRef = ref(realTimeDB, `poker/gamestate/${sessionId}`);

    const handleSnapshot = (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      const newTimestamp = data.timestamp ? Number(data.timestamp) : 0;
      
      // Update aane par timestamp check karo, agar greater hai toh state API call karo
      if (newTimestamp > latestTimestampRef.current) {
        if (DEBUG_FIREBASE) console.log(`[Firebase] update ts=${newTimestamp}`);
        latestTimestampRef.current = newTimestamp;
        triggerSync();
      }
    };

    onValue(gameStateRef, handleSnapshot);

    return () => {
      off(gameStateRef, handleSnapshot);
      clearSyncTimeout();
      syncInProgressRef.current = false;
    };
  }, [sessionId, tableId, playerId, currency, dispatch, fetchAndDispatch]);

  return null;
}

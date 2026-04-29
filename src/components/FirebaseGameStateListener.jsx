import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { ref, onValue, off } from 'firebase/database';
import { realTimeDB } from '../firebase';
import { getTableStateUrl } from '../api/tables';
import { setPlayer } from '../store/playerSlice';
import { setGameSession } from '../store/gameSessionSlice';

const SYNC_TIMEOUT_MS = 15000;



const DEBUG_FIREBASE = true; // set false in production

export default function FirebaseGameStateListener({ sessionId, tableId, playerId, currency }) {
  const dispatch = useDispatch();
  const syncInProgressRef = useRef(false);
  const syncTimeoutRef = useRef(null);
  const latestVersionRef = useRef(0);
  const latestTimestampRef = useRef(0);
  const fetchedVersionRef = useRef(0);
  const fetchedTimestampRef = useRef(0);

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

    const triggerSync = () => {
      if (syncInProgressRef.current) return;

      const needsSync = latestVersionRef.current > fetchedVersionRef.current ||
        latestTimestampRef.current > fetchedTimestampRef.current;

      if (needsSync) {
        syncInProgressRef.current = true;

        const targetVersion = latestVersionRef.current;
        const targetTimestamp = latestTimestampRef.current;

        clearSyncTimeout();
        syncTimeoutRef.current = setTimeout(() => {
          syncInProgressRef.current = false;
          syncTimeoutRef.current = null;
          triggerSync();
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

              fetchedVersionRef.current = targetVersion;
              fetchedTimestampRef.current = targetTimestamp;
            }
          })
          .catch((err) => {
            console.error('Failed to fetch game state:', err);
          })
          .finally(() => {
            clearSyncTimeout();
            syncInProgressRef.current = false;
            triggerSync();
          });
      }
    };

    const gameStateRef = ref(realTimeDB, `poker/gamestate/${sessionId}`);

    const handleSnapshot = (snapshot) => {
      const data = snapshot.val();
      if (DEBUG_FIREBASE) console.log('[Firebase] snapshot', data ? { version: data.version, timestamp: data.timestamp } : null);

      if (!data) return;

      const newVersion = data.version ? Number(data.version) : 0;
      const newTimestamp = data.timestamp ? Number(data.timestamp) : 0;

      if (newVersion > latestVersionRef.current || newTimestamp > latestTimestampRef.current) {
        if (DEBUG_FIREBASE) console.log(`[Firebase] update detected (version: ${latestVersionRef.current}->${newVersion}, timestamp: ${latestTimestampRef.current}->${newTimestamp}), triggering sync`);
        latestVersionRef.current = Math.max(latestVersionRef.current, newVersion);
        latestTimestampRef.current = Math.max(latestTimestampRef.current, newTimestamp);
        triggerSync();
      }
    };

    onValue(gameStateRef, handleSnapshot);

    return () => {
      off(gameStateRef, handleSnapshot);
      clearSyncTimeout();
      syncInProgressRef.current = false;
    };
  }, [sessionId, tableId, playerId, currency, dispatch]);

  return null;
}

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { ref, onValue, off, update, get } from 'firebase/database';
import { realTimeDB } from '../firebase';
import { getTableStateUrl } from '../api/tables';
import { setPlayer } from '../store/playerSlice';
import { setGameSession } from '../store/gameSessionSlice';

export default function FirebaseGameStateListener({ sessionId, tableId, playerId, currency, mode }) {
  const dispatch = useDispatch();
  const syncInProgressRef = useRef(false);

  useEffect(() => {
    if (!sessionId || !tableId || !playerId) return;

    const fetchAndUpdateState = () => {
      axios
        .get(getTableStateUrl(tableId, playerId, sessionId, currency, mode))
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
          syncInProgressRef.current = false;
        });
    };

    const gameStateRef = ref(realTimeDB, `poker/gamestate/${sessionId}`);

    const handleSnapshot = (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      if (data.shouldSync === true) {
        if (syncInProgressRef.current) return;
        
        syncInProgressRef.current = true;
        
        const isActiveBrowser = document.hasFocus() && document.visibilityState === 'visible';
        if (isActiveBrowser) {
          update(gameStateRef, { shouldSync: false }).catch(() => {});
        }
        
        fetchAndUpdateState();
      }
    };

    onValue(gameStateRef, handleSnapshot);
    
    get(gameStateRef)
      .then((snapshot) => {
        const data = snapshot.val();
        if (data && data.shouldSync === true && !syncInProgressRef.current) {
          syncInProgressRef.current = true;
          
          const isActiveBrowser = document.hasFocus() && document.visibilityState === 'visible';
          if (isActiveBrowser) {
            update(gameStateRef, { shouldSync: false }).catch(() => {});
          }
          
          fetchAndUpdateState();
        }
      })
      .catch(() => {});
    return () => {
      off(gameStateRef, handleSnapshot);
      syncInProgressRef.current = false;
    };
  }, [sessionId, tableId, playerId, currency, mode, dispatch]);

  return null;
}

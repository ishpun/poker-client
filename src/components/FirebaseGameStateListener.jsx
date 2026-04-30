import { useEffect, useRef, useCallback } from 'react';
import { ref, onValue } from 'firebase/database';
import { realTimeDB } from '../firebase';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { getTableStateUrl } from '../api/tables';
import { setGameSession } from '../store/gameSessionSlice';
import { setPlayer } from '../store/playerSlice';

/**
 * Game state synchronization component that uses version-based logic
 * Listens to poker versions and fetches data when a newer version is available
 */
const FirebaseGameStateListener = ({ sessionId, tableId, playerId, currency }) => {
  const dispatch = useDispatch();
  
  // Ref to track the last version we successfully processed
  const lastProcessedVersionRef = useRef(0);
  const lastProcessedTimestampRef = useRef(0);
  const unsubscribeRef = useRef(null);

  // Function to fetch game state
  const fetchState = useCallback(async (expectedVersion, expectedTimestamp) => {
    if (!sessionId || !tableId || !playerId || !currency) return null;
    
    try {
      console.log(`[FirebaseSync] Fetching game state${expectedVersion !== undefined ? ` for v:${expectedVersion} t:${expectedTimestamp}` : ''} (Player: ${playerId})`);
      
      const stateUrl = getTableStateUrl(tableId, playerId, sessionId, currency);
      const stateRes = await axios.get(stateUrl);
      const stateData = stateRes.data?.data ?? stateRes.data;
      
      if (stateData) {
        dispatch(setGameSession(stateData));
        const mySeat = stateData.mySeat ?? stateData.seats?.find((s) => s.playerId === playerId);
        if (mySeat) dispatch(setPlayer(mySeat));

        // Get actual version from the fetched state
        const fetchedVersion = stateData.stateVersion || 0;
        
        // Update the refs. Use the max to ensure we don't process backwards if state is slightly stale
        lastProcessedVersionRef.current = expectedVersion !== undefined ? Math.max(expectedVersion, fetchedVersion) : fetchedVersion;
        if (expectedTimestamp !== undefined) {
          lastProcessedTimestampRef.current = Math.max(expectedTimestamp, lastProcessedTimestampRef.current);
        }
        
        console.log(`[FirebaseSync] Successfully synced. Ref version: ${lastProcessedVersionRef.current}, Ref timestamp: ${lastProcessedTimestampRef.current}`);
      }
    } catch (error) {
      console.error(`[FirebaseSync] Error in fetchState:`, error);
    }
  }, [sessionId, tableId, playerId, currency, dispatch]);

  // Main effect to listen to poker version
  useEffect(() => {
    if (!sessionId || !playerId) {
      return;
    }

    console.log(`[FirebaseSync] Starting dual resync listener for session ${sessionId}, player ${playerId}`);

    // Listen to the game's resync node
    const gameResyncRef = ref(realTimeDB, `poker/${sessionId}/player/${playerId}`);
    
    const unsubscribe = onValue(gameResyncRef, (snapshot) => {
      const data = snapshot.val();
      
      if (!data) return;

      const incomingVersion = data.stateVersion || 0;
      const incomingTimestamp = data.updatedAt || 0;
      
      console.log(`[FirebaseSync] Firebase check: Incoming [v:${incomingVersion} t:${incomingTimestamp}], Last [v:${lastProcessedVersionRef.current} t:${lastProcessedTimestampRef.current}]`);
      
      // Sync if EITHER the version or the timestamp has increased
      const isNewer = incomingVersion > lastProcessedVersionRef.current || 
                      incomingTimestamp > lastProcessedTimestampRef.current;
      
      if (isNewer) {
        console.log(`[FirebaseSync] Newer version or timestamp detected! Fetching...`);
        fetchState(incomingVersion, incomingTimestamp);
      }
    });

    unsubscribeRef.current = unsubscribe;

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [sessionId, playerId, fetchState]);

  return null; // Logic-only component
};

export default FirebaseGameStateListener;

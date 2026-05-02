import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { getTableByIdUrl, getTableStateUrl, submitActionUrl, getTestFirebaseUrl } from '../api/tables';
import Button from '../components/Button';
import GameHeader from '../components/GameHeader';
import TableView from '../components/TableView';
import FirebaseGameStateListener from '../components/FirebaseGameStateListener';
import ActionButtons from '../components/ActionButtons';
import { setPlayer, clearPlayer } from '../store/playerSlice';
import { setGameSession, clearGameSession } from '../store/gameSessionSlice';

const getApiBase = () => {
  const host = process.env.REACT_APP_API_HOST;
  if (host) return host.replace(/\/api\/game\/?$/, '');
  return window.location.origin;
};



const joinPromiseByKey = {};

export default function Play() {
  const { tableId, playerId, currency: currencyParam, token: tokenParam, tenantId: tenantIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currency = (currencyParam || 'PC').toUpperCase();
  const tenantId = tenantIdParam || '64b0bc14-6e24-4d10-9bf3-6afb7cac3ff9';
  const tokenRaw = tokenParam || searchParams.get('token');
  const tokenForJoin = (tokenRaw === 'null' || !tokenRaw) ? null : tokenRaw;
  const dispatch = useDispatch();
  const player = useSelector((state) => state.player);
  const gameSession = useSelector((state) => state.gameSession);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tableConfig, setTableConfig] = useState(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveMessage, setLeaveMessage] = useState({ type: '', text: '' });

  const executeGameAction = useCallback(async (actionType, extraPayload = {}) => {
    const url = submitActionUrl();
    console.log(`[GameAction] Executing ${actionType} at`, url);
    return axios.post(url, {
      actionType,
      sessionId: gameSession?.sessionId,
      tableId,
      tenantId,
      currency,
      pToken: tokenForJoin,
      ...extraPayload
    });
  }, [gameSession?.sessionId, tableId, tenantId, currency, tokenForJoin]);

  const botJoinTimerStartedRef = useRef(false);
  const botJoinTimeoutRef = useRef(null);

  useEffect(() => {
    console.log("Bot Join Effect Triggered:", {
      isBotGame: tableConfig?.isBotGame,
      status: gameSession?.status,
      botShouldJoinAt: gameSession?.botShouldJoinAt
    });
    if (tableConfig?.isBotGame &&
      gameSession?.status === 'WAITING' && gameSession?.botShouldJoinAt) {
      const filledSeats = gameSession.seats?.filter(s => s && s.playerId).length || 0;
      const maxSeats = tableConfig?.seatCount || 6;

      if (filledSeats < maxSeats) {
        if (!botJoinTimerStartedRef.current) {
          botJoinTimerStartedRef.current = true;

          const targetTime = new Date(gameSession.botShouldJoinAt).getTime();
          const delay = targetTime - Date.now();
          console.log(`Scheduling bot join based on BE time in ${delay} ms`);

          if (delay <= 0) {
            executeGameAction('ADD_BOT', { playerId })
              .catch(err => console.error("Failed to add bot:", err))
              .finally(() => { botJoinTimerStartedRef.current = false; });
          } else {
            botJoinTimeoutRef.current = setTimeout(() => {
              executeGameAction('ADD_BOT', { playerId })
                .catch(err => console.error("Failed to add bot:", err))
                .finally(() => {
                  botJoinTimerStartedRef.current = false;
                  botJoinTimeoutRef.current = null;
                });
            }, delay);
          }
        }
      } else {
        if (botJoinTimeoutRef.current) {
          clearTimeout(botJoinTimeoutRef.current);
          botJoinTimeoutRef.current = null;
        }
        botJoinTimerStartedRef.current = false;
      }
    }
  }, [tableConfig, gameSession, tableId, playerId, executeGameAction]);

  useEffect(() => {
    return () => {
      if (botJoinTimeoutRef.current) {
        clearTimeout(botJoinTimeoutRef.current);
      }
    };
  }, []);

  const turnTimeoutRef = useRef(null);
  const turnTimeoutScheduledRef = useRef(null);
  const botActionTimeoutRef = useRef(null);
  const botActionScheduledRef = useRef(null);

  useEffect(() => {
    const currentActorSeat = gameSession?.seats?.find(s => s && (s.isCurrentActor === true || Number(s.position) === Number(gameSession.currentActorSeatIndex)));
    const currentActorPlayerId = currentActorSeat?.playerId;

    console.log("Turn Timeout Effect Triggered:", {
      sessionId: gameSession?.sessionId,
      currentActorPlayerId,
      turnStartedAt: gameSession?.turnStartedAt,
      turnTimerSeconds: gameSession?.turnTimerSeconds
    });

    if (
      gameSession?.sessionId &&
      gameSession?.status !== 'COMPLETED' &&
      !gameSession?.gameOver &&
      currentActorPlayerId &&
      (gameSession?.turnEndsAt || (gameSession?.turnStartedAt && gameSession?.turnTimerSeconds))
    ) {
      const turnEndsAt = gameSession.turnEndsAt
        ? new Date(gameSession.turnEndsAt).getTime()
        : (new Date(gameSession.turnStartedAt).getTime() + gameSession.turnTimerSeconds * 1000);
      const turnKey = `${gameSession.sessionId}_${gameSession.turnEndsAt || gameSession.turnStartedAt}_${currentActorPlayerId}`;

      if (turnTimeoutScheduledRef.current !== turnKey) {
        turnTimeoutScheduledRef.current = turnKey;

        let clockOffset = 0;
        if (gameSession.serverTime) {
          const serverNow = new Date(gameSession.serverTime).getTime();
          const clientNow = Date.now();
          clockOffset = serverNow - clientNow;
        }

        const adjustedNow = Date.now() + clockOffset;
        const timeLeft = turnEndsAt - adjustedNow;

        if (turnTimeoutRef.current) {
          clearTimeout(turnTimeoutRef.current);
        }

        if (timeLeft <= 0) {
          executeGameAction('PLAYER_SKIP', { playerId: currentActorPlayerId })
            .catch(err => console.error("Failed to hit turn timeout:", err));
        } else {
          const delay = timeLeft + 2000; // Add 2s buffer
          console.log(`Scheduling turn timeout for player ${currentActorPlayerId} in ${delay} ms (Clock Offset: ${clockOffset} ms)`);

          turnTimeoutRef.current = setTimeout(() => {
            executeGameAction('PLAYER_SKIP', { playerId: currentActorPlayerId })
              .catch(err => console.error("Failed to hit turn timeout:", err))
              .finally(() => { turnTimeoutRef.current = null; });
          }, delay);
        }
      }
    } else {
      if (turnTimeoutRef.current) {
        clearTimeout(turnTimeoutRef.current);
        turnTimeoutRef.current = null;
      }
      turnTimeoutScheduledRef.current = null;
    }

    return () => {
      if (turnTimeoutRef.current) {
        clearTimeout(turnTimeoutRef.current);
      }
    };
  }, [gameSession?.turnStartedAt, gameSession?.turnTimerSeconds, gameSession?.turnEndsAt, gameSession?.currentActorSeatIndex, gameSession?.seats, gameSession?.sessionId, tableId, gameSession?.serverTime, gameSession?.gameOver, gameSession?.status, executeGameAction]);
  useEffect(() => {
    const currentActorSeat = gameSession?.seats?.find(s => s && (s.isCurrentActor === true || Number(s.position) === Number(gameSession.currentActorSeatIndex)));
    const currentActorPlayerId = currentActorSeat?.playerId;

    if (
      gameSession?.sessionId &&
      gameSession?.status !== 'COMPLETED' &&
      !gameSession?.gameOver &&
      currentActorPlayerId &&
      gameSession?.botActionAt
    ) {
      const botActionAt = new Date(gameSession.botActionAt).getTime();
      const botActionKey = `${gameSession.sessionId}_${gameSession.botActionAt}_${currentActorPlayerId}`;

      if (botActionScheduledRef.current !== botActionKey) {
        botActionScheduledRef.current = botActionKey;

        let clockOffset = 0;
        if (gameSession.serverTime) {
          const serverNow = new Date(gameSession.serverTime).getTime();
          const clientNow = Date.now();
          clockOffset = serverNow - clientNow;
        }

        const adjustedNow = Date.now() + clockOffset;
        const timeLeft = botActionAt - adjustedNow;

        if (botActionTimeoutRef.current) {
          clearTimeout(botActionTimeoutRef.current);
        }

        if (timeLeft <= 0) {
          executeGameAction('BOT_ACTION', { playerId: currentActorPlayerId, isBot: true })
            .catch(err => console.error("Failed to hit bot action:", err));
        } else {
          console.log(`Scheduling bot action for player ${currentActorPlayerId} in ${timeLeft} ms`);

          botActionTimeoutRef.current = setTimeout(() => {
            executeGameAction('BOT_ACTION', { playerId: currentActorPlayerId, isBot: true })
              .catch(err => console.error("Failed to hit bot action:", err))
              .finally(() => { botActionTimeoutRef.current = null; });
          }, timeLeft);
        }
      }
    } else {
      if (botActionTimeoutRef.current) {
        clearTimeout(botActionTimeoutRef.current);
        botActionTimeoutRef.current = null;
      }
      botActionScheduledRef.current = null;
    }

    return () => {
      if (botActionTimeoutRef.current) {
        clearTimeout(botActionTimeoutRef.current);
      }
    };
  }, [gameSession?.botActionAt, gameSession?.currentActorSeatIndex, gameSession?.seats, gameSession?.sessionId, tableId, gameSession?.serverTime, gameSession?.gameOver, gameSession?.status, executeGameAction]);
  useEffect(() => {
    if (!tableId || !playerId) {
      setError('Table ID and Player ID are required.');
      setLoading(false);
      return;
    }

    const key = `${tableId}\n${playerId}\n${currency}\n${tenantId}\n${String(tokenForJoin ?? '')}`;
    if (!joinPromiseByKey[key]) {
      const joinBody = {
        actionType: 'PLAYER_JOIN',
        playerId,
        tableId,
        pToken: tokenForJoin,
        currency,
        tenantId
      };
      console.log('[Join] Calling Firebase Test Write...');
      axios.get(getTestFirebaseUrl()).catch(err => console.error("Firebase test write failed:", err));

      console.log('[Join] Calling unified join API for', { tableId, playerId });
      joinPromiseByKey[key] = axios
        .get(getTableByIdUrl(tableId))
        .then((configRes) => {
          const config = configRes.data?.data || configRes.data;
          return axios.post(submitActionUrl(), joinBody).then((joinRes) => ({ tableConfig: config, joinData: joinRes.data }));
        })
        .finally(() => { delete joinPromiseByKey[key]; });
    } else {
      console.log('[Join] Reusing in-flight join promise for', { tableId, playerId });
    }

    let cancelled = false;
    joinPromiseByKey[key]
      .then((data) => {
        if (!cancelled) {
          console.log('[Join] Join SUCCESS');
          setTableConfig(data.tableConfig);
          const joinDataInner = data.joinData?.data ?? data.joinData;
          if (joinDataInner) {
            // First set session info (like sessionId) to trigger Firebase listener
            dispatch(setGameSession(joinDataInner));

            // IMMEDIATE STATE FETCH: Guarantee state is loaded right after join
            if (joinDataInner.sessionId) {
              const stateUrl = getTableStateUrl(tableId, playerId, joinDataInner.sessionId, currency);
              console.log('[Join] Fetching full game state immediately after join...');
              axios.get(stateUrl)
                .then(stateRes => {
                  const stateData = stateRes.data?.data ?? stateRes.data;
                  if (stateData && !cancelled) {
                    dispatch(setGameSession(stateData));
                    const mySeat = stateData.mySeat ?? stateData.seats?.find((s) => s.playerId === playerId);
                    if (mySeat) dispatch(setPlayer(mySeat));
                    console.log('[Join] Initial full state loaded successfully');
                  }
                })
                .catch(err => console.error('[Join] Failed to load initial state:', err));
            }
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err.response?.data?.message || err.message;
          const fallback = String(err.config?.url || '').includes('join') ? 'Failed to join game.' : 'Failed to load table config.';
          console.error('[Join] Join FAILED:', msg);
          setError(msg || fallback);
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      cancelled = true;
      dispatch(clearPlayer());
      dispatch(clearGameSession());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId, playerId]);  // ← intentionally minimal deps; currency/token captured at mount

  const handleLeaveGame = async () => {
    setLeaveLoading(true);
    setLeaveMessage({ type: '', text: '' });

    try {
      await executeGameAction('PLAYER_LEAVE', { playerId });
      setLeaveMessage({ type: 'success', text: 'Left game successfully.' });
      // Navigate back to tables after a short delay
      setTimeout(() => navigate('/tables'), 1000);
    } catch (err) {
      const text = err.response?.data?.message || err.message || 'Failed to leave game.';
      setLeaveMessage({ type: 'error', text });
    } finally {
      setLeaveLoading(false);
    }
  };

  const pageStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    margin: 0,
    overflow: 'auto',
    backgroundImage: 'url(/assests/background.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    padding: 0,
    boxSizing: 'border-box',
  };
  const overlayStyle = { color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' };

  if (loading) {
    return (
      <div className="play-page" style={{ ...pageStyle, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...overlayStyle, textAlign: 'center' }}>
          <p>Joining game…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="play-page" style={{ ...pageStyle, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 500, ...overlayStyle, textAlign: 'center' }}>
          <p style={{ color: '#ffcdd2', marginBottom: '1rem' }}>{error}</p>
          <Button onClick={() => navigate('/tables')}>Back to Tables</Button>
        </div>
      </div>
    );
  }

  const hasGameSession = gameSession.sessionId != null;

  return (
    <div className="play-page" style={{ ...pageStyle, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <FirebaseGameStateListener sessionId={gameSession?.sessionId} tableId={tableId} playerId={playerId} currency={currency} />
      <GameHeader tableConfig={tableConfig} tableId={tableId} sessionId={gameSession.sessionId} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="play-status-bar" style={{ ...overlayStyle }}>
          <div className="play-badges" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ padding: '0.25rem 0.6rem', background: 'rgba(255,152,0,0.9)', color: '#fff', borderRadius: 6, fontSize: 13 }}>
              {currency}
            </span>
            {hasGameSession && (
              <>
                <span style={{ padding: '0.25rem 0.6rem', background: 'rgba(76,175,80,0.9)', color: '#fff', borderRadius: 6, fontSize: 13 }}>
                  {gameSession.currentStreet || gameSession.street || '—'}
                </span>
                {gameSession.canStartHand && (
                  <span style={{ padding: '0.25rem 0.6rem', background: 'rgba(33,150,243,0.9)', color: '#fff', borderRadius: 6, fontSize: 13 }}>Can start hand</span>
                )}
                {gameSession.potAmount != null && (
                  <span style={{ padding: '0.25rem 0.6rem', background: 'rgba(0,0,0,0.4)', color: '#fff', borderRadius: 6, fontSize: 13 }}>Pot: {gameSession.potAmount}</span>
                )}
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {leaveMessage.text && (
              <span style={{ color: leaveMessage.type === 'error' ? '#ffcdd2' : '#c8e6c9', fontSize: 12, marginRight: '0.5rem' }}>
                {leaveMessage.text}
              </span>
            )}
            <Button
              variant="danger"
              onClick={handleLeaveGame}
              disabled={leaveLoading}
              style={{ marginRight: '0.5rem' }}
            >
              {leaveLoading ? 'Leaving…' : 'Leave Game'}
            </Button>
            <Button onClick={() => navigate('/tables')}>Back to Tables</Button>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TableView tableConfig={tableConfig} gameSession={gameSession} myPlayerId={playerId} currentPlayer={player.playerId ? player : null} />
        </div>
        {hasGameSession && !gameSession.gameOver && gameSession.status !== 'COMPLETED' && player.isCurrentActor && gameSession.allowedActions && gameSession.allowedActions.length > 0 && !['FOLDED', 'ALL_IN', 'QUIT'].includes((player.status || '').toUpperCase()) && (
          <ActionButtons
            allowedActions={gameSession.allowedActions}
            tableId={tableId}
            seatIndex={player.position}
            playerId={playerId}
            sessionId={gameSession.sessionId}
            tenantId={tenantId}
            currency={currency}
            pToken={tokenForJoin}
            onActionSubmitted={() => { }}
          />
        )}
      </div>
    </div>
  );
}

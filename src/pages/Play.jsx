import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { getJoinGameUrl, getTableByIdUrl } from '../api/tables';
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

const getLeaveGameUrl = (tableId, playerId) => {
  const base = getApiBase();
  return `${base}/api/game/tables/${tableId}/players/${playerId}/leave`;
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

  useEffect(() => {
    if (!tableId || !playerId) {
      setError('Table ID and Player ID are required.');
      setLoading(false);
      return;
    }

    const key = `${tableId}\n${playerId}\n${currency}\n${tenantId}\n${String(tokenForJoin ?? '')}`;
    if (!joinPromiseByKey[key]) {
      const joinBody = { pToken: tokenForJoin, currency, tenantId };
      joinPromiseByKey[key] = axios
        .get(getTableByIdUrl(tableId))
        .then((configRes) => {
          const config = configRes.data?.data || configRes.data;
          return axios.post(getJoinGameUrl(tableId, playerId), joinBody).then((joinRes) => ({ tableConfig: config, joinData: joinRes.data }));
        })
        .finally(() => { delete joinPromiseByKey[key]; });
    }

    let cancelled = false;
    joinPromiseByKey[key]
      .then((data) => {
        if (!cancelled) {
          setTableConfig(data.tableConfig);
          const joinDataInner = data.joinData?.data ?? data.joinData;
          if (joinDataInner) {
            dispatch(setGameSession(joinDataInner));
            const mySeat = joinDataInner.mySeat ?? joinDataInner.seats?.find((s) => s.playerId === playerId);
            if (mySeat) dispatch(setPlayer(mySeat));
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err.response?.data?.message || err.message;
          const fallback = String(err.config?.url || '').includes('join') ? 'Failed to join game.' : 'Failed to load table config.';
          setError(msg || fallback);
        }
      })
      .finally(() => setLoading(false));

    return () => {
      cancelled = true;
      dispatch(clearPlayer());
      dispatch(clearGameSession());
    };
  }, [tableId, playerId, currency, tenantId, tokenForJoin, dispatch]);

  const handleLeaveGame = async () => {
    setLeaveLoading(true);
    setLeaveMessage({ type: '', text: '' });

    try {
      const url = `${getLeaveGameUrl(tableId, playerId)}?sessionId=${gameSession.sessionId}`;
      await axios.post(url);
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
        {hasGameSession && player.isCurrentActor && gameSession.allowedActions && gameSession.allowedActions.length > 0 && !['FOLDED', 'ALL_IN', 'QUIT'].includes((player.status || '').toUpperCase()) && (
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

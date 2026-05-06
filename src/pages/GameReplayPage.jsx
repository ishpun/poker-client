import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getSessionByIdUrl } from '../api/game';
import TableView from '../components/TableView';
import Button from '../components/Button';

export default function GameReplayPage() {
  const { sessionId: paramSessionId } = useParams();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(paramSessionId || '');
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('rounds'); // 'info', 'rounds', 'raw'

  const fetchSession = (id) => {
    if (!id) return;
    setLoading(true);
    setError('');
    axios.get(getSessionByIdUrl(id))
      .then(res => {
        setSessionData(res.data?.data || res.data);
        setLoading(false);
        setCurrentStepIndex(0);
      })
      .catch(err => {
        setError(err.response?.data?.message || err.message || 'Failed to fetch session data.');
        setLoading(false);
        setSessionData(null);
      });
  };

  useEffect(() => {
    if (paramSessionId) {
      setSessionId(paramSessionId);
      fetchSession(paramSessionId);
    }
  }, [paramSessionId]);

  const steps = useMemo(() => {
    if (!sessionData) return [];
    const s = [];

    // Initial state step
    s.push({
      type: 'INITIAL',
      description: 'Game Started',
      state: {
        ...sessionData,
        communityCards: [],
        lastHandWinInfo: [],
        seats: sessionData.seats?.map(seat => ({ ...seat, lastAction: null, isCurrentActor: false }))
      }
    });

    const rounds = sessionData.bettingRounds?.rounds || [];
    let cumulativeCommunityCards = [];

    rounds.forEach((round, rIdx) => {
      // Reveal cards for this street
      const communityPool = Array.isArray(sessionData.communityCards) ? sessionData.communityCards : [];
      const street = (round.street || '').toUpperCase();
      let streetCards = [];
      if (street === 'FLOP') streetCards = communityPool.slice(0, 3);
      else if (street === 'TURN') streetCards = communityPool.slice(0, 4);
      else if (street === 'RIVER') streetCards = communityPool.slice(0, 5);
      else if (street === 'PREFLOP') streetCards = [];
      else streetCards = [...cumulativeCommunityCards]; // Keep previous if street is unknown
      
      cumulativeCommunityCards = streetCards;

      s.push({
        type: 'STREET_START',
        description: `Street: ${round.street} Started`,
        state: {
          ...sessionData,
          communityCards: [...cumulativeCommunityCards],
          lastHandWinInfo: [],
          currentStreet: round.street,
          seats: s[s.length - 1].state.seats.map(seat => ({ ...seat, lastAction: null, isCurrentActor: false }))
        }
      });

      round.actions?.forEach((action, aIdx) => {
        const prevState = s[s.length - 1].state;
        const newSeats = prevState.seats.map(seat => {
          if (Number(seat.position) === Number(action.seatIndex)) {
            return {
              ...seat,
              lastAction: action.action,
              // Note: chips update is complex in poker, we show the snapshot value for now
              isCurrentActor: true
            };
          }
          return { ...seat, isCurrentActor: false };
        });

        s.push({
          type: 'ACTION',
          description: `[${round.street}] ${action.playerId} -> ${action.action} (${action.amount || 0})`,
          state: {
            ...prevState,
            seats: newSeats
          }
        });
      });
    });

    // Final winners step
    if (sessionData.lastHandWinInfo?.length > 0) {
      s.push({
        type: 'WINNERS',
        description: 'Winners Declared',
        state: {
          ...sessionData,
          lastHandWinInfo: sessionData.lastHandWinInfo,
          seats: s[s.length - 1].state.seats.map(seat => ({ ...seat, isCurrentActor: false }))
        }
      });
    }

    return s;
  }, [sessionData]);

  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const pageStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'url(/assests/background.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    flexDirection: 'column',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif'
  };

  const debugPanelStyle = {
    flex: '0 0 400px',
    background: 'rgba(0,0,0,0.85)',
    borderLeft: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  const tabStyle = (active) => ({
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    borderBottom: active ? '2px solid #2196F3' : '2px solid transparent',
    background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
    fontSize: 14,
    fontWeight: 600,
    color: active ? '#fff' : '#aaa'
  });

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Poker Debug Replay</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={sessionId} 
              onChange={(e) => setSessionId(e.target.value)} 
              placeholder="Enter Session ID"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.4rem 0.6rem', borderRadius: 4, width: 250, fontSize: 13 }}
            />
            <Button variant="primary" onClick={() => fetchSession(sessionId)} disabled={loading}>Fetch</Button>
          </div>
        </div>
        
        {sessionData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: 13, opacity: 0.8, background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: 20 }}>
              Step {currentStepIndex + 1} / {steps.length}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <Button variant="secondary" onClick={handlePrev} disabled={currentStepIndex === 0}>Prev</Button>
              <Button variant="primary" onClick={handleNext} disabled={currentStepIndex === steps.length - 1}>Next</Button>
            </div>
            <Button variant="danger" onClick={() => navigate('/tables')}>Exit</Button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Visual View */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {!sessionData && !loading && !error && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
              Enter a Session ID above to start debugging
            </div>
          )}
          {loading && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Loading Session...
            </div>
          )}
          {error && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff5252' }}>
              {error}
            </div>
          )}
          {sessionData && (
            <div style={{ flex: 1, position: 'relative' }}>
               <TableView 
                tableConfig={{ seatCount: sessionData.seatCount || 6 }} 
                gameSession={currentStep?.state} 
                myPlayerId={null} 
                currentPlayer={null} 
                showAllCards={true}
              />
              <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', padding: '0.6rem 1.2rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', pointerEvents: 'none' }}>
                <div style={{ fontSize: 16, fontWeight: 700, textAlign: 'center' }}>{currentStep?.description}</div>
              </div>
            </div>
          )}
        </div>

        {/* Debug Panel */}
        {sessionData && (
          <div style={debugPanelStyle}>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={tabStyle(activeTab === 'rounds')} onClick={() => setActiveTab('rounds')}>Rounds</div>
              <div style={tabStyle(activeTab === 'info')} onClick={() => setActiveTab('info')}>Info</div>
              <div style={tabStyle(activeTab === 'raw')} onClick={() => setActiveTab('raw')}>Raw JSON</div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {activeTab === 'rounds' && (
                <div>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#2196F3' }}>Betting History</h4>
                  {steps.map((step, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setCurrentStepIndex(idx)}
                      style={{ 
                        padding: '0.6rem', 
                        fontSize: 12, 
                        borderBottom: '1px solid rgba(255,255,255,0.05)', 
                        cursor: 'pointer',
                        background: idx === currentStepIndex ? 'rgba(33, 150, 243, 0.2)' : 'transparent',
                        borderRadius: 4,
                        marginBottom: 2
                      }}
                    >
                      <span style={{ opacity: 0.5, marginRight: 8 }}>{idx + 1}.</span>
                      <span style={{ fontWeight: step.type === 'STREET_START' ? 700 : 400, color: step.type === 'STREET_START' ? '#4CAF50' : step.type === 'WINNERS' ? '#FFC107' : '#fff' }}>
                        {step.description}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'info' && (
                <div style={{ fontSize: 13 }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#2196F3' }}>Session Metadata</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ opacity: 0.6 }}>Session ID:</div><div>{sessionData.id}</div>
                    <div style={{ opacity: 0.6 }}>Table ID:</div><div>{sessionData.tableId}</div>
                    <div style={{ opacity: 0.6 }}>Status:</div><div>{sessionData.status}</div>
                    <div style={{ opacity: 0.6 }}>Small Blind:</div><div>{sessionData.smallBlind}</div>
                    <div style={{ opacity: 0.6 }}>Big Blind:</div><div>{sessionData.bigBlind}</div>
                    <div style={{ opacity: 0.6 }}>Dealer Seat:</div><div>{sessionData.dealerSeatIndex}</div>
                    <div style={{ opacity: 0.6 }}>Pot:</div><div>{sessionData.bettingRounds?.totalPotAmount}</div>
                    <div style={{ opacity: 0.6 }}>Street:</div><div>{sessionData.currentStreet}</div>
                  </div>

                  <h4 style={{ margin: '0 0 1rem 0', color: '#2196F3' }}>Initial Seats</h4>
                  {sessionData.seats?.map((seat, i) => (
                    <div key={i} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 600 }}>Seat {seat.position}: {seat.playerName} ({seat.playerId})</div>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>Chips: {seat.chips} | Cards: {seat.holeCards?.join(', ')}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'raw' && (
                <div style={{ position: 'relative' }}>
                  <Button 
                    variant="secondary" 
                    style={{ position: 'absolute', top: 5, right: 5, fontSize: 10, padding: '2px 8px' }}
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(sessionData, null, 2));
                      alert('Copied to clipboard!');
                    }}
                  >
                    Copy
                  </Button>
                  <pre style={{ fontSize: 11, background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 4, overflowX: 'auto', margin: 0 }}>
                    {JSON.stringify(sessionData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

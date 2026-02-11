const sep = '  ·  ';
const style = {
  flexShrink: 0,
  width: '100%',
  margin: 0,
  background: 'rgba(0,0,0,0.4)',
  textAlign: 'center',
  overflow: 'hidden',
  color: '#fff',
  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  boxSizing: 'border-box',
};

function trimIdByFirst(id) {
  if (!id || typeof id !== 'string') return '—';
  const trimmed = id.trim();
  const firstSegment = trimmed.split('-')[0];
  return firstSegment || trimmed;
}

export default function GameHeader({ tableConfig, tableId, sessionId }) {
  if (!tableConfig) return null;
  const parts = [
    `Seats: ${tableConfig.seatCount ?? '—'}`,
    `Small blind: ${tableConfig.smallBlind ?? '—'}`,
    `Big blind: ${tableConfig.bigBlind ?? '—'}`,
    `Table ID: ${trimIdByFirst(tableId)}`,
    sessionId && `Session ID: ${trimIdByFirst(sessionId)}`,
  ].filter(Boolean);
  return <header className="game-header" style={style}>{parts.join(sep)}</header>;
}

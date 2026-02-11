const sep = '  ·  ';
const style = {
  flexShrink: 0,
  width: '100%',
  margin: 0,
  padding: '1.25rem 1.5rem',
  background: 'rgba(0,0,0,0.4)',
  textAlign: 'center',
  fontSize: 16,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  color: '#fff',
  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  boxSizing: 'border-box',
};

export default function GameHeader({ tableConfig, tableId, sessionId }) {
  if (!tableConfig) return null;
  const parts = [
    `Seats: ${tableConfig.seatCount ?? '—'}`,
    `Small blind: ${tableConfig.smallBlind ?? '—'}`,
    `Big blind: ${tableConfig.bigBlind ?? '—'}`,
    `Table ID: ${tableId || '—'}`,
    sessionId && `Session ID: ${sessionId}`,
  ].filter(Boolean);
  return <header style={style}>{parts.join(sep)}</header>;
}

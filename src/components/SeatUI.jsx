import TurnCountdown from './TurnCountdown';

const CHIP_ICON = '/assests/practiceChip.png';

function toTitleCase(str) {
  if (!str) return '—';
  return str
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const avatarSize = 85;

const wrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  color: '#fff',
  textShadow: '0 1px 2px rgba(0,0,0,0.6)',
};
const wrapperClassName = 'seat-ui-wrapper';

const avatarWrapStyle = {
  position: 'relative',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
};

const avatarStyle = (isMe) => ({
  width: avatarSize,
  height: avatarSize,
  borderRadius: '50%',
  objectFit: 'cover',
  display: 'block',
  border: '2px solid rgba(255,255,255,0.5)',
  position: 'relative',
  zIndex: 1,
});

const nameStripStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: '4px 6px',
  background: 'rgba(0,0,0,0.65)',
  borderBottomLeftRadius: 40,
  borderBottomRightRadius: 40,
  fontWeight: 600,
  fontSize: 12,
  textAlign: 'center',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  zIndex: 1,
};

const chipsLineStyle = {
  position: 'absolute',
  left: '90%',
  bottom: 0,
  marginLeft: -6,
  zIndex: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 45px 6px 35px',
  background: 'linear-gradient(90deg, rgba(90,35,35,0.92) 0%, rgba(55,18,18,0.96) 100%)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '0 10px 10px 0',
  boxShadow: '2px 0 8px rgba(0,0,0,0.35)',
};

const chipIconStyle = { width: 18, height: 18, objectFit: 'contain', flexShrink: 0 };
const chipsTextStyle = { fontSize: 14, fontWeight: 700, fontStyle: 'italic' };

const emptyStyle = {
  width: avatarSize,
  height: avatarSize,
  borderRadius: '50%',
  background: 'rgba(0,0,0,0.3)',
  border: '1px dashed rgba(255,255,255,0.3)',
  color: 'rgba(255,255,255,0.5)',
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
const emptyClassName = 'seat-empty';

const roleBadgeStyle = (label) => ({
  position: 'absolute',
  top: 10,
  left: -4,
  transform: 'translateY(-50%)',
  minWidth: 22,
  height: 22,
  borderRadius: '50%',
  background: label === 'D' ? '#1976d2' : label === 'SB' ? '#388e3c' : '#f57c00',
  color: '#fff',
  fontSize: 10,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2,
  padding: '0 4px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
});
const roleBadgeClassName = 'seat-role-badge';

const STATUS_OVERLAY = ['FOLDED', 'ALL_IN', 'QUIT', 'WINNER'];

const statusOverlayStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: avatarSize,
  height: avatarSize,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.5)',
  color: 'rgba(255,255,255,0.9)',
  fontSize: 12,
  fontWeight: 700,
  textAlign: 'center',
  zIndex: 3,
  pointerEvents: 'none',
};
const statusOverlayClassName = 'seat-status-overlay';

const winnerOverlayStyle = {
  ...statusOverlayStyle,
  background: 'rgba(255,193,7,0.4)',
  color: '#fff',
  fontSize: 11,
  fontWeight: 800,
  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
  flexDirection: 'column',
  gap: 2,
};
const winnerOverlayClassName = 'seat-status-overlay';

const winnerHandRankStyle = { fontSize: 10, fontWeight: 700, opacity: 0.95 };
const winnerPayoutStyle = { fontSize: 13, fontWeight: 800 };

const cardsContainerStyle = {
  position: 'absolute',
  right: -100,
  bottom: '60%',
  transform: 'translateY(50%)',
  display: 'flex',
  alignItems: 'flex-end',
  zIndex: -1,
  overflow: 'visible',
};

const cardStyle = (index, total) => ({
  width: 58,
  height: 81,
  marginLeft: index > 0 ? -14 : 0,
  transform: `rotate(${(index - (total - 1) / 2) * 10}deg)`,
  transformOrigin: 'bottom center',
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
  zIndex: total - index,
});

const emptyCardSlotStyle = (index, total) => ({
  width: 58,
  height: 81,
  marginLeft: index > 0 ? -14 : 0,
  transform: `rotate(${(index - (total - 1) / 2) * 10}deg)`,
  transformOrigin: 'bottom center',
  borderRadius: 6,
  background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
  border: '2px solid rgba(255,255,255,0.3)',
  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.4)',
  position: 'relative',
  zIndex: total - index,
  overflow: 'hidden',
});

const cardBackPatternStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: `
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 8px,
      rgba(255,255,255,0.05) 8px,
      rgba(255,255,255,0.05) 10px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 8px,
      rgba(255,255,255,0.05) 8px,
      rgba(255,255,255,0.05) 10px
    )
  `,
  borderRadius: 4,
};

const cardBackCenterStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 20,
  height: 20,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
  border: '2px solid rgba(255,255,255,0.15)',
};

const currentActorHighlightStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: avatarSize,
  height: avatarSize,
  borderRadius: '50%',
  background: 'rgba(76, 175, 80, 0.3)',
  border: '4px solid #ff9800',
  boxShadow: '0 0 15px rgba(255, 152, 0, 0.8), 0 0 30px rgba(255, 152, 0, 0.5), inset 0 0 20px rgba(76, 175, 80, 0.2)',
  zIndex: 2,
  animation: 'pulse 2s ease-in-out infinite',
  pointerEvents: 'none',
};
const currentActorHighlightClassName = 'seat-current-highlight';

const actionBubbleStyle = {
  position: 'relative',
  marginTop: 6,
  padding: '6px 14px',
  background: '#fff',
  color: '#000',
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: 'nowrap',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
  zIndex: 4,
  pointerEvents: 'none',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  alignSelf: 'center',
};
const actionBubbleClassName = 'seat-action-bubble';

const actionBubbleArrowStyle = {
  position: 'absolute',
  bottom: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 0,
  height: 0,
  borderLeft: '8px solid transparent',
  borderRight: '8px solid transparent',
  borderBottom: '10px solid #fff',
};

if (typeof document !== 'undefined' && !document.getElementById('seat-ui-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'seat-ui-animations';
  styleSheet.textContent = `
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      50% {
        opacity: 0.7;
        transform: translate(-50%, -50%) scale(1.05);
      }
    }
  `;
  document.head.appendChild(styleSheet);
}

const parseCardString = (cardStr) => {
  if (!cardStr || typeof cardStr !== 'string' || cardStr.length < 2) return null;
  const rankStr = cardStr.slice(0, -1);
  const suitStr = cardStr.slice(-1).toUpperCase();
  const rankMap = { A: 1, K: 13, Q: 12, J: 11 };
  const rank = rankMap[rankStr.toUpperCase()] ?? parseInt(rankStr, 10);
  if (!rank || isNaN(rank)) return null;
  return { rank, suit: suitStr };
};

const getCardSrc = (cardStr) => {
  const card = parseCardString(cardStr);
  if (!card) return null;
  const suitMap = { H: 'Hearts', D: 'Diamonds', C: 'Clubs', S: 'Spades' };
  const folder = suitMap[card.suit] || 'Hearts';
  return `/Cards/${folder}/${card.rank}.svg`;
};

function formatHandRank(handRank) {
  if (!handRank || typeof handRank !== 'string') return '';
  return handRank
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAction(action) {
  if (!action) return '';
  const actionMap = {
    'FOLD': 'Fold',
    'CALL': 'Call',
    'RAISE': 'Raise',
    'BET': 'Bet',
    'CHECK': 'Check',
    'ALL_IN': 'All In',
  };
  return actionMap[action.toUpperCase()] || action;
}

function getActionFromSeat(seat) {
  if (!seat) return null;
  if (seat.lastAction) return seat.lastAction;
  if (seat.currentAction) return seat.currentAction;
  if (seat.action) return seat.action;
  const status = (seat.status || '').toUpperCase();
  if (status === 'FOLDED') return 'FOLD';
  
  return null;
}

export default function SeatUI({ seat, isMe, roleLabel, winnerInfo, turnStartedAt, turnTimerSeconds }) {
  const filled = seat && seat.playerId;
  const avatarSrc = filled && seat.playerAvatar ? `/assests/avatars/avtr_${seat.playerAvatar}.svg` : null;
  const holeCards = seat?.holeCards ?? [];

  if (!filled) {
    return (
      <div className={wrapperClassName} style={wrapperStyle}>
        <div style={{ ...avatarWrapStyle, position: 'relative' }}>
          <div className={emptyClassName} style={emptyStyle}>Empty</div>
          {roleLabel && <span className={roleBadgeClassName} style={roleBadgeStyle(roleLabel)}>{roleLabel}</span>}
        </div>
      </div>
    );
  }

  const name = toTitleCase(seat.playerName || seat.playerId || '—');
  const chips = seat.chips ?? 0;
  const isCurrentActor = seat.isCurrentActor === true;
  const isCurrentPlayer = isMe && isCurrentActor;
  const status = (seat.status || '').toUpperCase();
  const lastAction = getActionFromSeat(seat);
  const showActionBubble = lastAction && status !== 'WINNER' && !isCurrentActor;
  const showStatusOverlay = STATUS_OVERLAY.includes(status) && (!lastAction || status === 'WINNER' || status === 'ALL_IN' || status === 'QUIT');

  return (
    <div className={wrapperClassName} style={wrapperStyle}>
      <div style={avatarWrapStyle}>
        {roleLabel && <span className={roleBadgeClassName} style={roleBadgeStyle(roleLabel)}>{roleLabel}</span>}
        {isCurrentActor && <div className={currentActorHighlightClassName} style={currentActorHighlightStyle} />}
        {showStatusOverlay && (
          <div className={status === 'WINNER' ? winnerOverlayClassName : statusOverlayClassName} style={status === 'WINNER' ? winnerOverlayStyle : statusOverlayStyle}>
            {status === 'WINNER' && winnerInfo ? (
              <>
                <span style={winnerHandRankStyle}>{formatHandRank(winnerInfo.handRank)}</span>
                <span style={winnerPayoutStyle}>+{winnerInfo.payoutAmount ?? 0}</span>
              </>
            ) : (
              status.replace(/_/g, ' ')
            )}
          </div>
        )}
        {isMe ? (
          holeCards.length > 0 && (
            <div className="seat-cards-container" style={cardsContainerStyle}>
              {holeCards.map((cardStr, index) => {
                const src = getCardSrc(cardStr);
                if (!src) return null;
                return (
                  <img
                    key={index}
                    src={src}
                    alt={`Card ${index + 1}`}
                    className="seat-card"
                    style={cardStyle(index, holeCards.length)}
                  />
                );
              })}
            </div>
          )
        ) : (
          <div className="seat-cards-container" style={cardsContainerStyle}>
            {[0, 1].map((index) => (
              <div
                key={index}
                className="seat-card-slot"
                style={emptyCardSlotStyle(index, 2)}
              >
                <div style={cardBackPatternStyle} />
                <div style={cardBackCenterStyle} />
              </div>
            ))}
          </div>
        )}
        <div className="seat-chips-line" style={chipsLineStyle}>
          <img src={CHIP_ICON} alt="" className="seat-chip-icon" style={chipIconStyle} />
          <span className="seat-chips-text" style={chipsTextStyle}>{chips.toLocaleString()}</span>
        </div>
        <div style={{ position: 'relative', width: avatarSize + 8, height: avatarSize + 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {isCurrentActor && turnTimerSeconds != null && turnTimerSeconds > 0 && (
            <TurnCountdown turnStartedAt={turnStartedAt} turnTimerSeconds={turnTimerSeconds} avatarSize={avatarSize} />
          )}
          <img src={avatarSrc} alt="" className="seat-avatar" style={avatarStyle(isMe)} />
        </div>
        <span className="seat-name-strip" style={nameStripStyle}>
          {status === 'WINNER' && <span style={{ fontSize: 9, opacity: 0.9, marginRight: 4 }}>Winner </span>}
          {name}
        </span>
      </div>
      {showActionBubble && (
        <div className={actionBubbleClassName} style={actionBubbleStyle}>
          {formatAction(lastAction)}
          <div style={actionBubbleArrowStyle} />
        </div>
      )}
      {isCurrentPlayer && (
        <span className="seat-your-turn" style={{ padding: '2px 8px', background: '#ff9800', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
          Your turn
        </span>
      )}
    </div>
  );
}

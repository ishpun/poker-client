import SeatUI from './SeatUI';

const SEAT_ANTICLOCKWISE = true;

function getSeatPosition(seatIndex, myPosition, totalSeats, radiusX = 40, radiusY = 35) {
  const relativeIndex = (seatIndex - myPosition + totalSeats) % totalSeats;
  const step = (360 / totalSeats) * (SEAT_ANTICLOCKWISE ? -1 : 1);
  const angleDeg = 90 - relativeIndex * step;
  const angleRad = (angleDeg * Math.PI) / 180;
  const x = 50 + radiusX * Math.cos(angleRad);
  const y = 50 + radiusY * Math.sin(angleRad);
  return { x, y };
}

function seatWrapperStyle(position) {
  return {
    position: 'absolute',
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: 'translate(-50%, -50%)',
  };
}

export default function TableView({ tableConfig, gameSession, myPlayerId, currentPlayer }) {
  const seatCount = tableConfig?.seatCount ?? 6;
  let seats = gameSession?.seats ?? [];
  if (seats.length === 0 && currentPlayer && currentPlayer.playerId) {
    seats = [{ ...currentPlayer, position: currentPlayer.position ?? 0 }];
  }
  const myPosition = seats.findIndex((s) => s && s.playerId === myPlayerId);
  const effectiveMyPosition = myPosition >= 0 ? myPosition : (currentPlayer?.position ?? 0);

  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
  };

  const tableWrapperStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const tableImgStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  };

  const seatsLayerStyle = {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'none',
  };

  const centerLayerStyle = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    pointerEvents: 'none',
  };

  const cardSlotSize = { width: 56, height: 78 };
  const emptySlotStyle = {
    ...cardSlotSize,
    border: '2px dashed rgba(255,255,255,0.4)',
    borderRadius: 6,
    background: 'rgba(0,0,0,0.2)',
    flexShrink: 0,
  };
  const communityCards = Array.isArray(gameSession?.communityCards) ? gameSession.communityCards : [];
  
  const parseCardString = (cardStr) => {
    if (!cardStr) return null;
    if (typeof cardStr === 'string' && cardStr.length >= 2) {
      const rankStr = cardStr.slice(0, -1);
      const suitStr = cardStr.slice(-1).toUpperCase();
      const rankMap = { A: 1, K: 13, Q: 12, J: 11 };
      const rank = rankMap[rankStr.toUpperCase()] ?? parseInt(rankStr, 10);
      if (!rank || isNaN(rank)) return null;
      return { rank, suit: suitStr };
    }
    return null;
  };

  const getCardSrc = (card) => {
    if (!card) return null;
    
    let rank, suit;
    
    if (typeof card === 'string') {
      const parsed = parseCardString(card);
      if (!parsed) return null;
      rank = parsed.rank;
      suit = parsed.suit;
    } else {
      suit = (card.suit || card.suitId || '').toString();
      rank = card.rank ?? card.value ?? card.face ?? 0;
    }
    
    if (!suit || !rank) return null;
    const suitMap = { H: 'Hearts', D: 'Diamonds', C: 'Clubs', S: 'Spades', hearts: 'Hearts', diamonds: 'Diamonds', clubs: 'Clubs', spades: 'Spades' };
    const folder = suitMap[suit.toUpperCase()] || suitMap[suit.toLowerCase()] || suit;
    return `/Cards/${folder}/${Number(rank)}.svg`;
  };


  const seatPositions = Array.from({ length: seatCount }, (_, i) => getSeatPosition(i, effectiveMyPosition, seatCount, 42, 36));
  const seatByIndex = (i) => seats.find((s) => s && Number(s.position) === i) ?? null;

  const getRoleLabel = (seatIndex) => {
    const d = gameSession?.dealerSeatIndex;
    const sb = gameSession?.smallBlindSeatIndex;
    const bb = gameSession?.bigBlindSeatIndex;
    if (d != null && Number(d) >= 0 && Number(d) === seatIndex) return 'D';
    if (sb != null && Number(sb) >= 0 && Number(sb) === seatIndex) return 'SB';
    if (bb != null && Number(bb) >= 0 && Number(bb) === seatIndex) return 'BB';
    return null;
  };

  const lastHandWinInfo = Array.isArray(gameSession?.lastHandWinInfo) ? gameSession.lastHandWinInfo : [];
  const getWinnerInfo = (seatIndex) => lastHandWinInfo.find((w) => w && Number(w.seatIndex) === seatIndex) ?? null;

  return (
    <div className="table-view-container" style={containerStyle}>
      <div className="table-view-wrapper" style={tableWrapperStyle}>
        <img src="/poker_table.png" alt="Poker table" style={tableImgStyle} />
        <div className="table-view-center-cards" style={centerLayerStyle}>
          {[0, 1, 2, 3, 4].map((i) => {
            const card = communityCards[i];
            const src = card ? getCardSrc(card) : null;
            return (
              <div key={i} className="community-card-slot" style={emptySlotStyle}>
                {src ? (
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }} />
                ) : null}
              </div>
            );
          })}
        </div>
        <div style={seatsLayerStyle}>
          {seatPositions.map((pos, i) => (
            <div key={i} style={seatWrapperStyle(pos)}>
              <SeatUI
                seat={seatByIndex(i)}
                isMe={seatByIndex(i)?.playerId === myPlayerId}
                roleLabel={getRoleLabel(i)}
                winnerInfo={getWinnerInfo(i)}
                turnStartedAt={gameSession?.turnStartedAt}
                turnTimerSeconds={gameSession?.turnTimerSeconds}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

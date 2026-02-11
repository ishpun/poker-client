import { useState, useEffect } from 'react';
import axios from 'axios';
import { submitActionUrl } from '../api/tables';

const buttonContainerStyle = {
  position: 'fixed',
  bottom: 20,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  zIndex: 1000,
  padding: '12px 20px',
  background: 'rgba(0, 0, 0, 0.8)',
  borderRadius: 12,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  flexWrap: 'wrap',
  justifyContent: 'center',
};

const sliderOverlayStyle = {
  position: 'fixed',
  bottom: 100,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1001,
  minWidth: 400,
  padding: '10px 16px',
  background: 'rgba(0, 0, 0, 0.95)',
  borderRadius: 8,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7)',
};

const buttonStyle = (action) => {
  const colors = {
    FOLD: { bg: '#d32f2f', hover: '#c62828' },
    CALL: { bg: '#1976d2', hover: '#1565c0' },
    RAISE: { bg: '#f57c00', hover: '#e65100' },
    BET: { bg: '#e65100', hover: '#ef6c00' },
    ALL_IN: { bg: '#7b1fa2', hover: '#6a1b9a' },
  };
  const color = colors[action] || { bg: '#616161', hover: '#424242' };
  
  return {
    padding: '10px 20px',
    background: color.bg,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  };
};

const sliderContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  position: 'relative',
};

const sliderWrapperStyle = {
  flex: 1,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  minHeight: 24,
  padding: '4px 0',
};

const sliderTrackStyle = {
  width: '100%',
  height: 12,
  background: '#8b0000',
  borderRadius: 6,
  border: '2px solid #000',
  position: 'relative',
  overflow: 'visible',
};

const sliderFillStyle = (percentage) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  width: `${percentage}%`,
  background: '#dc143c',
  borderRadius: '6px 0 0 6px',
  border: '2px solid #000',
  borderRight: 'none',
});

const sliderInputStyle = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  minHeight: 24,
  opacity: 0,
  cursor: 'grab',
  zIndex: 5,
  top: '50%',
  transform: 'translateY(-50%)',
  margin: 0,
  padding: 0,
};

const sliderThumbStyle = (percentage) => ({
  position: 'absolute',
  left: `calc(${percentage}% - 10px)`,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 20,
  height: 24,
  background: '#4a4a4a',
  border: '2px solid #000',
  borderRadius: 4,
  pointerEvents: 'none',
  zIndex: 3,
});

const tooltipStyle = {
  position: 'absolute',
  bottom: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  marginBottom: 6,
  padding: '4px 10px',
  background: '#fff',
  color: '#000',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 700,
  whiteSpace: 'nowrap',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  zIndex: 4,
};

const tooltipArrowStyle = {
  position: 'absolute',
  top: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 0,
  height: 0,
  borderLeft: '6px solid transparent',
  borderRight: '6px solid transparent',
  borderTop: '8px solid #fff',
};

const decreaseButtonStyle = {
  width: 32,
  height: 32,
  background: '#4a4a4a',
  border: '2px solid #000',
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
};

const okButtonStyle = {
  padding: '6px 20px',
  background: '#4a4a4a',
  border: '2px solid #000',
  borderRadius: 6,
  color: '#fff',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  flexShrink: 0,
};

export default function ActionButtons({ allowedActions, tableId, seatIndex, playerId, sessionId, onActionSubmitted }) {
  const [sliderMode, setSliderMode] = useState(null);
  const [sliderAmount, setSliderAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const raiseAction = allowedActions?.find(a => a.action === 'RAISE');
  const betAction = allowedActions?.find(a => a.action === 'BET');
  const minRaise = raiseAction?.minRaiseAmount ?? 0;
  const maxRaise = raiseAction?.maxRaiseAmount ?? 0;
  const minBet = betAction?.minRaiseAmount ?? 0;
  const maxBet = betAction?.maxRaiseAmount ?? 0;

  const showSlider = sliderMode !== null;
  const minVal = sliderMode === 'BET' ? minBet : minRaise;
  const maxVal = sliderMode === 'BET' ? maxBet : maxRaise;

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showSlider) {
        setSliderMode(null);
        setSliderAmount(0);
      }
    };
    if (showSlider) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [showSlider]);

  if (!allowedActions || allowedActions.length === 0) {
    return null;
  }

  const getBetAmountForAction = (action, overrideAmount = null) => {
    if (overrideAmount !== null) return overrideAmount;
    const actionData = allowedActions.find(a => a.action === action);
    if (action === 'CALL' || action === 'ALL_IN') return actionData?.callAmount ?? 0;
    if (action === 'RAISE') return actionData ? (actionData.minRaiseAmount ?? 0) : 0;
    if (action === 'BET') return actionData ? (actionData.minRaiseAmount ?? 0) : 0;
    return 0;
  };

  const handleAction = async (action, betAmount = null) => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      const amount = getBetAmountForAction(action, betAmount);
      const payload = {
        action,
        amount,
        sessionId,
        playerId,
        tableId,
      };
      
      const url = submitActionUrl();
      await axios.post(url, payload);
      
      if (action === 'RAISE' || action === 'BET') {
        setSliderMode(null);
        setSliderAmount(0);
      }
      
      if (onActionSubmitted) {
        onActionSubmitted();
      }
    } catch (error) {
      console.error('Error submitting action:', error);
      alert(error.response?.data?.message || 'Failed to submit action');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRaiseClick = () => {
    if (raiseAction) {
      setSliderAmount(minRaise);
      setSliderMode('RAISE');
    }
  };

  const handleBetClick = () => {
    if (betAction) {
      setSliderAmount(minBet);
      setSliderMode('BET');
    }
  };

  const handleSliderSubmit = () => {
    handleAction(sliderMode, sliderAmount);
  };

  const handleSliderChange = (e) => {
    const rawValue = parseFloat(e.target.value);
    const range = maxVal - minVal;
    const step = Math.max(1, Math.floor(range / 500));
    if (rawValue >= maxVal - (step * 2)) {
      setSliderAmount(maxVal);
    } else {
      const steppedValue = Math.round(rawValue / step) * step;
      setSliderAmount(Math.max(minVal, Math.min(maxVal, steppedValue)));
    }
  };

  const handleSliderMouseDown = (e) => {
    e.target.style.cursor = 'grabbing';
  };

  const handleSliderMouseUp = (e) => {
    e.target.style.cursor = 'grab';
  };

  const handleDecrease = () => {
    const step = Math.max(1, Math.floor((maxVal - minVal) / 200));
    const newValue = Math.max(minVal, sliderAmount - step);
    setSliderAmount(newValue);
  };

  const percentage = maxVal > minVal 
    ? ((sliderAmount - minVal) / (maxVal - minVal)) * 100 
    : 0;

  return (
    <>
      {showSlider && (
        <div style={sliderOverlayStyle}>
          <div style={sliderContainerStyle}>
            <button
              onClick={handleDecrease}
              style={decreaseButtonStyle}
              disabled={submitting || sliderAmount <= minVal}
              onMouseEnter={(e) => {
                if (!submitting && sliderAmount > minVal) {
                  e.target.style.background = '#5a5a5a';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#4a4a4a';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div style={sliderWrapperStyle}>
              <div style={sliderTrackStyle}>
                <div style={sliderFillStyle(percentage)} />
                <div style={sliderThumbStyle(percentage)}>
                  <div style={tooltipStyle}>
                    ${sliderAmount.toLocaleString()}
                    <div style={tooltipArrowStyle} />
                  </div>
                </div>
                <input
                  type="range"
                  min={minVal}
                  max={maxVal}
                  value={sliderAmount}
                  onChange={handleSliderChange}
                  onInput={handleSliderChange}
                  onMouseDown={handleSliderMouseDown}
                  onMouseUp={handleSliderMouseUp}
                  onMouseLeave={handleSliderMouseUp}
                  style={sliderInputStyle}
                  step={Math.max(1, Math.floor((maxVal - minVal) / 200))}
                />
              </div>
            </div>
            <button
              onClick={handleSliderSubmit}
              style={okButtonStyle}
              disabled={submitting}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.target.style.background = '#5a5a5a';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#4a4a4a';
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
      <div style={buttonContainerStyle}>
        {allowedActions.map((actionData) => {
          const { action, callAmount } = actionData;
          const displayAmount = (action === 'CALL' || action === 'ALL_IN') ? callAmount : null;
          
          if (action === 'RAISE') {
            return (
              <button
                key={action}
                onClick={handleRaiseClick}
                style={buttonStyle(action)}
                disabled={submitting}
                onMouseEnter={(e) => {
                  if (!submitting) e.target.style.background = buttonStyle(action).hover;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = buttonStyle(action).bg;
                }}
              >
                {action} ({minRaise}-{maxRaise})
              </button>
            );
          }

          if (action === 'BET') {
            return (
              <button
                key={action}
                onClick={handleBetClick}
                style={buttonStyle(action)}
                disabled={submitting}
                onMouseEnter={(e) => {
                  if (!submitting) e.target.style.background = buttonStyle(action).hover;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = buttonStyle(action).bg;
                }}
              >
                {action} ({minBet}-{maxBet})
              </button>
            );
          }

          return (
            <button
              key={action}
              onClick={() => handleAction(action)}
              style={buttonStyle(action)}
              disabled={submitting}
              onMouseEnter={(e) => {
                if (!submitting) e.target.style.background = buttonStyle(action).hover;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = buttonStyle(action).bg;
              }}
            >
              {action} {displayAmount != null && displayAmount > 0 ? `(${displayAmount})` : ''}
            </button>
          );
        })}
      </div>
    </>
  );
}

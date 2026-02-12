import { useState, useEffect, useRef } from 'react';

/**
 * Countdown timer for the current player's turn.
 * remaining = turnTimerSeconds - (now - turnStartedAt) in seconds.
 * If some time already passed since turnStartedAt, that difference is subtracted so the timer shows remaining time.
 *
 * Example:
 *   turnStartedAt = "2026-02-12T09:05:13.078Z", turnTimerSeconds = 47
 *   Current time = 09:05:20 (7 sec later) → remaining = 47 - 7 = 40
 *   Number: 40, 39, 38... countdown
 *   Circle: 47 = 100%. So 40 left → circle starts at (40/47)*100 ≈ 85%, then 85%→0% (not from 100%)
 */
const AVATAR_SIZE_DEFAULT = 85;
const RING_STROKE = 4;

export default function TurnCountdown({ turnStartedAt, turnTimerSeconds, avatarSize = AVATAR_SIZE_DEFAULT }) {
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!turnStartedAt || turnTimerSeconds == null || turnTimerSeconds <= 0) {
      setRemainingSeconds(null);
      return;
    }

    const computeRemaining = () => {
      const startedAt = new Date(turnStartedAt).getTime();
      const now = Date.now();
      const elapsedSeconds = (now - startedAt) / 1000;
      return Math.max(0, Math.ceil(turnTimerSeconds - elapsedSeconds));
    };

    setRemainingSeconds(computeRemaining());

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev == null) return null;
        const next = prev - 1;
        if (next <= 0 && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return next <= 0 ? 0 : next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [turnStartedAt, turnTimerSeconds]);

  if (remainingSeconds == null || remainingSeconds < 0) return null;

  const totalSeconds = Number(turnTimerSeconds) || 1;
  const progressPercent = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;

  const size = avatarSize + RING_STROKE * 2;
  const cx = size / 2;
  const r = avatarSize / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div
      className="turn-countdown"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: size,
        height: size,
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block', transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={RING_STROKE}
        />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={remainingSeconds <= 5 ? '#f44336' : '#4caf50'}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progressPercent / 100)}
          style={{ transition: 'stroke 0.2s' }}
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 28,
          fontWeight: 800,
          color: '#fff',
          textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.6)',
        }}
      >
        {remainingSeconds}
      </span>
    </div>
  );
}

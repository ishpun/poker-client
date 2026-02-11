import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sessionId: null,
  currentStreet: null,
  street: null,
  potAmount: null,
  currentBetToMatch: null,
  dealerSeatIndex: null,
  smallBlindSeatIndex: null,
  bigBlindSeatIndex: null,
  currentActorSeatIndex: null,
  seats: [],
  communityCards: [],
  canStartHand: false,
  allowedActions: [],
  lastHandWinInfo: [],
};

const gameSessionSlice = createSlice({
  name: 'gameSession',
  initialState,
  reducers: {
    setGameSession: (state, { payload }) => {
      if (!payload) return; // Don't reset, just skip update
      if (payload.sessionId !== undefined) state.sessionId = payload.sessionId ?? null;
      if (payload.currentStreet !== undefined) state.currentStreet = payload.currentStreet ?? null;
      if (payload.status !== undefined) state.status = payload.status ?? null;
      if (payload.potAmount !== undefined) state.potAmount = payload.potAmount ?? null;
      if (payload.currentBetToMatch !== undefined) state.currentBetToMatch = payload.currentBetToMatch ?? null;
      if (payload.dealerSeatIndex !== undefined) state.dealerSeatIndex = payload.dealerSeatIndex ?? null;
      if (payload.smallBlindSeatIndex !== undefined) state.smallBlindSeatIndex = payload.smallBlindSeatIndex ?? null;
      if (payload.bigBlindSeatIndex !== undefined) state.bigBlindSeatIndex = payload.bigBlindSeatIndex ?? null;
      if (payload.currentActorSeatIndex !== undefined) state.currentActorSeatIndex = payload.currentActorSeatIndex ?? null;
      if (payload.seats !== undefined) state.seats = Array.isArray(payload.seats) ? payload.seats : [];
      if (payload.communityCards !== undefined) state.communityCards = Array.isArray(payload.communityCards) ? payload.communityCards : [];
      if (payload.canStartHand !== undefined) state.canStartHand = Boolean(payload.canStartHand);
      if (payload.allowedActions !== undefined) state.allowedActions = Array.isArray(payload.allowedActions) ? payload.allowedActions : [];
      if (payload.lastHandWinInfo !== undefined) state.lastHandWinInfo = Array.isArray(payload.lastHandWinInfo) ? payload.lastHandWinInfo : [];
    },
    clearGameSession: () => initialState,
  },
});

export const { setGameSession, clearGameSession } = gameSessionSlice.actions;
export default gameSessionSlice.reducer;

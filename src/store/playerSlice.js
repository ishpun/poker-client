import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  position: null,
  playerId: null,
  playerName: null,
  playerAvatar: null,
  chips: null,
  status: null,
  holeCards: [],
  isCurrentActor: false,
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setPlayer: (state, { payload }) => {
      if (!payload) return; // Don't reset, just skip update
      if (payload.position !== undefined) state.position = payload.position ?? null;
      if (payload.playerId !== undefined) state.playerId = payload.playerId ?? null;
      if (payload.playerName !== undefined) state.playerName = payload.playerName ?? null;
      if (payload.playerAvatar !== undefined) state.playerAvatar = payload.playerAvatar ?? null;
      if (payload.chips !== undefined) state.chips = payload.chips ?? null;
      if (payload.status !== undefined) state.status = payload.status ?? null;
      if (payload.holeCards !== undefined) state.holeCards = Array.isArray(payload.holeCards) ? payload.holeCards : [];
      if (payload.isCurrentActor !== undefined) state.isCurrentActor = Boolean(payload.isCurrentActor);
    },
    clearPlayer: () => initialState,
  },
});

export const { setPlayer, clearPlayer } = playerSlice.actions;
export default playerSlice.reducer;
